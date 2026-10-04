(function () {
  "use strict";

  var MODAL_ID = "spgTemplatePreviewProfessional";
  var PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";
  var THUMB_SCALE = 0.14;
  var ZOOM_STEP = 0.15;
  var MIN_SCALE = 0.35;
  var MAX_SCALE = 2.5;

  var pdfDoc = null;
  var pdfUrl = "";
  var pageCount = 0;
  var currentPage = 1;
  var scale = 1;
  var fitMode = "width";
  var pageViews = [];
  var thumbButtons = [];
  var scrollEl = null;
  var observer = null;
  var loadingPdf = false;
  var pdfjsReady = false;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function show(el, on) {
    if (!el) return;
    el.classList.toggle("d-none", !on);
  }

  function setDisabled(btn, disabled) {
    if (!btn) return;
    btn.disabled = disabled;
    btn.setAttribute("aria-disabled", disabled ? "true" : "false");
    btn.classList.toggle("opacity-50", disabled);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        resolve();
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensurePdfJs() {
    if (window.pdfjsLib) {
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          PDFJS_CDN + "/pdf.worker.min.js";
      }
      pdfjsReady = true;
      return Promise.resolve(window.pdfjsLib);
    }
    if (pdfjsReady && window.pdfjsLib) {
      return Promise.resolve(window.pdfjsLib);
    }
    return loadScript(PDFJS_CDN + "/pdf.min.js").then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        PDFJS_CDN + "/pdf.worker.min.js";
      pdfjsReady = true;
      return window.pdfjsLib;
    });
  }

  function resolvePdfUrl(src) {
    try {
      return new URL(src, document.baseURI || window.location.href).href;
    } catch (e) {
      return src;
    }
  }

  function loadPdfDocument(pdfjsLib, url) {
    return fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          var httpErr = new Error("HTTP_" + res.status);
          httpErr.status = res.status;
          throw httpErr;
        }
        return res.arrayBuffer();
      })
      .then(function (data) {
        if (!data || data.byteLength < 5) {
          throw new Error("EMPTY_PDF");
        }
        var head = new Uint8Array(data.slice(0, 4));
        var sig = String.fromCharCode(head[0], head[1], head[2], head[3]);
        if (sig !== "%PDF") {
          throw new Error("INVALID_PDF");
        }
        return pdfjsLib.getDocument({ data: data }).promise;
      })
      .catch(function (err) {
        if (
          err &&
          (err.message === "EMPTY_PDF" ||
            err.message === "INVALID_PDF" ||
            (err.message && err.message.indexOf("HTTP_") === 0))
        ) {
          throw err;
        }
        return pdfjsLib.getDocument({ url: url }).promise;
      });
  }

  function formatLoadError(err, resolvedUrl) {
    if (err && err.message === "PDFJS_LOAD") {
      return "تعذر تحميل مكتبة المعاينة (PDF.js). تحقق من الاتصال بالإنترنت أو جرّب تحديث الصفحة.";
    }
    if (err && err.message === "EMPTY_PDF") {
      return (
        "ملف PDF فارغ أو تالف. استبدل الملف بقالب حقيقي: assets/spg/templates/professional-proposal.pdf"
      );
    }
    if (err && err.message === "INVALID_PDF") {
      return "الملف الموجود ليس PDF صالحًا. تحقق من: " + resolvedUrl;
    }
    if (err && err.message === "HTTP_404") {
      return (
        "لم يُعثر على الملف (404). افتح الصفحة عبر خادم محلي (مثل Live Server) من جذر المشروع. المسار: " +
        resolvedUrl
      );
    }
    if (window.location.protocol === "file:") {
      return (
        "تعذر تحميل PDF عند فتح الملف مباشرة (file://). شغّل المشروع عبر خادم محلي ثم افتح smart-proposal-template.html — " +
        resolvedUrl
      );
    }
    return "تعذر تحميل ملف PDF. تحقق من المسار: " + resolvedUrl;
  }

  function getViewerRoot() {
    return $("#spgProfessionalPdfViewer");
  }

  function updatePageIndicator() {
    var el = $(".spg-pdf-page-indicator", getViewerRoot());
    if (el) {
      el.textContent = pageCount
        ? currentPage + " / " + pageCount
        : "— / —";
    }
    setDisabled($(".spg-pdf-prev", getViewerRoot()), currentPage <= 1);
    setDisabled(
      $(".spg-pdf-next", getViewerRoot()),
      pageCount === 0 || currentPage >= pageCount
    );
  }

  function updateZoomIndicator() {
    var el = $(".spg-pdf-zoom-value", getViewerRoot());
    if (el) {
      el.textContent = Math.round(scale * 100) + "%";
    }
  }

  function setActiveThumb(pageNum) {
    thumbButtons.forEach(function (btn) {
      var n = Number(btn.dataset.page);
      btn.classList.toggle("active", n === pageNum);
    });
  }

  function scrollToPage(pageNum, behavior) {
    var view = pageViews[pageNum - 1];
    if (!view || !scrollEl) return;
    scrollEl.scrollTo({
      top: view.offsetTop - 12,
      behavior: behavior || "smooth",
    });
  }

  function computeFitScale(pageNum, mode) {
    if (!pdfDoc || !scrollEl) return scale;
    return pdfDoc.getPage(pageNum).then(function (page) {
      var base = page.getViewport({ scale: 1 });
      var pad = 24;
      var w = scrollEl.clientWidth - pad;
      var h = scrollEl.clientHeight - pad;
      if (mode === "page") {
        return Math.min(w / base.width, h / base.height);
      }
      return w / base.width;
    });
  }

  function renderPageCanvas(pageNum, canvas, renderScale) {
    return pdfDoc.getPage(pageNum).then(function (page) {
      var viewport = page.getViewport({ scale: renderScale });
      var ctx = canvas.getContext("2d");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      return page.render({ canvasContext: ctx, viewport: viewport }).promise;
    });
  }

  function renderAllPages() {
    var jobs = pageViews.map(function (view, idx) {
      var canvas = $("canvas", view);
      return renderPageCanvas(idx + 1, canvas, scale);
    });
    return Promise.all(jobs);
  }

  function renderThumbnails() {
    var list = $("#spgProfessionalPdfThumbnails");
    if (!list) return Promise.resolve();
    list.innerHTML = "";
    thumbButtons = [];

    var tasks = [];
    for (var i = 1; i <= pageCount; i++) {
      (function (pageNum) {
        tasks.push(
          pdfDoc.getPage(pageNum).then(function (page) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "spg-pdf-thumb-btn";
            btn.dataset.page = String(pageNum);
            btn.setAttribute("role", "listitem");
            btn.setAttribute("aria-label", "الصفحة " + pageNum);

            var canvas = document.createElement("canvas");
            canvas.className = "spg-pdf-thumb-canvas";
            btn.appendChild(canvas);

            var label = document.createElement("span");
            label.className = "spg-pdf-thumb-label ff-onest fz-10";
            label.textContent = String(pageNum);
            btn.appendChild(label);

            btn.addEventListener("click", function () {
              scrollToPage(pageNum, "smooth");
            });

            list.appendChild(btn);
            thumbButtons.push(btn);

            return renderPageCanvas(pageNum, canvas, THUMB_SCALE);
          })
        );
      })(i);
    }
    return Promise.all(tasks).then(function () {
      setActiveThumb(currentPage);
    });
  }

  function buildPageShells() {
    scrollEl = $("#spgProfessionalPdfPagesScroll");
    if (!scrollEl) return;
    scrollEl.innerHTML = "";
    pageViews = [];

    for (var i = 1; i <= pageCount; i++) {
      var wrap = document.createElement("article");
      wrap.className = "spg-document-preview-page spg-pdf-page-shell";
      wrap.dataset.page = String(i);

      var canvas = document.createElement("canvas");
      canvas.className = "spg-pdf-page-canvas";
      canvas.setAttribute("aria-label", "صفحة " + i + " من العرض");
      wrap.appendChild(canvas);
      scrollEl.appendChild(wrap);
      pageViews.push(wrap);
    }
  }

  function setupScrollObserver() {
    if (observer) {
      observer.disconnect();
    }
    if (!scrollEl || !pageViews.length) return;

    observer = new IntersectionObserver(
      function (entries) {
        var best = null;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (
              !best ||
              entry.intersectionRatio > best.intersectionRatio
            ) {
              best = entry;
            }
          }
        });
        if (best && best.target.dataset.page) {
          var n = Number(best.target.dataset.page);
          if (n !== currentPage) {
            currentPage = n;
            updatePageIndicator();
            setActiveThumb(n);
          }
        }
      },
      { root: scrollEl, threshold: [0.35, 0.55, 0.75] }
    );

    pageViews.forEach(function (view) {
      observer.observe(view);
    });
  }

  function applyFit(mode) {
    fitMode = mode;
    return computeFitScale(currentPage, mode).then(function (next) {
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      updateZoomIndicator();
      return renderAllPages();
    });
  }

  function bindToolbar() {
    var root = getViewerRoot();
    if (!root || root.dataset.bound === "1") return;
    root.dataset.bound = "1";

    $(".spg-pdf-prev", root).addEventListener("click", function () {
      if (currentPage > 1) scrollToPage(currentPage - 1, "smooth");
    });
    $(".spg-pdf-next", root).addEventListener("click", function () {
      if (currentPage < pageCount) scrollToPage(currentPage + 1, "smooth");
    });
    $(".spg-pdf-zoom-in", root).addEventListener("click", function () {
      fitMode = "custom";
      scale = Math.min(MAX_SCALE, scale + ZOOM_STEP);
      updateZoomIndicator();
      renderAllPages();
    });
    $(".spg-pdf-zoom-out", root).addEventListener("click", function () {
      fitMode = "custom";
      scale = Math.max(MIN_SCALE, scale - ZOOM_STEP);
      updateZoomIndicator();
      renderAllPages();
    });
    $(".spg-pdf-fit-width", root).addEventListener("click", function () {
      applyFit("width");
    });
    $(".spg-pdf-fit-page", root).addEventListener("click", function () {
      applyFit("page");
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      if (!pdfDoc || fitMode === "custom") return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        applyFit(fitMode);
      }, 150);
    });
  }

  function showError(msg) {
    var err = $("#spgProfessionalPdfError");
    if (err) err.textContent = msg;
    show($("#spgProfessionalPdfLoading"), false);
    show(err, true);
  }

  function loadPdf() {
    if (pdfDoc || loadingPdf) return;
    var root = getViewerRoot();
    if (!root) return;

    var pdfSrc = root.getAttribute("data-pdf-src") || "";
    if (!pdfSrc) {
      showError("تعذر العثور على ملف المعاينة.");
      return;
    }
    pdfUrl = resolvePdfUrl(pdfSrc);

    loadingPdf = true;
    show($("#spgProfessionalPdfLoading"), true);
    show($("#spgProfessionalPdfError"), false);

    ensurePdfJs()
      .catch(function () {
        var e = new Error("PDFJS_LOAD");
        throw e;
      })
      .then(function (pdfjsLib) {
        return loadPdfDocument(pdfjsLib, pdfUrl);
      })
      .then(function (doc) {
        pdfDoc = doc;
        pageCount = doc.numPages;
        currentPage = 1;
        buildPageShells();
        return applyFit("width");
      })
      .then(function () {
        return renderThumbnails();
      })
      .then(function () {
        setupScrollObserver();
        updatePageIndicator();
        updateZoomIndicator();
        show($("#spgProfessionalPdfLoading"), false);
        loadingPdf = false;
      })
      .catch(function (err) {
        loadingPdf = false;
        showError(formatLoadError(err, pdfUrl));
      });
  }

  function resetViewer() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    pdfDoc = null;
    pageCount = 0;
    currentPage = 1;
    pageViews = [];
    thumbButtons = [];
    loadingPdf = false;

    var list = $("#spgProfessionalPdfThumbnails");
    if (list) list.innerHTML = "";
    if (scrollEl) scrollEl.innerHTML = "";
    updatePageIndicator();
    updateZoomIndicator();
  }

  function init() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    bindToolbar();

    modal.addEventListener("shown.bs.modal", function () {
      loadPdf();
    });

    modal.addEventListener("hidden.bs.modal", function () {
      resetViewer();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
