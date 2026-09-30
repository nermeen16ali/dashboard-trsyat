(function () {
  "use strict";

  const TOTAL_STEPS = 5;

  const STEP_HEADINGS = [
    "بيانات المناقصة / المشروع",
    "مستندات المناقصة",
    "فريق العمل",
    "العقود السابقة",
    "مستوى التفصيل",
  ];

  let view = "landing";
  let wizardStep = 1;

  let documentFormEditingId = null;
  let documentUploadBound = false;

  let teamFormEditingId = null;
  let contractFormEditingId = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) =>
    Array.from(root.querySelectorAll(sel));

  const SPG_SWAL_TIMER_MS = 1800;

  const SPG_SWAL_SUCCESS_ICON_HTML = `<div class="spg-swal-check-icon" aria-hidden="true">
    <img src="images/checked-green.svg" width="40" height="40" alt="">
  </div>`;

  const SPG_SWAL_DELETE_ICON_HTML = `<div class="spg-swal-trash-icon" aria-hidden="true">
    <img src="images/trash.svg" width="32" height="32" alt="">
  </div>`;

  function spgSwalAvailable() {
    return (
      typeof Swal !== "undefined" &&
      typeof Swal.fire === "function"
    );
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
    spgAlertSuccessCompact(
      "تمت الإضافة بنجاح",
      "تمت إضافة العنصر بنجاح."
    );
  }

  function spgAlertSaved() {
    spgAlertSuccessCompact(
      "تم الحفظ بنجاح",
      "تم تحديث البيانات بنجاح."
    );
  }

  function spgAlertDocumentUploaded() {
    spgAlertSuccessCompact(
      "تم رفع الملف بنجاح",
      "تم اختيار الملف وإضافته بنجاح."
    );
  }

  function spgAlertDeleted() {
    spgAlertSuccessCompact(
      "تم الحذف بنجاح",
      "تم حذف العنصر بنجاح."
    );
  }

  function spgConfirmDelete() {
    if (!spgSwalAvailable()) {
      return Promise.resolve(
        window.confirm("هل أنت متأكد؟")
      );
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
        confirmButton:
          "btn-main badge-rejected swal2-spg-confirm-delete",
        cancelButton:
          "btn-main btn-primary-outline swal2-spg-confirm-cancel",
        actions: "swal2-spg-confirm-actions",
      },
      buttonsStyling: false,
    }).then(
      (result) => result.isConfirmed === true
    );
  }

  function setView(nextView) {
    view = nextView;

    $("#spgViewLanding")?.classList.toggle(
      "d-none",
      view !== "landing"
    );

    $("#spgViewWizard")?.classList.toggle(
      "d-none",
      view !== "wizard"
    );

    $("#spgViewReview")?.classList.toggle(
      "d-none",
      view !== "review"
    );

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
      proposalType === "government"
        ? "عرض مناقصة حكومية"
        : "عرض مشروع خاص";

    const labelEl =
      $("#spgWizardTypeLabel");

    if (labelEl) {
      labelEl.textContent = typeLabel;
    }
  }

  function updateWizardUI() {
    $$(".spg-wizard-step").forEach(
      (stepEl) => {
        const step =
          Number(stepEl.dataset.step);

        stepEl.classList.toggle(
          "d-none",
          step !== wizardStep
        );
      }
    );

    const counter =
      $("#spgStepCounter");

    const heading =
      $("#spgStepHeading");

    const bar =
      $("#spgProgressBar");

    if (counter) {
      counter.textContent =
        `الخطوة ${wizardStep} من ${TOTAL_STEPS}`;
    }

    if (heading) {
      heading.textContent =
        STEP_HEADINGS[wizardStep - 1] || "";
    }

    if (bar) {
      const pct =
        Math.round(
          (wizardStep / TOTAL_STEPS) * 100
        );

      bar.style.width =
        pct + "%";

      bar.setAttribute(
        "aria-valuenow",
        String(pct)
      );
    }

    renderStepDots();

    const nextBtn =
      $("#spgWizardNext");

    const nextArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
      <path d="M8.47485 15.5583L3.41652 10.5L8.47485 5.44165"
        stroke="#fff"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"></path>
      <path opacity="0.4"
        d="M17.583 10.5H3.55801"
        stroke="#fff"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"></path>
    </svg>`;

    if (nextBtn) {
      const label =
        wizardStep === TOTAL_STEPS
          ? "متابعة للمراجعة"
          : "التالي";

      nextBtn.innerHTML =
        `${label} ${nextArrowSvg}`;
    }

    const prevBtn =
      $("#spgWizardPrev");

    if (prevBtn) {
      prevBtn.disabled =
        wizardStep === 1;
    }
  }

  function renderStepDots() {
    const dots =
      $("#spgStepDots");

    if (!dots) return;

    dots.innerHTML = "";

    for (
      let i = 1;
      i <= TOTAL_STEPS;
      i++
    ) {
      const dot =
        document.createElement("span");

      dot.className =
        "spg-step-dot";

      if (i < wizardStep) {
        dot.classList.add(
          "completed"
        );
      }

      if (i === wizardStep) {
        dot.classList.add(
          "current"
        );
      }

      dot.title =
        STEP_HEADINGS[i - 1];

      dots.appendChild(dot);
    }
  }

  function validateStep(step) {
    if (step === 1) {
      const name =
        (
          $("#spgProjectName")
            ?.value || ""
        ).trim();

      if (!name) {
        $("#spgProjectName")
          ?.focus();

        $("#spgProjectName")
          ?.classList.add(
            "is-invalid"
          );

        return false;
      }

      $("#spgProjectName")
        ?.classList.remove(
          "is-invalid"
        );
    }

    return true;
  }

  function wizardNext() {
    if (!validateStep(wizardStep)) {
      return;
    }

    if (wizardStep >= TOTAL_STEPS) {
      setView("review");
      return;
    }

    wizardStep += 1;

    updateWizardUI();
  }

  function wizardPrev() {
    if (wizardStep <= 1) {
      return;
    }

    wizardStep -= 1;

    updateWizardUI();
  }

  function toggleConditionalPanels() {
    const hasDocs =
      document.querySelector(
        'input[name="spgHasDocs"]:checked'
      )?.value === "yes";

    const hasTeam =
      document.querySelector(
        'input[name="spgHasTeam"]:checked'
      )?.value === "yes";

    const hasContracts =
      document.querySelector(
        'input[name="spgHasContracts"]:checked'
      )?.value === "yes";

    $("#spgDocumentsPanel")
      ?.classList.toggle(
        "d-none",
        !hasDocs
      );

    $("#spgTeamPanel")
      ?.classList.toggle(
        "d-none",
        !hasTeam
      );

    $("#spgContractsPanel")
      ?.classList.toggle(
        "d-none",
        !hasContracts
      );
  }

  /*
   * ==========================
   * DOCUMENTS
   * ==========================
   */

  function resolveDocument(id, tr) {
    if (!id || !tr) return null;

    return {
      id,
      name:
        tr.dataset.spgName || "",
      description:
        tr.dataset.spgDescription || "",
      fileName:
        tr.dataset.spgFileName || "",
    };
  }

  function getDocumentDraftFields() {
    return {
      name:
        (
          $("#spgDocDraftName")
            ?.value || ""
        ).trim(),

      description:
        (
          $("#spgDocDraftDesc")
            ?.value || ""
        ).trim(),
    };
  }

  function showDocumentFormError(message) {
    const errorEl =
      $("#spgDocDraftFileError");

    if (!errorEl) return;

    if (message) {
      errorEl.textContent =
        message;

      errorEl.classList.remove(
        "d-none"
      );
    } else {
      errorEl.textContent = "";

      errorEl.classList.add(
        "d-none"
      );
    }
  }

  function updateDocumentFormEditUI() {
    const actions =
      $("#spgDocumentEditActions");

    const card =
      $("#spgDocumentFormCard");

    const isEditing =
      Boolean(
        documentFormEditingId
      );

    actions?.classList.toggle(
      "d-none",
      !isEditing
    );

    actions?.classList.toggle(
      "d-flex",
      isEditing
    );

    card?.classList.toggle(
      "spg-collection-form-editing",
      isEditing
    );
  }

  /*
   * Keeps the editing visual state
   * consistent between all collections.
   */
  function updateCollectionFormEditUI(
    activeForm
  ) {
    const forms = [
      $("#spgDocumentFormCard"),
      $("#spgTeamFormCard"),
      $("#spgContractFormCard"),
    ];

    forms.forEach(
      (form) => {
        if (!form) return;

        form.classList.toggle(
          "spg-collection-form-editing",
          form === activeForm
        );
      }
    );
  }

  function resetDocumentForm(
    clearEditing = true
  ) {
    if (clearEditing) {
      documentFormEditingId =
        null;
    }

    const nameEl =
      $("#spgDocDraftName");

    const descEl =
      $("#spgDocDraftDesc");

    const fileEl =
      $("#spgDocDraftFile");

    const infoEl =
      $("#spgDocDraftFileInfo");

    if (nameEl) {
      nameEl.value = "";
    }

    if (descEl) {
      descEl.value = "";
    }

    if (fileEl) {
      fileEl.value = "";
    }

    if (infoEl) {
      infoEl.textContent = "";

      infoEl.classList.add(
        "d-none"
      );
    }

    showDocumentFormError("");

    nameEl?.classList.remove(
      "is-invalid"
    );

    updateDocumentFormEditUI();

    if (
      !teamFormEditingId &&
      !contractFormEditingId
    ) {
      updateCollectionFormEditUI(
        null
      );
    }
  }

  function setSpgFormFieldValue(
    selector,
    value
  ) {
    const el = $(selector);

    if (!el) {
      return;
    }

    const normalized =
      value == null
        ? ""
        : String(value);

    if (el.tagName === "SELECT") {
      el.value = normalized;

      if (
        el.value !== normalized &&
        normalized.trim()
      ) {
        const match = Array.from(
          el.options
        ).find(
          (opt) =>
            opt.text.trim() ===
              normalized.trim() ||
            opt.value === normalized
        );

        if (match) {
          el.value = match.value;
        }
      }

      return;
    }

    el.value = normalized;
  }

  function scrollSpgCollectionFormIntoView(
    formCard,
    focusEl
  ) {
    if (!formCard) {
      return;
    }

    requestAnimationFrame(() => {
      formCard.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      const target =
        focusEl ||
        formCard.querySelector(
          "input:not([type='hidden']):not([type='file']), textarea, select"
        );

      if (
        !target ||
        typeof target.focus !==
          "function"
      ) {
        return;
      }

      try {
        target.focus({
          preventScroll: true,
        });
      } catch (_err) {
        target.focus();
      }
    });
  }

  function loadDocumentIntoForm(
    doc
  ) {
    documentFormEditingId =
      doc.id;

    teamFormEditingId = null;
    contractFormEditingId = null;

    const nameEl =
      $("#spgDocDraftName");

    const descEl =
      $("#spgDocDraftDesc");

    const infoEl =
      $("#spgDocDraftFileInfo");

    if (nameEl) {
      nameEl.value =
        doc.name || "";
    }

    if (descEl) {
      descEl.value =
        doc.description || "";
    }

    if (infoEl) {
      if (doc.fileName) {
        infoEl.textContent =
          `الملف الحالي: ${doc.fileName}`;

        infoEl.classList.remove(
          "d-none"
        );
      } else {
        infoEl.textContent = "";

        infoEl.classList.add(
          "d-none"
        );
      }
    }

    const fileEl =
      $("#spgDocDraftFile");

    if (fileEl) {
      fileEl.value = "";
    }

    showDocumentFormError("");

    nameEl?.classList.remove(
      "is-invalid"
    );

    updateCollectionFormEditUI(
      $("#spgDocumentFormCard")
    );

    updateDocumentFormEditUI();

    scrollSpgCollectionFormIntoView(
      $("#spgDocumentFormCard"),
      nameEl
    );
  }

  function saveDocumentEditMetadata() {
    if (!documentFormEditingId) {
      return;
    }

    const { name } =
      getDocumentDraftFields();

    if (!name) {
      showDocumentFormError(
        "يرجى إدخال اسم الملف"
      );

      $("#spgDocDraftName")
        ?.classList.add(
          "is-invalid"
        );

      $("#spgDocDraftName")
        ?.focus();

      return;
    }

    showDocumentFormError("");

    $("#spgDocDraftName")
      ?.classList.remove(
        "is-invalid"
      );

    resetDocumentForm(true);

    spgAlertSaved();
  }

  function bindDocumentUploadForm() {
    if (documentUploadBound) {
      return;
    }

    const uploadBox =
      $("#spgDocUploadBox");

    const fileInput =
      $("#spgDocDraftFile");

    if (!uploadBox || !fileInput) {
      return;
    }

    documentUploadBound = true;

    const MAX_SIZE =
      500 * 1024 * 1024;

    const handleFile =
      (file) => {
        const infoEl =
          $("#spgDocDraftFileInfo");

        showDocumentFormError("");

        if (!file) return;

        if (file.size > MAX_SIZE) {
          showDocumentFormError(
            "حجم الملف أكبر من 500 ميغابايت"
          );

          if (infoEl) {
            infoEl.classList.add(
              "d-none"
            );

            infoEl.textContent = "";
          }

          return;
        }

        if (infoEl) {
          infoEl.textContent =
            `تم اختيار الملف: ${file.name}`;

          infoEl.classList.remove(
            "d-none"
          );
        }

        spgAlertDocumentUploaded();
      };

    uploadBox.addEventListener(
      "click",
      (e) => {
        if (e.target === fileInput) {
          return;
        }

        fileInput.click();
      }
    );

    fileInput.addEventListener(
      "click",
      (e) =>
        e.stopPropagation()
    );

    fileInput.addEventListener(
      "change",
      () =>
        handleFile(
          fileInput.files?.[0]
        )
    );

    uploadBox.addEventListener(
      "dragover",
      (e) => {
        e.preventDefault();

        uploadBox.classList.add(
          "dragover"
        );
      }
    );

    uploadBox.addEventListener(
      "dragleave",
      () =>
        uploadBox.classList.remove(
          "dragover"
        )
    );

    uploadBox.addEventListener(
      "drop",
      (e) => {
        e.preventDefault();

        uploadBox.classList.remove(
          "dragover"
        );

        handleFile(
          e.dataTransfer.files?.[0]
        );
      }
    );

    $("#spgDocEditSave")
      ?.addEventListener(
        "click",
        () =>
          saveDocumentEditMetadata()
      );

    $("#spgDocEditCancel")
      ?.addEventListener(
        "click",
        () =>
          resetDocumentForm(true)
      );
  }

  /*
   * ==========================
   * TEAM MEMBERS
   * ==========================
   */

  function resolveTeamMember(
    id,
    tr
  ) {
    if (!id || !tr) {
      return null;
    }

    return {
      id,

      name:
        tr.dataset.spgName || "",

      nationality:
        tr.dataset.spgNationality || "",

      jobTitle:
        tr.dataset.spgJobTitle || "",

      degree:
        tr.dataset.spgDegree || "",

      years:
        tr.dataset.spgYears || "",

      experiences:
        tr.dataset.spgExperiences || "",

      summary:
        tr.dataset.spgSummary || "",

      cvFileName:
        tr.dataset.spgCvFileName || "",
    };
  }

  function getTeamDraftFields() {
    return {
      name:
        (
          $("#spgTeamDraftName")
            ?.value || ""
        ).trim(),

      nationality:
        (
          $("#spgTeamDraftNationality")
            ?.value || ""
        ).trim(),

      jobTitle:
        (
          $("#spgTeamDraftJobTitle")
            ?.value || ""
        ).trim(),

      degree:
        (
          $("#spgTeamDraftDegree")
            ?.value || ""
        ).trim(),

      years:
        (
          $("#spgTeamDraftYears")
            ?.value || ""
        ).trim(),

      cvFileName:
        (
          $("#spgTeamDraftCvFileName")
            ?.value || ""
        ).trim(),

      summary:
        (
          $("#spgTeamDraftSummary")
            ?.value || ""
        ).trim(),
    };
  }

  function showTeamFormError(
    message
  ) {
    const errorEl =
      $("#spgTeamFormError");

    if (!errorEl) return;

    if (message) {
      errorEl.textContent =
        message;

      errorEl.classList.remove(
        "d-none"
      );
    } else {
      errorEl.textContent = "";

      errorEl.classList.add(
        "d-none"
      );
    }
  }

  function updateTeamFormEditUI() {
    const primaryActions =
      $("#spgTeamFormPrimaryActions");

    const editActions =
      $("#spgTeamEditActions");

    const card =
      $("#spgTeamFormCard");

    const isEditing =
      Boolean(teamFormEditingId);

    primaryActions?.classList.toggle(
      "d-none",
      isEditing
    );

    editActions?.classList.toggle(
      "d-none",
      !isEditing
    );

    editActions?.classList.toggle(
      "d-flex",
      isEditing
    );

    card?.classList.toggle(
      "spg-collection-form-editing",
      isEditing
    );
  }

  function resetTeamForm(
    clearEditing = true
  ) {
    if (clearEditing) {
      teamFormEditingId =
        null;
    }

    const fields = [
      "#spgTeamDraftName",
      "#spgTeamDraftNationality",
      "#spgTeamDraftJobTitle",
      "#spgTeamDraftDegree",
      "#spgTeamDraftYears",
      "#spgTeamDraftCvFileName",
    ];

    fields.forEach(
      (selector) => {
        const el = $(selector);

        if (el) {
          el.value = "";
        }
      }
    );

    setSpgFormFieldValue(
      "#spgTeamDraftSummary",
      ""
    );

    showTeamFormError("");

    updateTeamFormEditUI();

    if (
      !documentFormEditingId &&
      !contractFormEditingId
    ) {
      updateCollectionFormEditUI(
        null
      );
    }
  }

  function loadTeamMemberIntoForm(
    member
  ) {
    teamFormEditingId =
      member.id;

    documentFormEditingId = null;
    contractFormEditingId = null;

    setSpgFormFieldValue(
      "#spgTeamDraftName",
      member.name || ""
    );

    setSpgFormFieldValue(
      "#spgTeamDraftNationality",
      member.nationality || ""
    );

    setSpgFormFieldValue(
      "#spgTeamDraftJobTitle",
      member.jobTitle || ""
    );

    setSpgFormFieldValue(
      "#spgTeamDraftDegree",
      member.degree || ""
    );

    const yearsRaw =
      member.years || "";

    const yearsDigits =
      yearsRaw.match(/\d+/)?.[0] ||
      yearsRaw;

    setSpgFormFieldValue(
      "#spgTeamDraftYears",
      yearsDigits
    );

    setSpgFormFieldValue(
      "#spgTeamDraftCvFileName",
      member.cvFileName || ""
    );

    setSpgFormFieldValue(
      "#spgTeamDraftSummary",
      member.summary ||
        member.experiences ||
        ""
    );

    showTeamFormError("");

    updateCollectionFormEditUI(
      $("#spgTeamFormCard")
    );

    updateTeamFormEditUI();

    scrollSpgCollectionFormIntoView(
      $("#spgTeamFormCard"),
      $("#spgTeamDraftName")
    );
  }

  function saveTeamFromForm() {
    const fields =
      getTeamDraftFields();

    if (!fields.name) {
      showTeamFormError(
        "يرجى إدخال اسم الموظف"
      );

      $("#spgTeamDraftName")
        ?.focus();

      return;
    }

    showTeamFormError("");

    const wasEditing =
      Boolean(teamFormEditingId);

    resetTeamForm(true);

    if (wasEditing) {
      spgAlertSaved();
    } else {
      spgAlertAdded();
    }
  }

  function saveTeamEdit() {
    saveTeamFromForm();
  }

  /*
   * ==========================
   * CONTRACTS
   * ==========================
   */

  function resolveContract(
    id,
    tr
  ) {
    if (!id || !tr) {
      return null;
    }

    return {
      id,

      projectName:
        tr.dataset.spgProjectName || "",

      entity:
        tr.dataset.spgEntity || "",

      description:
        tr.dataset.spgDescription || "",

      year:
        tr.dataset.spgYear || "",

      duration:
        tr.dataset.spgDuration || "",

      cost:
        tr.dataset.spgCost || "",

      fileName:
        tr.dataset.spgContractFileName || "",
    };
  }

  function getContractDraftFields() {
    return {
      projectName:
        (
          $("#spgContractDraftProjectName")
            ?.value || ""
        ).trim(),

      entity:
        (
          $("#spgContractDraftEntity")
            ?.value || ""
        ).trim(),

      description:
        (
          $("#spgContractDraftDescription")
            ?.value || ""
        ).trim(),

      year:
        (
          $("#spgContractDraftYear")
            ?.value || ""
        ).trim(),

      duration:
        (
          $("#spgContractDraftDuration")
            ?.value || ""
        ).trim(),

      cost:
        (
          $("#spgContractDraftCost")
            ?.value || ""
        ).trim(),

      fileName:
        (
          $("#spgContractDraftFileName")
            ?.value || ""
        ).trim(),
    };
  }

  function showContractFormError(
    message
  ) {
    const errorEl =
      $("#spgContractFormError");

    if (!errorEl) return;

    if (message) {
      errorEl.textContent =
        message;

      errorEl.classList.remove(
        "d-none"
      );
    } else {
      errorEl.textContent = "";

      errorEl.classList.add(
        "d-none"
      );
    }
  }

  function updateContractFormEditUI() {
    const primaryActions =
      $("#spgContractFormPrimaryActions");

    const editActions =
      $("#spgContractEditActions");

    const card =
      $("#spgContractFormCard");

    const isEditing =
      Boolean(
        contractFormEditingId
      );

    primaryActions?.classList.toggle(
      "d-none",
      isEditing
    );

    editActions?.classList.toggle(
      "d-none",
      !isEditing
    );

    editActions?.classList.toggle(
      "d-flex",
      isEditing
    );

    card?.classList.toggle(
      "spg-collection-form-editing",
      isEditing
    );
  }

  function resetContractForm(
    clearEditing = true
  ) {
    if (clearEditing) {
      contractFormEditingId =
        null;
    }

    const fields = [
      "#spgContractDraftProjectName",
      "#spgContractDraftEntity",
      "#spgContractDraftDescription",
      "#spgContractDraftYear",
      "#spgContractDraftDuration",
      "#spgContractDraftCost",
      "#spgContractDraftFileName",
    ];

    fields.forEach(
      (selector) => {
        const el = $(selector);

        if (el) {
          el.value = "";
        }
      }
    );

    showContractFormError("");

    updateContractFormEditUI();

    if (
      !documentFormEditingId &&
      !teamFormEditingId
    ) {
      updateCollectionFormEditUI(
        null
      );
    }
  }

  function loadContractIntoForm(
    contract
  ) {
    contractFormEditingId =
      contract.id;

    documentFormEditingId = null;
    teamFormEditingId = null;

    $("#spgContractDraftProjectName").value =
      contract.projectName || "";

    $("#spgContractDraftEntity").value =
      contract.entity || "";

    $("#spgContractDraftDescription").value =
      contract.description || "";

    $("#spgContractDraftYear").value =
      contract.year || "";

    $("#spgContractDraftDuration").value =
      contract.duration || "";

    $("#spgContractDraftCost").value =
      contract.cost || "";

    $("#spgContractDraftFileName").value =
      contract.fileName || "";

    showContractFormError("");

    updateCollectionFormEditUI(
      $("#spgContractFormCard")
    );

    updateContractFormEditUI();

    scrollSpgCollectionFormIntoView(
      $("#spgContractFormCard"),
      $("#spgContractDraftProjectName")
    );
  }

  function saveContractFromForm() {
    const fields =
      getContractDraftFields();

    if (!fields.projectName) {
      showContractFormError(
        "يرجى إدخال اسم المشروع"
      );

      $("#spgContractDraftProjectName")
        ?.focus();

      return;
    }

    showContractFormError("");

    const wasEditing =
      Boolean(contractFormEditingId);

    resetContractForm(true);

    if (wasEditing) {
      spgAlertSaved();
    } else {
      spgAlertAdded();
    }
  }

  function saveContractEdit() {
    saveContractFromForm();
  }

  /*
   * ==========================
   * COLLECTION TABLE ACTIONS
   * ==========================
   */

  function bindCollectionTableActions() {
    /*
     * ==========================
     * DOCUMENTS
     * ==========================
     */

    const docBody =
      $("#spgDocumentsTableBody");

    if (
      docBody &&
      !docBody.dataset.spgActionsBound
    ) {
      docBody.dataset.spgActionsBound =
        "1";

      docBody.addEventListener(
        "click",
        (e) => {
          const editBtn =
            e.target.closest(
              ".spg-doc-edit"
            );

          const deleteBtn =
            e.target.closest(
              ".spg-doc-delete"
            );

          const tr =
            e.target.closest("tr");

          if (editBtn) {
            const doc =
              resolveDocument(
                editBtn.dataset.id,
                tr
              );

            if (doc) {
              loadDocumentIntoForm(
                doc
              );
            }

            return;
          }

          if (deleteBtn) {
            spgConfirmDelete().then(
              (confirmed) => {
                if (!confirmed) {
                  return;
                }

                const id =
                  deleteBtn.dataset.id;

                if (
                  documentFormEditingId ===
                  id
                ) {
                  resetDocumentForm(
                    true
                  );
                }

                tr?.remove();

                spgAlertDeleted();
              }
            );
          }
        }
      );
    }

    /*
     * ==========================
     * TEAM MEMBERS
     * ==========================
     */

    const teamBody =
      $("#spgTeamList");

    if (
      teamBody &&
      !teamBody.dataset.spgActionsBound
    ) {
      teamBody.dataset.spgActionsBound =
        "1";

      teamBody.addEventListener(
        "click",
        (e) => {
          const editBtn =
            e.target.closest(
              ".spg-team-edit"
            );

          const deleteBtn =
            e.target.closest(
              ".spg-team-delete"
            );

          const tr =
            e.target.closest("tr");

          if (editBtn) {
            const member =
              resolveTeamMember(
                editBtn.dataset.id,
                tr
              );

            if (member) {
              loadTeamMemberIntoForm(
                member
              );
            }

            return;
          }

          if (deleteBtn) {
            spgConfirmDelete().then(
              (confirmed) => {
                if (!confirmed) {
                  return;
                }

                const id =
                  deleteBtn.dataset.id;

                if (
                  teamFormEditingId ===
                  id
                ) {
                  resetTeamForm(
                    true
                  );
                }

                tr?.remove();

                spgAlertDeleted();
              }
            );
          }
        }
      );
    }

    /*
     * ==========================
     * CONTRACTS
     * ==========================
     */

    const contractBody =
      $("#spgContractsList");

    if (
      contractBody &&
      !contractBody.dataset.spgActionsBound
    ) {
      contractBody.dataset.spgActionsBound =
        "1";

      contractBody.addEventListener(
        "click",
        (e) => {
          const editBtn =
            e.target.closest(
              ".spg-contract-edit"
            );

          const deleteBtn =
            e.target.closest(
              ".spg-contract-delete"
            );

          const tr =
            e.target.closest("tr");

          if (editBtn) {
            const contract =
              resolveContract(
                editBtn.dataset.id,
                tr
              );

            if (contract) {
              loadContractIntoForm(
                contract
              );
            }

            return;
          }

          if (deleteBtn) {
            spgConfirmDelete().then(
              (confirmed) => {
                if (!confirmed) {
                  return;
                }

                const id =
                  deleteBtn.dataset.id;

                if (
                  contractFormEditingId ===
                  id
                ) {
                  resetContractForm(
                    true
                  );
                }

                tr?.remove();

                spgAlertDeleted();
              }
            );
          }
        }
      );
    }
  }

  /*
   * ==========================
   * PROJECT DRAWER
   * ==========================
   */

  function bindProjectsDrawer() {
    const root =
      $(".spg-root");

    const panel =
      $("#spgProjectsSidebar");

    const backdrop =
      $("#spgProjectsSidebarBackdrop");

    const openBtn =
      $("#spgProjectsSidebarOpen");

    const closeBtn =
      $("#spgProjectsSidebarClose");

    if (!root || !panel) {
      return;
    }

    const mobileQuery =
      window.matchMedia(
        "(max-width: 767.98px)"
      );

    function syncDrawerA11yDesktop() {
      if (!mobileQuery.matches) {
        root.classList.remove(
          "spg-projects-drawer-open"
        );

        document.body.classList.remove(
          "spg-projects-drawer-open"
        );

        backdrop?.classList.remove(
          "show"
        );

        document.body.classList.remove(
          "spg-projects-drawer-body-lock"
        );

        panel.removeAttribute(
          "aria-hidden"
        );

        panel.setAttribute(
          "role",
          "complementary"
        );

        panel.removeAttribute(
          "aria-modal"
        );

        openBtn?.setAttribute(
          "aria-expanded",
          "false"
        );

        return true;
      }

      panel.setAttribute(
        "role",
        "dialog"
      );

      panel.setAttribute(
        "aria-modal",
        "true"
      );

      if (
        !root.classList.contains(
          "spg-projects-drawer-open"
        )
      ) {
        panel.setAttribute(
          "aria-hidden",
          "true"
        );
      }

      return false;
    }

    function isMobileDrawerViewport() {
      return mobileQuery.matches;
    }

    function openDrawer() {
      if (
        !isMobileDrawerViewport()
      ) {
        return;
      }

      root.classList.add(
        "spg-projects-drawer-open"
      );

      document.body.classList.add(
        "spg-projects-drawer-open"
      );

      backdrop?.classList.add(
        "show"
      );

      backdrop?.setAttribute(
        "aria-hidden",
        "false"
      );

      openBtn?.setAttribute(
        "aria-expanded",
        "true"
      );

      panel.setAttribute(
        "aria-hidden",
        "false"
      );

      document.body.classList.add(
        "spg-projects-drawer-body-lock"
      );

      closeBtn?.focus();
    }

    function closeDrawer() {
      if (
        !isMobileDrawerViewport()
      ) {
        return;
      }

      root.classList.remove(
        "spg-projects-drawer-open"
      );

      document.body.classList.remove(
        "spg-projects-drawer-open"
      );

      backdrop?.classList.remove(
        "show"
      );

      backdrop?.setAttribute(
        "aria-hidden",
        "true"
      );

      openBtn?.setAttribute(
        "aria-expanded",
        "false"
      );

      panel.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.classList.remove(
        "spg-projects-drawer-body-lock"
      );

      openBtn?.focus();
    }

    openBtn?.addEventListener(
      "click",
      openDrawer
    );

    closeBtn?.addEventListener(
      "click",
      closeDrawer
    );

    backdrop?.addEventListener(
      "click",
      closeDrawer
    );

    document.addEventListener(
      "keydown",
      (e) => {
        if (
          e.key === "Escape" &&
          root.classList.contains(
            "spg-projects-drawer-open"
          )
        ) {
          closeDrawer();
        }
      }
    );

    const projectList =
      $("#spgProjectList");

    projectList?.addEventListener(
      "click",
      (e) => {
        const item =
          e.target.closest(
            ".spg-project-item, [data-spg-dynamic-project]"
          );

        if (
          item &&
          root.classList.contains(
            "spg-projects-drawer-open"
          )
        ) {
          closeDrawer();
        }
      }
    );

    mobileQuery.addEventListener(
      "change",
      syncDrawerA11yDesktop
    );

    syncDrawerA11yDesktop();
  }

  /*
   * ==========================
   * EVENTS
   * ==========================
   */

  function bindEvents() {
    bindProjectsDrawer();

    $$(".spg-path-card[data-proposal-type]")
      .forEach(
        (btn) => {
          btn.addEventListener(
            "click",
            () => {
              btn.classList.add(
                "active"
              );

              startWizard(
                btn.dataset.proposalType
              );
            }
          );
        }
      );

    $("#spgWizardNext")
      ?.addEventListener(
        "click",
        wizardNext
      );

    $("#spgWizardPrev")
      ?.addEventListener(
        "click",
        wizardPrev
      );

    $("#spgWizardBackToLanding")
      ?.addEventListener(
        "click",
        () =>
          setView("landing")
      );

    $$(
      'input[name="spgHasDocs"], input[name="spgHasTeam"], input[name="spgHasContracts"]'
    ).forEach(
      (input) => {
        input.addEventListener(
          "change",
          () =>
            toggleConditionalPanels()
        );
      }
    );

    bindDocumentUploadForm();
    bindCollectionTableActions();

    /*
     * ==========================
     * TEAM EDIT ACTIONS
     * ==========================
     */

    $("#spgAddTeamBtn")
      ?.addEventListener(
        "click",
        () =>
          saveTeamFromForm()
      );

    $("#spgTeamEditSave")
      ?.addEventListener(
        "click",
        () =>
          saveTeamEdit()
      );

    $("#spgTeamEditCancel")
      ?.addEventListener(
        "click",
        () =>
          resetTeamForm(true)
      );

    /*
     * ==========================
     * CONTRACT EDIT ACTIONS
     * ==========================
     */

    $("#spgAddContractBtn")
      ?.addEventListener(
        "click",
        () =>
          saveContractFromForm()
      );

    $("#spgContractEditSave")
      ?.addEventListener(
        "click",
        () =>
          saveContractEdit()
      );

    $("#spgContractEditCancel")
      ?.addEventListener(
        "click",
        () =>
          resetContractForm(true)
      );

    $("#spgReviewBack")
      ?.addEventListener(
        "click",
        () => {
          wizardStep =
            TOTAL_STEPS;

          setView("wizard");
        }
      );

    $("#spgOptionalSections")
      ?.addEventListener(
        "change",
        (e) => {
          if (
            !e.target.closest(
              ".spg-optional-toggle"
            )
          ) {
            return;
          }

          renderReview();
        }
      );
  }

  function init() {
    if (!$(".spg-root")) {
      return;
    }

    bindEvents();

    setView(view);
  }

  document.addEventListener(
    "DOMContentLoaded",
    init
  );
})();