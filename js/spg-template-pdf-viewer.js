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
  var pageRotation = 0;
  var pageViews = [];
  var thumbButtons = [];
  var scrollEl = null;
  var observer = null;
  var loadingPdf = false;
  var pdfjsReady = false;
  var standaloneMode = false;
  var workspaceEl = null;

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

  function isStandaloneViewer() {
    var root = getViewerRoot();
    return (
      root &&
      root.getAttribute("data-spg-pdf-standalone") === "1"
    );
  }

  function getWorkspaceEl() {
    return (
      workspaceEl ||
      document.getElementById("spgTemplatePreviewPage") ||
      getViewerRoot()
    );
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
      var base = page.getViewport({
        scale: 1,
        rotation: pageRotation,
      });
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
      var viewport = page.getViewport({
        scale: renderScale,
        rotation: pageRotation,
      });
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
            syncMobilePageSelect(n);
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

  function populateMobilePageSelect() {
    var select = document.getElementById(
      "spgPdfMobilePageSelect"
    );
    if (!select || !pageCount) return;

    select.innerHTML = "";
    for (var i = 1; i <= pageCount; i++) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = "صفحة " + i;
      select.appendChild(opt);
    }
    select.value = String(currentPage);
  }

  function syncMobilePageSelect(pageNum) {
    var select = document.getElementById(
      "spgPdfMobilePageSelect"
    );
    if (select && pageNum) {
      select.value = String(pageNum);
    }
  }

  function setSearchStatus(message, visible) {
    var el = document.getElementById(
      "spgPdfSearchStatus"
    );
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("d-none", !visible);
  }

  function runPdfSearch(query) {
    if (!pdfDoc || !query) {
      setSearchStatus("", false);
      return Promise.resolve();
    }

    var needle = query.trim().toLowerCase();
    if (!needle) {
      setSearchStatus("", false);
      return Promise.resolve();
    }

    setSearchStatus("جاري البحث…", true);

    var chain = Promise.resolve();
    for (var p = 1; p <= pageCount; p++) {
      (function (pageNum) {
        chain = chain.then(function () {
          return pdfDoc.getPage(pageNum).then(function (page) {
            return page.getTextContent().then(function (content) {
              var text = content.items
                .map(function (item) {
                  return item.str || "";
                })
                .join(" ")
                .toLowerCase();
              if (text.indexOf(needle) !== -1) {
                throw { foundPage: pageNum };
              }
            });
          });
        });
      })(p);
    }

    return chain
      .then(function () {
        setSearchStatus(
          "لم يُعثر على نتائج لـ «" + query.trim() + "»",
          true
        );
      })
      .catch(function (err) {
        if (err && err.foundPage) {
          scrollToPage(err.foundPage, "smooth");
          setSearchStatus(
            "تم العثور على نتيجة في الصفحة " + err.foundPage,
            true
          );
        }
      });
  }

  function resolveFullscreenTarget(btn) {
    if (!btn) return null;
    var selector = btn.getAttribute("data-spg-fullscreen-target");
    if (selector) {
      return document.querySelector(selector);
    }
    if (btn.closest("#spgProfessionalPdfViewer")) {
      return getWorkspaceEl();
    }
    var editorMain = btn.closest(".spg-proposal-editor-main");
    if (editorMain) {
      return (
        document.getElementById("spgProposalEditorMain") || editorMain
      );
    }
    return null;
  }

  function toggleFullscreenForTarget(target) {
    if (!target) return;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function bindFullscreenButton(btn) {
    if (!btn || btn.dataset.spgFullscreenBound === "1") return;
    btn.dataset.spgFullscreenBound = "1";
    btn.addEventListener("click", function () {
      toggleFullscreenForTarget(resolveFullscreenTarget(btn));
    });
  }

  function bindStandaloneFullscreenButtons() {
    document.querySelectorAll(".spg-pdf-fullscreen").forEach(bindFullscreenButton);
  }

  function bindToolbar() {
    var root = getViewerRoot();
    if (!root || root.dataset.bound === "1") return;
    root.dataset.bound = "1";

    var prevBtn = $(".spg-pdf-prev", root);
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (currentPage > 1) scrollToPage(currentPage - 1, "smooth");
      });
    }

    var nextBtn = $(".spg-pdf-next", root);
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (currentPage < pageCount) scrollToPage(currentPage + 1, "smooth");
      });
    }

    var zoomIn = $(".spg-pdf-zoom-in", root);
    if (zoomIn) {
      zoomIn.addEventListener("click", function () {
        fitMode = "custom";
        scale = Math.min(MAX_SCALE, scale + ZOOM_STEP);
        updateZoomIndicator();
        renderAllPages();
      });
    }

    var zoomOut = $(".spg-pdf-zoom-out", root);
    if (zoomOut) {
      zoomOut.addEventListener("click", function () {
        fitMode = "custom";
        scale = Math.max(MIN_SCALE, scale - ZOOM_STEP);
        updateZoomIndicator();
        renderAllPages();
      });
    }

    var fitWidth = $(".spg-pdf-fit-width", root);
    if (fitWidth) {
      fitWidth.addEventListener("click", function () {
        applyFit("width");
      });
    }

    var fitPage = $(".spg-pdf-fit-page", root);
    if (fitPage) {
      fitPage.addEventListener("click", function () {
        applyFit("page");
      });
    }

    var mobileSelect = document.getElementById(
      "spgPdfMobilePageSelect"
    );
    if (mobileSelect) {
      mobileSelect.addEventListener("change", function () {
        var n = Number(mobileSelect.value);
        if (n) scrollToPage(n, "smooth");
      });
    }

    var searchToggle = $(".spg-pdf-search-toggle", root);
    var searchInput = document.getElementById(
      "spgPdfSearchInput"
    );
    var searchRun = $(".spg-pdf-search-run", root);

    if (searchToggle && searchInput) {
      searchToggle.addEventListener("click", function () {
        searchInput.classList.toggle("d-none");
        var hidden = searchInput.classList.contains("d-none");
        searchToggle.setAttribute(
          "aria-expanded",
          hidden ? "false" : "true"
        );
        if (searchRun) {
          searchRun.classList.toggle("d-none", hidden);
        }
        if (!hidden) searchInput.focus();
      });

      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          runPdfSearch(searchInput.value);
        }
      });
    }

    if (searchRun && searchInput) {
      searchRun.addEventListener("click", function () {
        runPdfSearch(searchInput.value);
      });
    }

    var rotateCw = $(".spg-pdf-rotate-cw", root);
    if (rotateCw) {
      rotateCw.addEventListener("click", function () {
        pageRotation = (pageRotation + 90) % 360;
        if (fitMode === "custom") {
          renderAllPages().then(renderThumbnails);
        } else {
          applyFit(fitMode).then(renderThumbnails);
        }
      });
    }

    var rotateCcw = $(".spg-pdf-rotate-ccw", root);
    if (rotateCcw) {
      rotateCcw.addEventListener("click", function () {
        pageRotation = (pageRotation + 270) % 360;
        if (fitMode === "custom") {
          renderAllPages().then(renderThumbnails);
        } else {
          applyFit(fitMode).then(renderThumbnails);
        }
      });
    }

    bindFullscreenButton($(".spg-pdf-fullscreen", root));

    var printBtn = $(".spg-pdf-print", root);
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        if (!pdfUrl) return;
        var w = window.open(pdfUrl, "_blank");
        if (w) {
          w.addEventListener("load", function () {
            w.focus();
            w.print();
          });
        }
      });
    }

    var downloadLink = $(".spg-pdf-download", root);
    if (downloadLink && !downloadLink.getAttribute("href")) {
      downloadLink.setAttribute("href", pdfUrl || "#");
    }

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

    var downloadEl = $(".spg-pdf-download", root);
    if (downloadEl) {
      downloadEl.setAttribute("href", pdfUrl);
    }

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
        populateMobilePageSelect();
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
    pageRotation = 0;

    var list = $("#spgProfessionalPdfThumbnails");
    if (list) list.innerHTML = "";
    if (scrollEl) scrollEl.innerHTML = "";
    updatePageIndicator();
    updateZoomIndicator();
  }

  function init() {
    bindStandaloneFullscreenButtons();

    var root = getViewerRoot();
    if (!root) return;

    standaloneMode = isStandaloneViewer();
    workspaceEl =
      document.getElementById("spgTemplatePreviewPage") ||
      document.getElementById("spgEditorPdfViewerPage");

    bindToolbar();

    if (standaloneMode) {
      loadPdf();
      return;
    }

    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;

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
