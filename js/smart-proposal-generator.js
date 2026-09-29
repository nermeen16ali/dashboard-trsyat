(function () {
  "use strict";

  const TOTAL_STEPS = 5;
  const SPG_CORE_SECTION_COUNT = 5;

  const STEP_HEADINGS = [
    "بيانات المناقصة / المشروع",
    "مستندات المناقصة",
    "فريق العمل",
    "العقود السابقة",
    "مستوى التفصيل",
  ];

  /** Maps saved step index from the previous 6-step wizard. */
  function normalizeWizardStep(step) {
    const n = Number(step) || 1;
    if (n <= 1) return 1;
    if (n === 2) return 1;
    return Math.min(TOTAL_STEPS, n - 1);
  }

  const DETAIL_PAGE_RANGES = {
    detailed: [13, 16],
    medium: [10, 13],
    brief: [6, 9],
  };

  let projects = [];
  let activeProjectId = null;
  let view = "landing";
  let wizardStep = 1;
  let documentFormEditingId = null;
  let documentUploadBound = false;
  let teamFormEditingId = null;
  let contractFormEditingId = null;
  let teamContractFormsBound = false;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const SPG_SWAL_TIMER_MS = 1800;

  const SPG_SWAL_SUCCESS_ICON_HTML = `<div class="spg-swal-check-icon" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle class="spg-swal-check-circle" cx="20" cy="20" r="17" stroke="#00A640" stroke-width="2" fill="none"/>
      <path class="spg-swal-check-path" d="M12.5 20.2L17.8 25.5L27.5 14.8" stroke="#00A640" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  </div>`;

  const SPG_SWAL_DELETE_ICON_HTML = `<div class="spg-swal-trash-icon" aria-hidden="true">
    <img src="images/trash.svg" width="32" height="32" alt="">
  </div>`;

  function spgSwalAvailable() {
    return typeof Swal !== "undefined" && typeof Swal.fire === "function";
  }

  function spgAlertSuccessCompact(title, text) {
    if (!spgSwalAvailable()) return;
    Swal.fire({
      title,
      text,
      iconHtml: SPG_SWAL_SUCCESS_ICON_HTML,
      showConfirmButton: false,
      timer: SPG_SWAL_TIMER_MS,
      timerProgressBar: false,
      dir: "rtl",
      customClass: {
        popup: "swal2-spg-success-compact",
        title: "swal2-spg-success-title",
        htmlContainer: "swal2-spg-success-text",
        icon: "swal2-spg-success-icon",
      },
      buttonsStyling: false,
    });
  }

  function spgAlertAdded() {
    spgAlertSuccessCompact("تمت الإضافة بنجاح", "تمت إضافة العنصر بنجاح.");
  }

  function spgAlertSaved() {
    spgAlertSuccessCompact("تم الحفظ بنجاح", "تم تحديث البيانات بنجاح.");
  }

  function spgAlertDeleted() {
    spgAlertSuccessCompact("تم الحذف بنجاح", "تم حذف العنصر بنجاح.");
  }

  function spgConfirmDelete() {
    if (!spgSwalAvailable()) {
      return Promise.resolve(window.confirm("هل أنت متأكد؟"));
    }
    return Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف هذا العنصر ولا يمكن التراجع عن هذه العملية.",
      iconHtml: SPG_SWAL_DELETE_ICON_HTML,
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      focusCancel: true,
      reverseButtons: true,
      dir: "rtl",
      customClass: {
        popup: "swal2-spg-confirm",
        title: "swal2-spg-confirm-title",
        htmlContainer: "swal2-spg-confirm-text",
        icon: "swal2-spg-confirm-icon",
        confirmButton: "btn-main badge-rejected swal2-spg-confirm-delete",
        cancelButton: "btn-main btn-primary-outline swal2-spg-confirm-cancel",
        actions: "swal2-spg-confirm-actions",
      },
      buttonsStyling: false,
    }).then((result) => result.isConfirmed === true);
  }

  function uid() {
    return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function entryId() {
    return "e-" + Math.random().toString(36).slice(2, 9);
  }

  function defaultProject(title) {
    return {
      id: uid(),
      title: title || "مشروع جديد",
      proposalType: null,
      view: "landing",
      wizardStep: 1,
      projectName: "",
      tenderNumber: "",
      hasDocs: false,
      documents: [],
      hasTeam: false,
      team: [],
      hasContracts: false,
      contracts: [],
      detailLevel: "detailed",
      updatedAt: Date.now(),
    };
  }

  /** Persistence is handled by ASP.NET backend — not browser storage. */
  function saveProjects() {}

  function getActiveProject() {
    return projects.find((p) => p.id === activeProjectId) || null;
  }

  function persistActiveFromForm() {
    const p = getActiveProject();
    if (!p || view !== "wizard") return;

    p.projectName = ($("#spgProjectName")?.value || "").trim();
    p.tenderNumber = ($("#spgTenderNumber")?.value || "").trim();
    p.hasDocs = document.querySelector('input[name="spgHasDocs"]:checked')?.value === "yes";
    p.hasTeam = document.querySelector('input[name="spgHasTeam"]:checked')?.value === "yes";
    p.hasContracts = document.querySelector('input[name="spgHasContracts"]:checked')?.value === "yes";
    p.detailLevel = $(".spg-detail-card.active")?.dataset.detail || p.detailLevel || "detailed";
    p.wizardStep = wizardStep;
    p.view = view;

    if (p.projectName) {
      p.title = p.projectName;
    }
    p.updatedAt = Date.now();
    saveProjects();
    renderProjectList();
  }

  function syncFormFromProject(p) {
    if (!p) return;

    if ($("#spgProjectName")) $("#spgProjectName").value = p.projectName || "";
    if ($("#spgTenderNumber")) $("#spgTenderNumber").value = p.tenderNumber || "";

    const docsYes = p.hasDocs ? "yes" : "no";
    const docRadio = document.querySelector(`input[name="spgHasDocs"][value="${docsYes}"]`);
    if (docRadio) docRadio.checked = true;

    const teamYes = p.hasTeam ? "yes" : "no";
    const teamRadio = document.querySelector(`input[name="spgHasTeam"][value="${teamYes}"]`);
    if (teamRadio) teamRadio.checked = true;

    const contractsYes = p.hasContracts ? "yes" : "no";
    const contractRadio = document.querySelector(`input[name="spgHasContracts"][value="${contractsYes}"]`);
    if (contractRadio) contractRadio.checked = true;

    $$(".spg-detail-card").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.detail === (p.detailLevel || "detailed"));
    });

    toggleConditionalPanels();
    renderDocumentsTable(p);
    resetDocumentForm(true);
    renderTeamList(p);
    renderContractsList(p);
    resetTeamForm(true);
    resetContractForm(true);
  }

  function setView(nextView) {
    view = nextView;
    const p = getActiveProject();
    if (p) {
      p.view = view;
      saveProjects();
    }

    $("#spgViewLanding")?.classList.toggle("d-none", view !== "landing");
    $("#spgViewWizard")?.classList.toggle("d-none", view !== "wizard");
    $("#spgViewReview")?.classList.toggle("d-none", view !== "review");

    if (view === "wizard") {
      updateWizardUI();
      syncFormFromProject(p);
    }
    if (view === "review") {
      renderReview(p);
    }
  }

  function renderProjectList(filter = "") {
    const list = $("#spgProjectList");
    const empty = $("#spgProjectListEmpty");
    if (!list) return;

    const q = filter.trim().toLowerCase();

    const dynamicButtons = $$("button.chat-item[data-spg-dynamic-project]", list);
    dynamicButtons.forEach((btn) => btn.remove());

    const items = projects
      .filter((p) => !q || (p.title || "").toLowerCase().includes(q))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (!items.length) {
      empty?.classList.remove("d-none");
      return;
    }
    empty?.classList.add("d-none");

    items.forEach((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "chat-item d-flex align-items-center gap-12 w-100 border-0 bg-transparent ";
      el.dataset.spgDynamicProject = "1";
      if (p.id === activeProjectId) el.classList.add("active");
      el.setAttribute("role", "option");
      el.setAttribute("aria-selected", p.id === activeProjectId ? "true" : "false");

      const typeLabel =
        p.proposalType === "government"
          ? "مناقصة حكومية"
          : p.proposalType === "private"
            ? "مشروع خاص"
            : "لم يُحدد النوع بعد";

      el.innerHTML = `
        <div class="chat-item-icon">
          <img src="images/document-normal.svg" alt="">
        </div>
        <div class="w-100">
          <div class="d-flex align-items-center justify-content-between mb-10 gap-2">
            <div class="ticket-id text-truncate">${escapeHtml(p.title || "مشروع")}</div>
            <span class="fz-10 text-gray text-nowrap">${escapeHtml(typeLabel)}</span>
          </div>
          <div class="fz-10 text-gray chat-preview text-truncate text-start">${escapeHtml(statusLabel(p))}</div>
        </div>`;

      el.addEventListener("click", () => selectProject(p.id));
      list.appendChild(el);
    });
  }

  function statusLabel(p) {
    if (p.view === "review") return "مراجعة الأقسام";
    if (p.view === "wizard") return `المعالج — الخطوة ${p.wizardStep || 1}`;
    return "البداية — اختر نوع العرض";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function selectProject(id) {
    persistActiveFromForm();
    activeProjectId = id;
    const p = getActiveProject();
    if (!p) return;

    wizardStep = normalizeWizardStep(p.wizardStep);
    p.wizardStep = wizardStep;
    view = p.view || "landing";
    setView(view);
    renderProjectList($("#spgProjectSearch")?.value || "");
  }

  function startWizard(proposalType) {
    let p = getActiveProject();
    if (!p) {
      p = defaultProject();
      projects.unshift(p);
      activeProjectId = p.id;
    }
    p.proposalType = proposalType;
    p.view = "wizard";
    p.wizardStep = 1;
    wizardStep = 1;
    saveProjects();
    setView("wizard");
    renderProjectList($("#spgProjectSearch")?.value || "");

    const typeLabel =
      proposalType === "government" ? "عرض مناقصة حكومية" : "عرض مشروع خاص";
    const labelEl = $("#spgWizardTypeLabel");
    if (labelEl) labelEl.textContent = typeLabel;
  }

  function updateWizardUI() {
    $$(".spg-wizard-step").forEach((stepEl) => {
      const step = Number(stepEl.dataset.step);
      stepEl.classList.toggle("d-none", step !== wizardStep);
    });

    const counter = $("#spgStepCounter");
    const heading = $("#spgStepHeading");
    const bar = $("#spgProgressBar");
    if (counter) counter.textContent = `الخطوة ${wizardStep} من ${TOTAL_STEPS}`;
    if (heading) heading.textContent = STEP_HEADINGS[wizardStep - 1] || "";
    if (bar) {
      const pct = Math.round((wizardStep / TOTAL_STEPS) * 100);
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(pct));
    }

    renderStepDots();

    const nextBtn = $("#spgWizardNext");

    if (nextBtn.length) {
      nextBtn.html(
        wizardStep === TOTAL_STEPS
          ? `متابعة للمراجعة
               <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                   <path d="M8.47485 15.5583L3.41652 10.5L8.47485 5.44165" stroke="#fff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                   <path opacity="0.4" d="M17.583 10.5H3.55801" stroke="#fff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
               </svg>`
          : `التالي
               <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                   <path d="M8.47485 15.5583L3.41652 10.5L8.47485 5.44165" stroke="#fff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                   <path opacity="0.4" d="M17.583 10.5H3.55801" stroke="#fff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
               </svg>`
      );
    }

    const prevBtn = $("#spgWizardPrev");
    if (prevBtn) prevBtn.disabled = wizardStep === 1;
  }

  function renderStepDots() {
    const dots = $("#spgStepDots");
    if (!dots) return;
    dots.innerHTML = "";
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const dot = document.createElement("span");
      dot.className = "spg-step-dot";
      if (i < wizardStep) dot.classList.add("completed");
      if (i === wizardStep) dot.classList.add("current");
      dot.title = STEP_HEADINGS[i - 1];
      dots.appendChild(dot);
    }
  }

  function validateStep(step) {
    if (step === 1) {
      const name = ($("#spgProjectName")?.value || "").trim();
      if (!name) {
        $("#spgProjectName")?.focus();
        $("#spgProjectName")?.classList.add("is-invalid");
        return false;
      }
      $("#spgProjectName")?.classList.remove("is-invalid");
    }
    return true;
  }

  function wizardNext() {
    if (!validateStep(wizardStep)) return;
    persistActiveFromForm();

    if (wizardStep >= TOTAL_STEPS) {
      const p = getActiveProject();
      if (p) {
        p.view = "review";
        saveProjects();
      }
      setView("review");
      return;
    }

    wizardStep += 1;
    const p = getActiveProject();
    if (p) {
      p.wizardStep = wizardStep;
      saveProjects();
    }
    updateWizardUI();
  }

  function wizardPrev() {
    persistActiveFromForm();
    if (wizardStep <= 1) return;
    wizardStep -= 1;
    const p = getActiveProject();
    if (p) {
      p.wizardStep = wizardStep;
      saveProjects();
    }
    updateWizardUI();
  }

  function toggleConditionalPanels() {
    const hasDocs = document.querySelector('input[name="spgHasDocs"]:checked')?.value === "yes";
    const hasTeam = document.querySelector('input[name="spgHasTeam"]:checked')?.value === "yes";
    const hasContracts = document.querySelector('input[name="spgHasContracts"]:checked')?.value === "yes";

    $("#spgDocumentsPanel")?.classList.toggle("d-none", !hasDocs);
    $("#spgTeamPanel")?.classList.toggle("d-none", !hasTeam);
    $("#spgContractsPanel")?.classList.toggle("d-none", !hasContracts);

    const p = getActiveProject();
    if (!p) return;

    if (hasDocs) renderDocumentsTable(p);
    if (hasTeam) renderTeamList(p);
    if (hasContracts) renderContractsList(p);
  }

  function getDocumentDraftFields() {
    return {
      name: ($("#spgDocDraftName")?.value || "").trim(),
      description: ($("#spgDocDraftDesc")?.value || "").trim(),
    };
  }

  function defaultDocumentNameFromFile(fileName) {
    if (!fileName) return "";
    const base = fileName.replace(/\.[^/.]+$/, "");
    return base || fileName;
  }

  function showDocumentFormError(message) {
    const errorEl = $("#spgDocDraftFileError");
    if (!errorEl) return;
    if (message) {
      errorEl.textContent = message;
      errorEl.classList.remove("d-none");
    } else {
      errorEl.textContent = "";
      errorEl.classList.add("d-none");
    }
  }

  function updateDocumentFormEditUI() {
    const actions = $("#spgDocumentEditActions");
    const card = $("#spgDocumentFormCard");
    const isEditing = Boolean(documentFormEditingId);
    actions?.classList.toggle("d-none", !isEditing);
    actions?.classList.toggle("d-flex", isEditing);
    card?.classList.toggle("spg-collection-form-editing", isEditing);
  }

  function resetDocumentForm(clearEditing = true) {
    if (clearEditing) documentFormEditingId = null;
    const nameEl = $("#spgDocDraftName");
    const descEl = $("#spgDocDraftDesc");
    const fileEl = $("#spgDocDraftFile");
    const infoEl = $("#spgDocDraftFileInfo");
    if (nameEl) nameEl.value = "";
    if (descEl) descEl.value = "";
    if (fileEl) fileEl.value = "";
    if (infoEl) {
      infoEl.textContent = "";
      infoEl.classList.add("d-none");
    }
    showDocumentFormError("");
    nameEl?.classList.remove("is-invalid");
    updateDocumentFormEditUI();
  }

  function loadDocumentIntoForm(doc) {
    documentFormEditingId = doc.id;
    const nameEl = $("#spgDocDraftName");
    const descEl = $("#spgDocDraftDesc");
    const infoEl = $("#spgDocDraftFileInfo");
    if (nameEl) nameEl.value = doc.name || "";
    if (descEl) descEl.value = doc.description || "";
    if (infoEl) {
      if (doc.fileName) {
        infoEl.textContent = `الملف الحالي: ${doc.fileName}`;
        infoEl.classList.remove("d-none");
      } else {
        infoEl.textContent = "";
        infoEl.classList.add("d-none");
      }
    }
    const fileEl = $("#spgDocDraftFile");
    if (fileEl) fileEl.value = "";
    showDocumentFormError("");
    nameEl?.classList.remove("is-invalid");
    updateDocumentFormEditUI();
    nameEl?.focus();
  }

  function commitDocumentFromFile(file, p) {
    if (!p || !file) return;
    const wasEditing = Boolean(documentFormEditingId);

    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showDocumentFormError("حجم الملف أكبر من 500 ميغابايت");
      return;
    }

    let { name, description } = getDocumentDraftFields();
    if (!name) name = defaultDocumentNameFromFile(file.name);
    if (!name) {
      showDocumentFormError("يرجى إدخال اسم الملف");
      $("#spgDocDraftName")?.classList.add("is-invalid");
      $("#spgDocDraftName")?.focus();
      return;
    }

    showDocumentFormError("");
    $("#spgDocDraftName")?.classList.remove("is-invalid");

    if (documentFormEditingId) {
      const doc = p.documents.find((d) => d.id === documentFormEditingId);
      if (doc) {
        doc.name = name;
        doc.description = description;
        doc.fileName = file.name;
      }
    } else {
      p.documents.push({
        id: entryId(),
        name,
        description,
        fileName: file.name,
      });
    }

    p.updatedAt = Date.now();
    saveProjects();
    renderDocumentsTable(p);
    resetDocumentForm(true);
    if (wasEditing) spgAlertSaved();
    else spgAlertAdded();
  }

  function saveDocumentEditMetadata(p) {
    if (!p || !documentFormEditingId) return;
    const doc = p.documents.find((d) => d.id === documentFormEditingId);
    if (!doc) return;

    let { name, description } = getDocumentDraftFields();
    if (!name) name = doc.fileName ? defaultDocumentNameFromFile(doc.fileName) : "";
    if (!name) {
      showDocumentFormError("يرجى إدخال اسم الملف");
      $("#spgDocDraftName")?.classList.add("is-invalid");
      $("#spgDocDraftName")?.focus();
      return;
    }

    doc.name = name;
    doc.description = description;
    p.updatedAt = Date.now();
    saveProjects();
    renderDocumentsTable(p);
    resetDocumentForm(true);
    spgAlertSaved();
  }

  function renderDocumentsTable(p) {
    const tbody = $("#spgDocumentsTableBody");
    const empty = $("#spgDocumentsTableEmpty");
    const table = tbody.closest(".spg-items-table");
    if (!tbody || !p) return;

    const docs = p.documents.filter((d) => d.fileName);
    tbody.innerHTML = "";
    renderCollectionTableState(tbody, table, empty, docs.length > 0);
    if (!docs.length) return;

    docs.forEach((doc) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="اسم الملف"><span class="black-text fw-medium">${escapeHtml(doc.name || "—")}</span></td>
        <td data-label="الوصف">${renderTextDetailCell("وصف الملف", doc.description)}</td>
        <td data-label="الملف">
          <div class="d-flex align-items-center gap-2">
            <span class="sm-logo flex-shrink-0"><img src="images/document-normal.svg" alt=""></span>
            <span class="fz-12 black-text spg-cell-truncate" dir="ltr">${escapeHtml(doc.fileName)}</span>
          </div>
        </td>
        <td data-label="الإجراءات">${renderTableActions(doc.id, "spg-doc-edit", "spg-doc-delete")}</td>`;
      tbody.appendChild(tr);
    });

    bindDetailButtons(tbody);
    tbody.querySelectorAll(".spg-doc-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const doc = p.documents.find((d) => d.id === btn.dataset.id);
        if (doc) loadDocumentIntoForm(doc);
      });
    });

    tbody.querySelectorAll(".spg-doc-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        spgConfirmDelete().then((confirmed) => {
          if (!confirmed) return;
          p.documents = p.documents.filter((d) => d.id !== btn.dataset.id);
          if (documentFormEditingId === btn.dataset.id) resetDocumentForm(true);
          p.updatedAt = Date.now();
          saveProjects();
          renderDocumentsTable(p);
          spgAlertDeleted();
        });
      });
    });
  }

  function bindDocumentUploadForm() {
    if (documentUploadBound) return;
    const uploadBox = $("#spgDocUploadBox");
    const fileInput = $("#spgDocDraftFile");
    if (!uploadBox || !fileInput) return;

    documentUploadBound = true;
    const MAX_SIZE = 500 * 1024 * 1024;

    const handleFile = (file) => {
      const infoEl = $("#spgDocDraftFileInfo");
      showDocumentFormError("");
      if (!file) return;

      if (file.size > MAX_SIZE) {
        showDocumentFormError("حجم الملف أكبر من 500 ميغابايت");
        if (infoEl) {
          infoEl.classList.add("d-none");
          infoEl.textContent = "";
        }
        return;
      }

      if (infoEl) {
        infoEl.textContent = `تم اختيار الملف: ${file.name}`;
        infoEl.classList.remove("d-none");
      }

      const p = getActiveProject();
      if (!p) return;
      commitDocumentFromFile(file, p);
    };

    uploadBox.addEventListener("click", (e) => {
      if (e.target === fileInput) return;
      fileInput.click();
    });
    fileInput.addEventListener("click", (e) => e.stopPropagation());
    fileInput.addEventListener("change", () => handleFile(fileInput.files?.[0]));

    uploadBox.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadBox.classList.add("dragover");
    });
    uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragover"));
    uploadBox.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadBox.classList.remove("dragover");
      handleFile(e.dataTransfer.files?.[0]);
    });

    $("#spgDocEditSave")?.addEventListener("click", () => {
      const p = getActiveProject();
      if (p) saveDocumentEditMetadata(p);
    });

    $("#spgDocEditCancel")?.addEventListener("click", () => resetDocumentForm(true));
  }

  function truncateCellText(text, maxLen = 56) {
    const t = (text || "").trim();
    if (!t) return { display: "—", full: "", hasMore: false };
    if (t.length <= maxLen) return { display: t, full: t, hasMore: false };
    return { display: t.slice(0, maxLen) + "…", full: t, hasMore: true };
  }

  function openCollectionDetailModal(title, body) {
    const titleEl = $("#spgCollectionDetailTitle");
    const bodyEl = $("#spgCollectionDetailBody");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) {
      bodyEl.textContent = body || "—";
    }
    const modalEl = $("#spgCollectionDetailModal");
    if (modalEl && typeof bootstrap !== "undefined") {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  }

  function renderCollectionTableState(tbody, table, emptyEl, hasRows) {
    if (!tbody) return;
    if (!hasRows) {
      emptyEl?.classList.remove("d-none");
      table?.classList.add("d-none");
      return;
    }
    emptyEl?.classList.add("d-none");
    table?.classList.remove("d-none");
  }

  function renderTableActions(id, editClass, deleteClass) {
    return `
      <div class="d-flex align-items-center justify-content-center gap-12">
        <button type="button" class="icon-container gray-outline-btn ${editClass}" data-id="${id}" aria-label="تعديل">
          <img src="images/edit-pen.svg" alt="">
        </button>
        <button type="button" class="icon-container gray-outline-btn ${deleteClass}" data-id="${id}" aria-label="حذف">
          <img src="images/trash.svg" alt="">
        </button>
      </div>`;
  }

  function renderTextDetailCell(label, text) {
    const { display, full, hasMore } = truncateCellText(text);
    if (!hasMore) {
      return `<span class="text-gray fz-12">${escapeHtml(display)}</span>`;
    }
    return `
      <span class="text-gray fz-12">${escapeHtml(display)}</span>
      <button type="button" class="btn-link colored fz-12 p-0 border-0 bg-transparent spg-show-detail"
        data-title="${escapeAttr(label)}" data-body="${encodeURIComponent(full)}">عرض</button>`;
  }

  function bindDetailButtons(root) {
    root.querySelectorAll(".spg-show-detail").forEach((btn) => {
      btn.addEventListener("click", () => {
        let body = btn.dataset.body || "";
        try {
          body = decodeURIComponent(body);
        } catch (_) {
          /* keep raw */
        }
        openCollectionDetailModal(btn.dataset.title, body);
      });
    });
  }

  function getTeamDraftFields() {
    return {
      name: ($("#spgTeamDraftName")?.value || "").trim(),
      nationality: ($("#spgTeamDraftNationality")?.value || "").trim(),
      jobTitle: ($("#spgTeamDraftJobTitle")?.value || "").trim(),
      degree: ($("#spgTeamDraftDegree")?.value || "").trim(),
      years: ($("#spgTeamDraftYears")?.value || "").trim(),
      experiences: ($("#spgTeamDraftExperiences")?.value || "").trim(),
      summary: ($("#spgTeamDraftSummary")?.value || "").trim(),
      cvFileName: ($("#spgTeamDraftCvFileName")?.value || "").trim(),
    };
  }

  function showTeamFormError(message) {
    const el = $("#spgTeamFormError");
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.classList.remove("d-none");
    } else {
      el.textContent = "";
      el.classList.add("d-none");
    }
  }

  function updateTeamFormEditUI() {
    const isEditing = Boolean(teamFormEditingId);
    $("#spgTeamEditActions")?.classList.toggle("d-none", !isEditing);
    $("#spgTeamEditActions")?.classList.toggle("d-flex", isEditing);
    $("#spgTeamFormPrimaryActions")?.classList.toggle("d-none", isEditing);
    $("#spgTeamFormCard")?.classList.toggle("spg-collection-form-editing", isEditing);
  }

  function resetTeamForm(clearEditing = true) {
    if (clearEditing) teamFormEditingId = null;
    [
      "spgTeamDraftName",
      "spgTeamDraftNationality",
      "spgTeamDraftJobTitle",
      "spgTeamDraftDegree",
      "spgTeamDraftYears",
      "spgTeamDraftExperiences",
      "spgTeamDraftSummary",
      "spgTeamDraftCvFileName",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    showTeamFormError("");
    $("#spgTeamDraftName")?.classList.remove("is-invalid");
    updateTeamFormEditUI();
  }

  function loadTeamIntoForm(member) {
    teamFormEditingId = member.id;
    $("#spgTeamDraftName").value = member.name || "";
    $("#spgTeamDraftNationality").value = member.nationality || "";
    $("#spgTeamDraftJobTitle").value = member.jobTitle || "";
    $("#spgTeamDraftDegree").value = member.degree || "";
    $("#spgTeamDraftYears").value = member.years || "";
    $("#spgTeamDraftExperiences").value = member.experiences || "";
    $("#spgTeamDraftSummary").value = member.summary || "";
    $("#spgTeamDraftCvFileName").value = member.cvFileName || "";
    showTeamFormError("");
    updateTeamFormEditUI();
    $("#spgTeamDraftName")?.focus();
  }

  function applyTeamDraftToMember(member, draft) {
    member.name = draft.name;
    member.nationality = draft.nationality;
    member.jobTitle = draft.jobTitle;
    member.degree = draft.degree;
    member.years = draft.years;
    member.experiences = draft.experiences;
    member.summary = draft.summary;
    member.cvFileName = draft.cvFileName;
  }

  function commitTeamFromForm(p) {
    const draft = getTeamDraftFields();
    if (!draft.name) {
      showTeamFormError("يرجى إدخال اسم الموظف");
      $("#spgTeamDraftName")?.classList.add("is-invalid");
      $("#spgTeamDraftName")?.focus();
      return;
    }
    showTeamFormError("");
    $("#spgTeamDraftName")?.classList.remove("is-invalid");

    const wasEditing = Boolean(teamFormEditingId);
    if (teamFormEditingId) {
      const member = p.team.find((m) => m.id === teamFormEditingId);
      if (member) applyTeamDraftToMember(member, draft);
    } else {
      p.team.push({ id: entryId(), ...draft });
    }

    p.updatedAt = Date.now();
    saveProjects();
    renderTeamList(p);
    resetTeamForm(true);
    if (wasEditing) spgAlertSaved();
    else spgAlertAdded();
  }

  function saveTeamEditFromForm(p) {
    if (!teamFormEditingId) return;
    commitTeamFromForm(p);
  }

  function renderTeamList(p) {
    const tbody = $("#spgTeamList");
    const empty = $("#spgTeamTableEmpty");
    const table = tbody?.closest(".spg-items-table");
    if (!tbody || !p) return;

    const members = p.team.filter((m) => (m.name || "").trim());
    tbody.innerHTML = "";
    renderCollectionTableState(tbody, table, empty, members.length > 0);

    members.forEach((member) => {
      const tr = document.createElement("tr");
      const detailBody = [
        member.degree ? `الشهادة: ${member.degree}` : "",
        member.cvFileName ? `ملف السيرة: ${member.cvFileName}` : "",
        member.experiences ? `الخبرات:\n${member.experiences}` : "",
        member.summary ? `الملخص:\n${member.summary}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      tr.innerHTML = `
        <td data-label="اسم الموظف"><span class="black-text fw-medium">${escapeHtml(member.name)}</span></td>
        <td data-label="المسمى الوظيفي"><span class="fz-12 black-text">${escapeHtml(member.jobTitle || "—")}</span></td>
        <td data-label="الجنسية"><span class="fz-12 text-gray">${escapeHtml(member.nationality || "—")}</span></td>
        <td data-label="سنوات الخبرة"><span class="fz-12 ff-onest">${escapeHtml(member.years || "—")}</span></td>
        <td data-label="التفاصيل">
          ${detailBody
            ? `<button type="button" class="btn-link colored fz-12 p-0 border-0 bg-transparent spg-show-detail"
                data-title="${escapeAttr(`تفاصيل — ${member.name}`)}" data-body="${encodeURIComponent(detailBody)}">عرض التفاصيل</button>`
            : `<span class="text-gray fz-12">—</span>`}
        </td>
        <td data-label="الإجراءات">${renderTableActions(member.id, "spg-team-edit", "spg-team-delete")}</td>`;
      tbody.appendChild(tr);
    });

    bindDetailButtons(tbody);
    tbody.querySelectorAll(".spg-team-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const member = p.team.find((m) => m.id === btn.dataset.id);
        if (member) loadTeamIntoForm(member);
      });
    });
    tbody.querySelectorAll(".spg-team-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        spgConfirmDelete().then((confirmed) => {
          if (!confirmed) return;
          p.team = p.team.filter((m) => m.id !== btn.dataset.id);
          if (teamFormEditingId === btn.dataset.id) resetTeamForm(true);
          p.updatedAt = Date.now();
          saveProjects();
          renderTeamList(p);
          spgAlertDeleted();
        });
      });
    });
  }

  function getContractDraftFields() {
    return {
      projectName: ($("#spgContractDraftProjectName")?.value || "").trim(),
      entity: ($("#spgContractDraftEntity")?.value || "").trim(),
      description: ($("#spgContractDraftDescription")?.value || "").trim(),
      year: ($("#spgContractDraftYear")?.value || "").trim(),
      duration: ($("#spgContractDraftDuration")?.value || "").trim(),
      cost: ($("#spgContractDraftCost")?.value || "").trim(),
      contractFileName: ($("#spgContractDraftFileName")?.value || "").trim(),
    };
  }

  function showContractFormError(message) {
    const el = $("#spgContractFormError");
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.classList.remove("d-none");
    } else {
      el.textContent = "";
      el.classList.add("d-none");
    }
  }

  function updateContractFormEditUI() {
    const isEditing = Boolean(contractFormEditingId);
    $("#spgContractEditActions")?.classList.toggle("d-none", !isEditing);
    $("#spgContractEditActions")?.classList.toggle("d-flex", isEditing);
    $("#spgContractFormPrimaryActions")?.classList.toggle("d-none", isEditing);
    $("#spgContractFormCard")?.classList.toggle("spg-collection-form-editing", isEditing);
  }

  function resetContractForm(clearEditing = true) {
    if (clearEditing) contractFormEditingId = null;
    [
      "spgContractDraftProjectName",
      "spgContractDraftEntity",
      "spgContractDraftDescription",
      "spgContractDraftYear",
      "spgContractDraftDuration",
      "spgContractDraftCost",
      "spgContractDraftFileName",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    showContractFormError("");
    $("#spgContractDraftProjectName")?.classList.remove("is-invalid");
    updateContractFormEditUI();
  }

  function loadContractIntoForm(contract) {
    contractFormEditingId = contract.id;
    $("#spgContractDraftProjectName").value = contract.projectName || "";
    $("#spgContractDraftEntity").value = contract.entity || "";
    $("#spgContractDraftDescription").value = contract.description || "";
    $("#spgContractDraftYear").value = contract.year || "";
    $("#spgContractDraftDuration").value = contract.duration || "";
    $("#spgContractDraftCost").value = contract.cost || "";
    $("#spgContractDraftFileName").value = contract.contractFileName || "";
    showContractFormError("");
    updateContractFormEditUI();
    $("#spgContractDraftProjectName")?.focus();
  }

  function applyContractDraftToItem(item, draft) {
    item.projectName = draft.projectName;
    item.entity = draft.entity;
    item.description = draft.description;
    item.year = draft.year;
    item.duration = draft.duration;
    item.cost = draft.cost;
    item.contractFileName = draft.contractFileName;
  }

  function commitContractFromForm(p) {
    const draft = getContractDraftFields();
    if (!draft.projectName) {
      showContractFormError("يرجى إدخال اسم المشروع");
      $("#spgContractDraftProjectName")?.classList.add("is-invalid");
      $("#spgContractDraftProjectName")?.focus();
      return;
    }
    showContractFormError("");
    $("#spgContractDraftProjectName")?.classList.remove("is-invalid");

    const wasEditing = Boolean(contractFormEditingId);
    if (contractFormEditingId) {
      const item = p.contracts.find((c) => c.id === contractFormEditingId);
      if (item) applyContractDraftToItem(item, draft);
    } else {
      p.contracts.push({ id: entryId(), ...draft });
    }

    p.updatedAt = Date.now();
    saveProjects();
    renderContractsList(p);
    resetContractForm(true);
    if (wasEditing) spgAlertSaved();
    else spgAlertAdded();
  }

  function renderContractsList(p) {
    const tbody = $("#spgContractsList");
    const empty = $("#spgContractsTableEmpty");
    const table = tbody?.closest(".spg-items-table");
    if (!tbody || !p) return;

    const items = p.contracts.filter((c) => (c.projectName || "").trim());
    tbody.innerHTML = "";
    renderCollectionTableState(tbody, table, empty, items.length > 0);

    items.forEach((c) => {
      const tr = document.createElement("tr");
      const descCell = renderTextDetailCell("وصف المشروع", c.description);
      tr.innerHTML = `
        <td data-label="اسم المشروع"><span class="black-text fw-medium">${escapeHtml(c.projectName)}</span></td>
        <td data-label="الجهة"><span class="fz-12 text-gray">${escapeHtml(c.entity || "—")}</span></td>
        <td data-label="السنة"><span class="fz-12 ff-onest">${escapeHtml(c.year || "—")}</span></td>
        <td data-label="المدة"><span class="fz-12">${escapeHtml(c.duration || "—")}</span></td>
        <td data-label="التكلفة"><span class="fz-12 ff-onest">${escapeHtml(c.cost || "—")}</span></td>
        <td data-label="الوصف">${descCell}</td>
        <td data-label="الإجراءات">${renderTableActions(c.id, "spg-contract-edit", "spg-contract-delete")}</td>`;
      tbody.appendChild(tr);
    });

    bindDetailButtons(tbody);
    tbody.querySelectorAll(".spg-contract-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = p.contracts.find((x) => x.id === btn.dataset.id);
        if (item) loadContractIntoForm(item);
      });
    });
    tbody.querySelectorAll(".spg-contract-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        spgConfirmDelete().then((confirmed) => {
          if (!confirmed) return;
          p.contracts = p.contracts.filter((x) => x.id !== btn.dataset.id);
          if (contractFormEditingId === btn.dataset.id) resetContractForm(true);
          p.updatedAt = Date.now();
          saveProjects();
          renderContractsList(p);
          spgAlertDeleted();
        });
      });
    });
  }

  function bindTeamAndContractForms() {
    if (teamContractFormsBound) return;
    teamContractFormsBound = true;

    $("#spgAddTeamBtn")?.addEventListener("click", () => {
      const p = getActiveProject();
      if (p) commitTeamFromForm(p);
    });
    $("#spgTeamEditSave")?.addEventListener("click", () => {
      const p = getActiveProject();
      if (p) saveTeamEditFromForm(p);
    });
    $("#spgTeamEditCancel")?.addEventListener("click", () => resetTeamForm(true));

    $("#spgAddContractBtn")?.addEventListener("click", () => {
      const p = getActiveProject();
      if (p) commitContractFromForm(p);
    });
    $("#spgContractEditSave")?.addEventListener("click", () => {
      const p = getActiveProject();
      if (p) commitContractFromForm(p);
    });
    $("#spgContractEditCancel")?.addEventListener("click", () => resetContractForm(true));
  }

  function escapeAttr(str) {
    return escapeHtml(str || "").replace(/"/g, "&quot;");
  }

  function countEnabledOptionalFromDom() {
    return $$(".spg-optional-toggle:checked").length;
  }

  function estimatePages(p) {
    const level =
      p?.detailLevel || $(".spg-detail-card.active")?.dataset.detail || "detailed";
    const [minBase, maxBase] = DETAIL_PAGE_RANGES[level] || DETAIL_PAGE_RANGES.detailed;
    const extra = countEnabledOptionalFromDom();
    const min = minBase + extra;
    const max = maxBase + extra * 2;
    return { min, max, totalSections: SPG_CORE_SECTION_COUNT + extra };
  }

  function renderReview(p) {
    if (!p) return;
    persistActiveFromForm();
    $("#spgReviewConfirmNote")?.classList.add("d-none");

    const enabledOptional = countEnabledOptionalFromDom();
    const { min, max, totalSections } = estimatePages(p);

    $("#spgSummaryTotal").textContent = String(totalSections);
    $("#spgSummaryCore").textContent = String(SPG_CORE_SECTION_COUNT);
    $("#spgSummaryOptional").textContent = String(enabledOptional);
    $("#spgSummaryPages").textContent = `${min} – ${max}`;
    $("#spgSummarySizeLabel").textContent = `${totalSections} أقسام — ${min} إلى ${max} صفحة تقريبًا`;
  }

  function bindEvents() {
    $("#spgProjectSearch")?.addEventListener("input", (e) => {
      renderProjectList(e.target.value);
    });

    $$(".spg-path-card[data-proposal-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.classList.add("active");
        startWizard(btn.dataset.proposalType);
      });
    });

    $("#spgWizardNext")?.addEventListener("click", wizardNext);
    $("#spgWizardPrev")?.addEventListener("click", wizardPrev);
    $("#spgWizardBackToLanding")?.addEventListener("click", () => {
      persistActiveFromForm();
      const p = getActiveProject();
      if (p) {
        p.view = "landing";
        saveProjects();
      }
      setView("landing");
    });

    $$('input[name="spgHasDocs"], input[name="spgHasTeam"], input[name="spgHasContracts"]').forEach((input) => {
      input.addEventListener("change", () => {
        toggleConditionalPanels();
        persistActiveFromForm();
      });
    });

    bindDocumentUploadForm();
    bindTeamAndContractForms();

    $$(".spg-detail-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".spg-detail-card").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        persistActiveFromForm();
      });
    });

    $("#spgReviewBack")?.addEventListener("click", () => {
      const p = getActiveProject();
      wizardStep = TOTAL_STEPS;
      if (p) {
        p.view = "wizard";
        p.wizardStep = TOTAL_STEPS;
        saveProjects();
      }
      setView("wizard");
    });

    $("#spgOptionalSections")?.addEventListener("change", (e) => {
      if (!e.target.closest(".spg-optional-toggle")) return;
      renderReview(getActiveProject());
    });

    // $("#spgReviewConfirm")?.addEventListener("click", () => {
    //   persistActiveFromForm();
    //   const note = $("#spgReviewConfirmNote");
    //   if (note) {
    //     note.textContent =
    //       "تم حفظ اختيارات الأقسام. المرحلة التالية من توليد المحتوى ستتوفر قريبًا.";
    //     note.classList.remove("d-none");
    //   }
    // });
  }

  function init() {
    if (!$(".spg-root")) return;

    const p = getActiveProject();
    if (p) {
      wizardStep = normalizeWizardStep(p.wizardStep);
      p.wizardStep = wizardStep;
      view = p.view || "landing";
    } else {
      view = "landing";
    }

    bindEvents();
    renderProjectList();
    setView(view);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
