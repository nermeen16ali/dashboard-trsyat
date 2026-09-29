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

  const DETAIL_PAGE_RANGES = {
    detailed: [13, 16],
    medium: [10, 13],
    brief: [6, 9],
  };

  let view = "landing";
  let wizardStep = 1;
  let documentFormEditingId = null;
  let documentUploadBound = false;
  let teamFormEditingId = null;
  let contractFormEditingId = null;
  let teamContractFormsBound = false;

  /** In-page session only (lost on reload). ASP.NET owns persisted rows in the tbodies. */
  let demoDocuments = [];
  let demoTeam = [];
  let demoContracts = [];

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

  function entryId() {
    return "e-" + Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str || "").replace(/"/g, "&quot;");
  }

  function truncateCellText(text, maxLen = 56) {
    const t = (text || "").trim();
    if (!t) return { display: "—", full: "", hasMore: false };
    if (t.length <= maxLen) return { display: t, full: t, hasMore: false };
    return { display: t.slice(0, maxLen) + "…", full: t, hasMore: true };
  }

  const SPG_DETAIL_MODAL_TARGET = "#spgCollectionDetailModal";

  function renderDetailModalTrigger(label) {
    return `<button type="button" class="colored text-decoration-underline fz-12 text-nowrap border-0 bg-transparent p-0 spg-detail-modal-trigger"
      data-bs-toggle="modal" data-bs-target="${SPG_DETAIL_MODAL_TARGET}">${escapeHtml(label)}</button>`;
  }

  function renderTextDetailCell(text) {
    const { display, hasMore } = truncateCellText(text);
    if (!hasMore) {
      return `<span class="text-gray fz-12">${escapeHtml(display)}</span>`;
    }
    return `
      <div class="d-flex align-items-end text-dark-gray gap-1 flex-wrap">
        <p class="ellipse-text fz-12 text-gray mb-0">${escapeHtml(display)}</p>
        ${renderDetailModalTrigger("عرض المزيد")}
      </div>`;
  }

  function renderTableActions(id, editClass, deleteClass) {
    return `
      <div class="d-flex align-items-center justify-content-center gap-12">
        <button type="button" class="icon-container gray-outline-btn ${editClass}" data-id="${escapeHtml(id)}" aria-label="تعديل">
          <img src="images/edit-pen.svg" alt="">
        </button>
        <button type="button" class="icon-container gray-outline-btn ${deleteClass}" data-id="${escapeHtml(id)}" aria-label="حذف">
          <img src="images/trash.svg" alt="">
        </button>
      </div>`;
  }

  function setView(nextView) {
    view = nextView;

    $("#spgViewLanding")?.classList.toggle("d-none", view !== "landing");
    $("#spgViewWizard")?.classList.toggle("d-none", view !== "wizard");
    $("#spgViewReview")?.classList.toggle("d-none", view !== "review");

    if (view === "wizard") {
      updateWizardUI();
      toggleConditionalPanels();
    }
    if (view === "review") {
      renderReview();
    }
  }

  function startWizard(proposalType) {
    wizardStep = 1;
    setView("wizard");

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
    const nextArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
                   <path d="M8.47485 15.5583L3.41652 10.5L8.47485 5.44165" stroke="#fff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                   <path opacity="0.4" d="M17.583 10.5H3.55801" stroke="#fff" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
               </svg>`;
    if (nextBtn) {
      const label = wizardStep === TOTAL_STEPS ? "متابعة للمراجعة" : "التالي";
      nextBtn.innerHTML = `${label} ${nextArrowSvg}`;
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

    if (wizardStep >= TOTAL_STEPS) {
      setView("review");
      return;
    }

    wizardStep += 1;
    updateWizardUI();
  }

  function wizardPrev() {
    if (wizardStep <= 1) return;
    wizardStep -= 1;
    updateWizardUI();
  }

  function toggleConditionalPanels() {
    const hasDocs = document.querySelector('input[name="spgHasDocs"]:checked')?.value === "yes";
    const hasTeam = document.querySelector('input[name="spgHasTeam"]:checked')?.value === "yes";
    const hasContracts = document.querySelector('input[name="spgHasContracts"]:checked')?.value === "yes";

    $("#spgDocumentsPanel")?.classList.toggle("d-none", !hasDocs);
    $("#spgTeamPanel")?.classList.toggle("d-none", !hasTeam);
    $("#spgContractsPanel")?.classList.toggle("d-none", !hasContracts);

    if (hasDocs) refreshDocumentsTableUi();
    if (hasTeam) refreshTeamTableUi();
    if (hasContracts) refreshContractsTableUi();
  }

  function countDataRows(tbody) {
    if (!tbody) return 0;
    return $$("tr", tbody).filter((tr) => tr.querySelector("td")).length;
  }

  function resolveDocument(id, tr) {
    if (!id) return null;
    const fromSession = demoDocuments.find((d) => d.id === id);
    if (fromSession) return fromSession;
    if (!tr) return null;
    return {
      id,
      name: tr.dataset.spgName || "",
      description: tr.dataset.spgDescription || "",
      fileName: tr.dataset.spgFileName || "",
    };
  }

  function resolveTeamMember(id, tr) {
    if (!id) return null;
    const fromSession = demoTeam.find((m) => m.id === id);
    if (fromSession) return fromSession;
    if (!tr) return null;
    return {
      id,
      name: tr.dataset.spgName || "",
      nationality: tr.dataset.spgNationality || "",
      jobTitle: tr.dataset.spgJobTitle || "",
      degree: tr.dataset.spgDegree || "",
      years: tr.dataset.spgYears || "",
      experiences: tr.dataset.spgExperiences || "",
      summary: tr.dataset.spgSummary || "",
      cvFileName: tr.dataset.spgCvFileName || "",
    };
  }

  function resolveContract(id, tr) {
    if (!id) return null;
    const fromSession = demoContracts.find((c) => c.id === id);
    if (fromSession) return fromSession;
    if (!tr) return null;
    return {
      id,
      projectName: tr.dataset.spgProjectName || "",
      entity: tr.dataset.spgEntity || "",
      description: tr.dataset.spgDescription || "",
      year: tr.dataset.spgYear || "",
      duration: tr.dataset.spgDuration || "",
      cost: tr.dataset.spgCost || "",
      contractFileName: tr.dataset.spgContractFileName || "",
    };
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

  function commitDocumentFromFile(file) {
    if (!file) return;
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

    if (wasEditing) {
      const doc = demoDocuments.find((d) => d.id === documentFormEditingId);
      if (doc) {
        doc.name = name;
        doc.description = description;
        doc.fileName = file.name;
      }
    } else {
      demoDocuments.push({
        id: entryId(),
        name,
        description,
        fileName: file.name,
      });
    }

    resetDocumentForm(true);
    renderDocumentsTable();
    if (wasEditing) spgAlertSaved();
    else spgAlertAdded();
  }

  function saveDocumentEditMetadata() {
    if (!documentFormEditingId) return;

    let { name, description } = getDocumentDraftFields();
    const doc = demoDocuments.find((d) => d.id === documentFormEditingId);
    if (!name) name = doc?.fileName ? defaultDocumentNameFromFile(doc.fileName) : "";
    if (!name) {
      showDocumentFormError("يرجى إدخال اسم الملف");
      $("#spgDocDraftName")?.classList.add("is-invalid");
      $("#spgDocDraftName")?.focus();
      return;
    }

    if (doc) {
      doc.name = name;
      doc.description = description;
    }

    showDocumentFormError("");
    $("#spgDocDraftName")?.classList.remove("is-invalid");
    resetDocumentForm(true);
    renderDocumentsTable();
    spgAlertSaved();
  }

  function renderDocumentsTable() {
    const tbody = $("#spgDocumentsTableBody");
    const empty = $("#spgDocumentsTableEmpty");
    const table =
      tbody?.closest(".competition-table") || tbody?.closest(".spg-items-table");
    if (!tbody) return;

    const serverRows = $$("tr[data-spg-server-row]", tbody);
    const docs = demoDocuments.filter((d) => d.fileName);
    tbody.innerHTML = "";
    serverRows.forEach((tr) => tbody.appendChild(tr));

    docs.forEach((doc) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-spg-entry-id", doc.id);
      tr.setAttribute("data-spg-name", doc.name || "");
      tr.setAttribute("data-spg-description", doc.description || "");
      tr.setAttribute("data-spg-file-name", doc.fileName || "");
      tr.dataset.spgClientRow = "1";
      tr.innerHTML = `
        <td data-label="اسم الملف"><span class="black-text fw-medium">${escapeHtml(doc.name || "—")}</span></td>
        <td data-label="الوصف">${renderTextDetailCell(doc.description)}</td>
        <td data-label="الملف">
          <div class="d-flex align-items-center gap-2">
            <span class="sm-logo flex-shrink-0"><img src="images/document-normal.svg" alt=""></span>
            <span class="fz-12 black-text" dir="ltr">${escapeHtml(doc.fileName)}</span>
          </div>
        </td>
        <td data-label="الاجراءات">${renderTableActions(doc.id, "spg-doc-edit", "spg-doc-delete")}</td>`;
      tbody.appendChild(tr);
    });

    const rowCount = countDataRows(tbody);
    renderCollectionTableState(tbody, table, empty, rowCount > 0);
  }

  function refreshDocumentsTableUi() {
    renderDocumentsTable();
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

      commitDocumentFromFile(file);
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

    $("#spgDocEditSave")?.addEventListener("click", () => saveDocumentEditMetadata());

    $("#spgDocEditCancel")?.addEventListener("click", () => resetDocumentForm(true));
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

  function commitTeamFromForm() {
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
    if (wasEditing) {
      const member = demoTeam.find((m) => m.id === teamFormEditingId);
      if (member) Object.assign(member, draft);
    } else {
      demoTeam.push({ id: entryId(), ...draft });
    }

    resetTeamForm(true);
    renderTeamList();
    if (wasEditing) spgAlertSaved();
    else spgAlertAdded();
  }

  function saveTeamEditFromForm() {
    if (!teamFormEditingId) return;
    commitTeamFromForm();
  }

  function renderTeamList() {
    const tbody = $("#spgTeamList");
    const empty = $("#spgTeamTableEmpty");
    const table =
      tbody?.closest(".competition-table") || tbody?.closest(".spg-items-table");
    if (!tbody) return;

    const serverRows = $$("tr[data-spg-server-row]", tbody);
    const members = demoTeam.filter((m) => (m.name || "").trim());
    tbody.innerHTML = "";
    serverRows.forEach((tr) => tbody.appendChild(tr));

    members.forEach((member) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-spg-entry-id", member.id);
      tr.setAttribute("data-spg-name", member.name || "");
      tr.setAttribute("data-spg-nationality", member.nationality || "");
      tr.setAttribute("data-spg-job-title", member.jobTitle || "");
      tr.setAttribute("data-spg-degree", member.degree || "");
      tr.setAttribute("data-spg-years", member.years || "");
      tr.setAttribute("data-spg-experiences", member.experiences || "");
      tr.setAttribute("data-spg-summary", member.summary || "");
      tr.setAttribute("data-spg-cv-file-name", member.cvFileName || "");
      tr.dataset.spgClientRow = "1";

      const detailBody = [
        member.degree ? `الشهادة: ${member.degree}` : "",
        member.cvFileName ? `ملف السيرة: ${member.cvFileName}` : "",
        member.experiences ? `الخبرات:\n${member.experiences}` : "",
        member.summary ? `الملخص:\n${member.summary}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      tr.innerHTML = `
        <td data-label="اسم الموظف"><span class="text-dark-gray fw-medium">${escapeHtml(member.name)}</span></td>
        <td data-label="المسمى الوظيفي"><span class="black-text fw-medium">${escapeHtml(member.jobTitle || "—")}</span></td>
        <td data-label="الجنسية"><span class="text-dark-gray fw-medium">${escapeHtml(member.nationality || "—")}</span></td>
        <td data-label="سنوات الخبرة"><span class="fz-12 ff-onest">${escapeHtml(member.years || "—")}</span></td>
        <td data-label="التفاصيل">
          ${detailBody ? renderDetailModalTrigger("عرض التفاصيل") : `<span class="text-gray fz-12">—</span>`}
        </td>
        <td data-label="الاجراءات">${renderTableActions(member.id, "spg-team-edit", "spg-team-delete")}</td>`;
      tbody.appendChild(tr);
    });

    renderCollectionTableState(tbody, table, empty, countDataRows(tbody) > 0);
  }

  function refreshTeamTableUi() {
    renderTeamList();
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

  function commitContractFromForm() {
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
    if (wasEditing) {
      const item = demoContracts.find((c) => c.id === contractFormEditingId);
      if (item) Object.assign(item, draft);
    } else {
      demoContracts.push({ id: entryId(), ...draft });
    }

    resetContractForm(true);
    renderContractsList();
    if (wasEditing) spgAlertSaved();
    else spgAlertAdded();
  }

  function renderContractsList() {
    const tbody = $("#spgContractsList");
    const empty = $("#spgContractsTableEmpty");
    const table =
      tbody?.closest(".competition-table") || tbody?.closest(".spg-items-table");
    if (!tbody) return;

    const serverRows = $$("tr[data-spg-server-row]", tbody);
    const items = demoContracts.filter((c) => (c.projectName || "").trim());
    tbody.innerHTML = "";
    serverRows.forEach((tr) => tbody.appendChild(tr));

    items.forEach((c) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-spg-entry-id", c.id);
      tr.setAttribute("data-spg-project-name", c.projectName || "");
      tr.setAttribute("data-spg-entity", c.entity || "");
      tr.setAttribute("data-spg-description", c.description || "");
      tr.setAttribute("data-spg-year", c.year || "");
      tr.setAttribute("data-spg-duration", c.duration || "");
      tr.setAttribute("data-spg-cost", c.cost || "");
      tr.setAttribute("data-spg-contract-file-name", c.contractFileName || "");
      tr.dataset.spgClientRow = "1";
      tr.innerHTML = `
        <td data-label="اسم المشروع"><span class="text-dark-gray fw-medium">${escapeHtml(c.projectName)}</span></td>
        <td data-label="الجهة"><span class="text-dark-gray fw-medium">${escapeHtml(c.entity || "—")}</span></td>
        <td data-label="تفاصيل المشروع">${renderTextDetailCell(c.description)}</td>
        <td data-label="سنة المشروع"><span class="fz-12 ff-onest">${escapeHtml(c.year || "—")}</span></td>
        <td data-label="مدة المشروع"><span class="fz-12">${escapeHtml(c.duration || "—")}</span></td>
        <td data-label="تكلفة المشروع"><span class="fz-12 ff-onest">${escapeHtml(c.cost || "—")}</span></td>
        <td data-label="الاجراءات">${renderTableActions(c.id, "spg-contract-edit", "spg-contract-delete")}</td>`;
      tbody.appendChild(tr);
    });

    renderCollectionTableState(tbody, table, empty, countDataRows(tbody) > 0);
  }

  function refreshContractsTableUi() {
    renderContractsList();
  }

  function bindCollectionTableActions() {
    const docBody = $("#spgDocumentsTableBody");
    if (docBody && !docBody.dataset.spgActionsBound) {
      docBody.dataset.spgActionsBound = "1";
      docBody.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".spg-doc-edit");
        const deleteBtn = e.target.closest(".spg-doc-delete");
        const tr = e.target.closest("tr");
        if (editBtn) {
          const doc = resolveDocument(editBtn.dataset.id, tr);
          if (doc) loadDocumentIntoForm(doc);
          return;
        }
        if (deleteBtn) {
          spgConfirmDelete().then((confirmed) => {
            if (!confirmed) return;
            const id = deleteBtn.dataset.id;
            demoDocuments = demoDocuments.filter((d) => d.id !== id);
            if (documentFormEditingId === id) resetDocumentForm(true);
            if (tr?.dataset.spgServerRow) tr.remove();
            renderDocumentsTable();
            spgAlertDeleted();
          });
        }
      });
    }

    const teamBody = $("#spgTeamList");
    if (teamBody && !teamBody.dataset.spgActionsBound) {
      teamBody.dataset.spgActionsBound = "1";
      teamBody.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".spg-team-edit");
        const deleteBtn = e.target.closest(".spg-team-delete");
        const tr = e.target.closest("tr");
        if (editBtn) {
          const member = resolveTeamMember(editBtn.dataset.id, tr);
          if (member) loadTeamIntoForm(member);
          return;
        }
        if (deleteBtn) {
          spgConfirmDelete().then((confirmed) => {
            if (!confirmed) return;
            const id = deleteBtn.dataset.id;
            demoTeam = demoTeam.filter((m) => m.id !== id);
            if (teamFormEditingId === id) resetTeamForm(true);
            if (tr?.dataset.spgServerRow) tr.remove();
            renderTeamList();
            spgAlertDeleted();
          });
        }
      });
    }

    const contractBody = $("#spgContractsList");
    if (contractBody && !contractBody.dataset.spgActionsBound) {
      contractBody.dataset.spgActionsBound = "1";
      contractBody.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".spg-contract-edit");
        const deleteBtn = e.target.closest(".spg-contract-delete");
        const tr = e.target.closest("tr");
        if (editBtn) {
          const item = resolveContract(editBtn.dataset.id, tr);
          if (item) loadContractIntoForm(item);
          return;
        }
        if (deleteBtn) {
          spgConfirmDelete().then((confirmed) => {
            if (!confirmed) return;
            const id = deleteBtn.dataset.id;
            demoContracts = demoContracts.filter((c) => c.id !== id);
            if (contractFormEditingId === id) resetContractForm(true);
            if (tr?.dataset.spgServerRow) tr.remove();
            renderContractsList();
            spgAlertDeleted();
          });
        }
      });
    }
  }

  function bindTeamAndContractForms() {
    if (teamContractFormsBound) return;
    teamContractFormsBound = true;

    $("#spgAddTeamBtn")?.addEventListener("click", () => commitTeamFromForm());
    $("#spgTeamEditSave")?.addEventListener("click", () => saveTeamEditFromForm());
    $("#spgTeamEditCancel")?.addEventListener("click", () => resetTeamForm(true));

    $("#spgAddContractBtn")?.addEventListener("click", () => commitContractFromForm());
    $("#spgContractEditSave")?.addEventListener("click", () => commitContractFromForm());
    $("#spgContractEditCancel")?.addEventListener("click", () => resetContractForm(true));
  }

  function countEnabledOptionalFromDom() {
    return $$(".spg-optional-toggle:checked").length;
  }

  function countCoreSectionsFromDom() {
    const root = $("#spgCoreSections");
    if (!root) return SPG_CORE_SECTION_COUNT;
    const n = $$(".spg-section-row", root).length;
    return n || SPG_CORE_SECTION_COUNT;
  }

  function estimatePages() {
    const level = $(".spg-detail-card.active")?.dataset.detail || "detailed";
    const [minBase, maxBase] = DETAIL_PAGE_RANGES[level] || DETAIL_PAGE_RANGES.detailed;
    const coreCount = countCoreSectionsFromDom();
    const extra = countEnabledOptionalFromDom();
    const min = minBase + extra;
    const max = maxBase + extra * 2;
    return { min, max, totalSections: coreCount + extra, coreCount };
  }

  function renderReview() {
    $("#spgReviewConfirmNote")?.classList.add("d-none");

    const enabledOptional = countEnabledOptionalFromDom();
    const { min, max, totalSections, coreCount } = estimatePages();

    $("#spgSummaryTotal").textContent = String(totalSections);
    $("#spgSummaryCore").textContent = String(coreCount);
    $("#spgSummaryOptional").textContent = String(enabledOptional);
    $("#spgSummaryPages").textContent = `${min} – ${max}`;
    $("#spgSummarySizeLabel").textContent = `${totalSections} أقسام — ${min} إلى ${max} صفحة تقريبًا`;
  }

  function bindProjectsDrawer() {
    const root = $(".spg-root");
    const panel = $("#spgProjectsSidebar");
    const backdrop = $("#spgProjectsSidebarBackdrop");
    const openBtn = $("#spgProjectsSidebarOpen");
    const closeBtn = $("#spgProjectsSidebarClose");
    if (!root || !panel) return;

    const mobileQuery = window.matchMedia("(max-width: 767.98px)");

    function syncDrawerA11yDesktop() {
      if (!mobileQuery.matches) {
        root.classList.remove("spg-projects-drawer-open");
        document.body.classList.remove("spg-projects-drawer-open");
        backdrop?.classList.remove("show");
        document.body.classList.remove("spg-projects-drawer-body-lock");
        panel.removeAttribute("aria-hidden");
        panel.setAttribute("role", "complementary");
        panel.removeAttribute("aria-modal");
        openBtn?.setAttribute("aria-expanded", "false");
        return true;
      }
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      if (!root.classList.contains("spg-projects-drawer-open")) {
        panel.setAttribute("aria-hidden", "true");
      }
      return false;
    }

    function isMobileDrawerViewport() {
      return mobileQuery.matches;
    }

    function openDrawer() {
      if (!isMobileDrawerViewport()) return;
      root.classList.add("spg-projects-drawer-open");
      document.body.classList.add("spg-projects-drawer-open");
      backdrop?.classList.add("show");
      backdrop?.setAttribute("aria-hidden", "false");
      openBtn?.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
      document.body.classList.add("spg-projects-drawer-body-lock");
      closeBtn?.focus();
    }

    function closeDrawer() {
      if (!isMobileDrawerViewport()) return;
      root.classList.remove("spg-projects-drawer-open");
      document.body.classList.remove("spg-projects-drawer-open");
      backdrop?.classList.remove("show");
      backdrop?.setAttribute("aria-hidden", "true");
      openBtn?.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      document.body.classList.remove("spg-projects-drawer-body-lock");
      openBtn?.focus();
    }

    openBtn?.addEventListener("click", openDrawer);
    closeBtn?.addEventListener("click", closeDrawer);
    backdrop?.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root.classList.contains("spg-projects-drawer-open")) {
        closeDrawer();
      }
    });

    const projectList = $("#spgProjectList");
    projectList?.addEventListener("click", (e) => {
      const item = e.target.closest(".spg-project-item, [data-spg-dynamic-project]");
      if (item && root.classList.contains("spg-projects-drawer-open")) {
        closeDrawer();
      }
    });

    mobileQuery.addEventListener("change", syncDrawerA11yDesktop);
    syncDrawerA11yDesktop();
  }

  function bindEvents() {
    bindProjectsDrawer();

    $$(".spg-path-card[data-proposal-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.classList.add("active");
        startWizard(btn.dataset.proposalType);
      });
    });

    $("#spgWizardNext")?.addEventListener("click", wizardNext);
    $("#spgWizardPrev")?.addEventListener("click", wizardPrev);
    $("#spgWizardBackToLanding")?.addEventListener("click", () => setView("landing"));

    $$('input[name="spgHasDocs"], input[name="spgHasTeam"], input[name="spgHasContracts"]').forEach((input) => {
      input.addEventListener("change", () => toggleConditionalPanels());
    });

    bindDocumentUploadForm();
    bindTeamAndContractForms();
    bindCollectionTableActions();

    $$(".spg-detail-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".spg-detail-card").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    $("#spgReviewBack")?.addEventListener("click", () => {
      wizardStep = TOTAL_STEPS;
      setView("wizard");
    });

    $("#spgOptionalSections")?.addEventListener("change", (e) => {
      if (!e.target.closest(".spg-optional-toggle")) return;
      renderReview();
    });

  }

  function init() {
    if (!$(".spg-root")) return;

    bindEvents();
    renderDocumentsTable();
    renderTeamList();
    renderContractsList();
    setView(view);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
