(function () {
  "use strict";

  const STORAGE_KEY = "trsyat-spg-projects-v1";
  const TOTAL_STEPS = 5;

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

  const CORE_SECTIONS = [
    {
      id: "cover",
      title: "الغلاف والمعلومات العامة",
      description: "بيانات المنافسة، رقم المنافسة، الجهة، الموعد النهائي",
    },
    {
      id: "understanding",
      title: "فهم المشروع والمنهجية",
      description: "تحليل متطلبات المشروع، خطة العمل المعتمدة",
    },
    {
      id: "workplan",
      title: "خطة العمل والتنفيذ",
      description: "مراحل التنفيذ، الجداول الزمنية لكل خطوة",
    },
    {
      id: "team",
      title: "الهيكل التنظيمي وفريق العمل",
      description: "أدوار ومسؤوليات فريق العمل، خبرات فريق العمل",
    },
    {
      id: "financial",
      title: "العرض المالي",
      description: "تفاصيل التسعير، المبلغ الإجمالي شامل الضريبة",
    },
  ];

  const OPTIONAL_SECTIONS = [
    {
      id: "risk",
      title: "خطة إدارة المخاطر",
      description: "إدارة المخاطر المحتملة وخطط الاستجابة لها",
      defaultOn: true,
    },
    {
      id: "experience",
      title: "الخبرات والعقود السابقة",
      description: "مشاريع سابقة تُظهر الخبرة والقدرات",
      defaultOn: true,
    },
    {
      id: "quality",
      title: "خطة إدارة الجودة",
      description: "معايير الجودة، طرق المراجعة، التوثيق",
      defaultOn: false,
    },
    {
      id: "timeline",
      title: "الجدول الزمني للتنفيذ",
      description: "المراحل، المخرجات، المسؤولون",
      defaultOn: true,
    },
  ];

  const DETAIL_PAGE_RANGES = {
    detailed: [13, 16],
    medium: [10, 13],
    brief: [6, 9],
  };

  let projects = [];
  let activeProjectId = null;
  let view = "landing";
  let wizardStep = 1;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function uid() {
    return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function entryId() {
    return "e-" + Math.random().toString(36).slice(2, 9);
  }

  function defaultProject(title) {
    const optional = {};
    OPTIONAL_SECTIONS.forEach((s) => {
      optional[s.id] = s.defaultOn;
    });
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
      optionalSections: optional,
      updatedAt: Date.now(),
    };
  }

  function loadProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        projects = JSON.parse(raw);
        return;
      }
    } catch (_) {
      /* ignore */
    }
    projects = [
      Object.assign(defaultProject("توريد وتركيب أنظمة مراقبة"), {
        proposalType: "government",
        projectName: "توريد وتركيب أنظمة مراقبة",
        tenderNumber: "250739020707",
        view: "landing",
      }),
      Object.assign(defaultProject("صيانة البنية التحتية"), {
        proposalType: "private",
        projectName: "صيانة البنية التحتية",
        view: "landing",
      }),
    ];
    saveProjects();
  }

  function saveProjects() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

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
    renderDocumentsList(p);
    renderTeamList(p);
    renderContractsList(p);
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
    const items = projects
      .filter((p) => !q || (p.title || "").toLowerCase().includes(q))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    list.innerHTML = "";
    if (!items.length) {
      empty?.classList.remove("d-none");
      return;
    }
    empty?.classList.add("d-none");

    items.forEach((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "chat-item d-flex align-items-center gap-12 w-100 border-0 bg-transparent text-end";
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
          <div class="fz-10 text-gray chat-preview text-truncate">${escapeHtml(statusLabel(p))}</div>
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
    if (nextBtn) {
      nextBtn.textContent = wizardStep === TOTAL_STEPS ? "متابعة للمراجعة" : "التالي";
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

    if (hasDocs && !p.documents.length) {
      p.documents.push({ id: entryId(), name: "", description: "", fileName: "" });
      saveProjects();
      renderDocumentsList(p);
    }
    if (hasTeam && !p.team.length) {
      p.team.push(emptyTeamMember());
      saveProjects();
      renderTeamList(p);
    }
    if (hasContracts && !p.contracts.length) {
      p.contracts.push(emptyContract());
      saveProjects();
      renderContractsList(p);
    }
  }

  function emptyTeamMember() {
    return {
      id: entryId(),
      name: "",
      nationality: "",
      jobTitle: "",
      degree: "",
      years: "",
      experiences: "",
      summary: "",
      cvFileName: "",
    };
  }

  function emptyContract() {
    return {
      id: entryId(),
      projectName: "",
      entity: "",
      description: "",
      year: "",
      duration: "",
      cost: "",
      contractFileName: "",
    };
  }

  function renderDocumentsList(p) {
    const list = $("#spgDocumentsList");
    if (!list || !p) return;
    list.innerHTML = "";

    p.documents.forEach((doc, index) => {
      const wrap = document.createElement("div");
      wrap.className = "spg-repeater-item tender-card p-3 bg-white";
      wrap.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
          <span class="fz-12 fw-medium black-text">مستند ${index + 1}</span>
          ${p.documents.length > 1 ? `<button type="button" class="btn-link fz-12 red-colored spg-remove-doc" data-id="${doc.id}">حذف</button>` : ""}
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">اسم الملف</label>
            <input type="text" class="form-control spg-doc-name" data-id="${doc.id}" value="${escapeAttr(doc.name)}" placeholder="اسم الملف">
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">وصف الملف</label>
            <input type="text" class="form-control spg-doc-desc" data-id="${doc.id}" value="${escapeAttr(doc.description)}" placeholder="وصف مختصر">
          </div>
          <div class="col-12">
            <label class="form-label">الملف</label>
            <div class="upload-container">
              <div class="upload-box uploadBox spg-doc-upload">
                <div class="upload-icon"><img src="images/document-download.svg" alt=""></div>
                <div class="d-flex flex-column gap-10">
                  <div class="upload-title fz-10 black-text">اسحب الملف هنا أو تصفح</div>
                  <div class="upload-subtitle fz-9 text-gray">أقصى حجم 500 ميغابايت</div>
                  <input type="file" class="fileInput spg-doc-file" data-id="${doc.id}">
                  <div class="fz-10 colored d-none fileInfo">${doc.fileName ? "تم اختيار: " + escapeHtml(doc.fileName) : ""}</div>
                  <div class="red-colored fz-10 d-none errorMsg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
      list.appendChild(wrap);
      if (doc.fileName) {
        const info = wrap.querySelector(".fileInfo");
        info?.classList.remove("d-none");
      }
    });

    bindUploadBoxes(list);
    list.querySelectorAll(".spg-remove-doc").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        p.documents = p.documents.filter((d) => d.id !== id);
        if (!p.documents.length) p.documents.push({ id: entryId(), name: "", description: "", fileName: "" });
        saveProjects();
        renderDocumentsList(p);
      });
    });
    list.querySelectorAll(".spg-doc-name").forEach((input) => {
      input.addEventListener("input", () => {
        const doc = p.documents.find((d) => d.id === input.dataset.id);
        if (doc) doc.name = input.value;
        saveProjects();
      });
    });
    list.querySelectorAll(".spg-doc-desc").forEach((input) => {
      input.addEventListener("input", () => {
        const doc = p.documents.find((d) => d.id === input.dataset.id);
        if (doc) doc.description = input.value;
        saveProjects();
      });
    });
    list.querySelectorAll(".spg-doc-file").forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        const doc = p.documents.find((d) => d.id === input.dataset.id);
        if (doc && file) {
          doc.fileName = file.name;
          saveProjects();
        }
      });
    });
  }

  function renderTeamList(p) {
    const list = $("#spgTeamList");
    if (!list || !p) return;
    list.innerHTML = "";

    p.team.forEach((member, index) => {
      const wrap = document.createElement("div");
      wrap.className = "spg-repeater-item tender-card p-3 bg-white";
      wrap.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
          <span class="fz-12 fw-medium black-text">عضو ${index + 1}</span>
          ${p.team.length > 1 ? `<button type="button" class="btn-link fz-12 red-colored spg-remove-team" data-id="${member.id}">حذف</button>` : ""}
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6"><label class="form-label">اسم الموظف</label><input class="form-control spg-team-field" data-id="${member.id}" data-field="name" value="${escapeAttr(member.name)}"></div>
          <div class="col-12 col-md-6"><label class="form-label">الجنسية</label><input class="form-control spg-team-field" data-id="${member.id}" data-field="nationality" value="${escapeAttr(member.nationality)}"></div>
          <div class="col-12 col-md-6"><label class="form-label">المسمى الوظيفي</label><input class="form-control spg-team-field" data-id="${member.id}" data-field="jobTitle" value="${escapeAttr(member.jobTitle)}"></div>
          <div class="col-12 col-md-6"><label class="form-label">الشهادة</label><input class="form-control spg-team-field" data-id="${member.id}" data-field="degree" value="${escapeAttr(member.degree)}"></div>
          <div class="col-12 col-md-6"><label class="form-label">سنوات الخبرة</label><input class="form-control spg-team-field" data-id="${member.id}" data-field="years" value="${escapeAttr(member.years)}"></div>
          <div class="col-12 col-md-6"><label class="form-label">اسم ملف السيرة الذاتية</label><input class="form-control spg-team-field" data-id="${member.id}" data-field="cvFileName" value="${escapeAttr(member.cvFileName)}" placeholder="اسم الملف أو ارفع أدناه"></div>
          <div class="col-12"><label class="form-label">الخبرات</label><textarea class="form-control spg-team-field" rows="2" data-id="${member.id}" data-field="experiences">${escapeHtml(member.experiences)}</textarea></div>
          <div class="col-12"><label class="form-label">الملخص</label><textarea class="form-control spg-team-field" rows="2" data-id="${member.id}" data-field="summary">${escapeHtml(member.summary)}</textarea></div>
        </div>`;
      list.appendChild(wrap);
    });

    list.querySelectorAll(".spg-remove-team").forEach((btn) => {
      btn.addEventListener("click", () => {
        p.team = p.team.filter((m) => m.id !== btn.dataset.id);
        if (!p.team.length) p.team.push(emptyTeamMember());
        saveProjects();
        renderTeamList(p);
      });
    });
    list.querySelectorAll(".spg-team-field").forEach((input) => {
      input.addEventListener("input", () => {
        const m = p.team.find((t) => t.id === input.dataset.id);
        if (m) m[input.dataset.field] = input.value;
        saveProjects();
      });
    });
  }

  function renderContractsList(p) {
    const list = $("#spgContractsList");
    if (!list || !p) return;
    list.innerHTML = "";

    p.contracts.forEach((c, index) => {
      const wrap = document.createElement("div");
      wrap.className = "spg-repeater-item tender-card p-3 bg-white";
      wrap.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
          <span class="fz-12 fw-medium black-text">عقد ${index + 1}</span>
          ${p.contracts.length > 1 ? `<button type="button" class="btn-link fz-12 red-colored spg-remove-contract" data-id="${c.id}">حذف</button>` : ""}
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6"><label class="form-label">اسم المشروع</label><input class="form-control spg-contract-field" data-id="${c.id}" data-field="projectName" value="${escapeAttr(c.projectName)}"></div>
          <div class="col-12 col-md-6"><label class="form-label">الجهة</label><input class="form-control spg-contract-field" data-id="${c.id}" data-field="entity" value="${escapeAttr(c.entity)}"></div>
          <div class="col-12"><label class="form-label">وصف المشروع</label><textarea class="form-control spg-contract-field" rows="2" data-id="${c.id}" data-field="description">${escapeHtml(c.description)}</textarea></div>
          <div class="col-12 col-md-4"><label class="form-label">سنة المشروع</label><input class="form-control spg-contract-field" data-id="${c.id}" data-field="year" value="${escapeAttr(c.year)}"></div>
          <div class="col-12 col-md-4"><label class="form-label">مدة المشروع</label><input class="form-control spg-contract-field" data-id="${c.id}" data-field="duration" value="${escapeAttr(c.duration)}"></div>
          <div class="col-12 col-md-4"><label class="form-label">تكلفة المشروع</label><input class="form-control spg-contract-field" data-id="${c.id}" data-field="cost" value="${escapeAttr(c.cost)}"></div>
          <div class="col-12"><label class="form-label">اسم ملف العقد</label><input class="form-control spg-contract-field" data-id="${c.id}" data-field="contractFileName" value="${escapeAttr(c.contractFileName)}"></div>
        </div>`;
      list.appendChild(wrap);
    });

    list.querySelectorAll(".spg-remove-contract").forEach((btn) => {
      btn.addEventListener("click", () => {
        p.contracts = p.contracts.filter((c) => c.id !== btn.dataset.id);
        if (!p.contracts.length) p.contracts.push(emptyContract());
        saveProjects();
        renderContractsList(p);
      });
    });
    list.querySelectorAll(".spg-contract-field").forEach((input) => {
      input.addEventListener("input", () => {
        const c = p.contracts.find((x) => x.id === input.dataset.id);
        if (c) c[input.dataset.field] = input.value;
        saveProjects();
      });
    });
  }

  function escapeAttr(str) {
    return escapeHtml(str || "").replace(/"/g, "&quot;");
  }

  function bindUploadBoxes(root) {
    const MAX_SIZE = 500 * 1024 * 1024;
    root.querySelectorAll(".uploadBox").forEach((uploadBox) => {
      if (uploadBox.dataset.spgBound) return;
      uploadBox.dataset.spgBound = "1";
      const fileInput = uploadBox.querySelector(".fileInput");
      const fileInfo = uploadBox.querySelector(".fileInfo");
      const errorMsg = uploadBox.querySelector(".errorMsg");
      if (!fileInput) return;

      uploadBox.addEventListener("click", (e) => {
        if (e.target === fileInput) return;
        fileInput.click();
      });
      fileInput.addEventListener("click", (e) => e.stopPropagation());

      const handle = (file) => {
        fileInfo?.classList.add("d-none");
        errorMsg?.classList.add("d-none");
        if (!file) return;
        if (file.size > MAX_SIZE) {
          if (errorMsg) {
            errorMsg.textContent = "حجم الملف أكبر من 500 ميغابايت";
            errorMsg.classList.remove("d-none");
          }
          return;
        }
        if (fileInfo) {
          fileInfo.textContent = `تم اختيار الملف: ${file.name}`;
          fileInfo.classList.remove("d-none");
        }
      };

      uploadBox.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadBox.classList.add("dragover");
      });
      uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragover"));
      uploadBox.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadBox.classList.remove("dragover");
        handle(e.dataTransfer.files[0]);
      });
      fileInput.addEventListener("change", () => handle(fileInput.files[0]));
    });
  }

  function countEnabledOptional(p) {
    if (!p?.optionalSections) return 0;
    return OPTIONAL_SECTIONS.filter((s) => p.optionalSections[s.id]).length;
  }

  function estimatePages(p) {
    const level = p.detailLevel || "detailed";
    const [minBase, maxBase] = DETAIL_PAGE_RANGES[level] || DETAIL_PAGE_RANGES.detailed;
    const extra = countEnabledOptional(p);
    const min = minBase + extra;
    const max = maxBase + extra * 2;
    return { min, max, totalSections: 5 + extra };
  }

  function renderReview(p) {
    if (!p) return;
    persistActiveFromForm();
    $("#spgReviewConfirmNote")?.classList.add("d-none");

    const enabledOptional = countEnabledOptional(p);
    const { min, max, totalSections } = estimatePages(p);

    $("#spgSummaryTotal").textContent = String(totalSections);
    $("#spgSummaryCore").textContent = "5";
    $("#spgSummaryOptional").textContent = String(enabledOptional);
    $("#spgSummaryPages").textContent = `${min} – ${max}`;
    $("#spgSummarySizeLabel").textContent = `${totalSections} أقسام — ${min} إلى ${max} صفحة تقريبًا`;

    const coreWrap = $("#spgCoreSections");
    coreWrap.innerHTML = "";
    CORE_SECTIONS.forEach((section) => {
      const card = document.createElement("div");
      card.className = "spg-section-row tender-card p-3 bg-white d-flex gap-3 align-items-start";
      card.innerHTML = `
        <span class="spg-section-check" aria-hidden="true">
          <img src="images/checked-green.svg" alt="">
        </span>
        <div class="flex-grow-1">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
            <h6 class="black-text fz-14 mb-0">${escapeHtml(section.title)}</h6>
            <span class="sm-ele fz-10 bordered-8 badge-opacity-prim py-1 px-2">أساسي</span>
          </div>
          <p class="fz-12 text-gray mb-0">${escapeHtml(section.description)}</p>
        </div>`;
      coreWrap.appendChild(card);
    });

    const optWrap = $("#spgOptionalSections");
    optWrap.innerHTML = "";
    OPTIONAL_SECTIONS.forEach((section) => {
      const checked = p.optionalSections[section.id];
      const row = document.createElement("div");
      row.className = "spg-section-row tender-card p-3 bg-white d-flex gap-3 align-items-start";
      row.innerHTML = `
        <div class="form-check form-switch spg-section-switch flex-shrink-0 mb-0">
          <input class="form-check-input switch-control spg-optional-toggle" type="checkbox" role="switch"
            id="spg-opt-${section.id}" data-section-id="${section.id}" ${checked ? "checked" : ""}>
        </div>
        <div class="flex-grow-1">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
            <label class="black-text fz-14 mb-0 fw-medium" for="spg-opt-${section.id}">${escapeHtml(section.title)}</label>
            <span class="sm-ele fz-10 bordered-8 badge-reviewed py-1 px-2">ذكاء اصطناعي</span>
          </div>
          <p class="fz-12 text-gray mb-0">${escapeHtml(section.description)}</p>
        </div>`;
      optWrap.appendChild(row);
    });

    optWrap.querySelectorAll(".spg-optional-toggle").forEach((input) => {
      input.addEventListener("change", () => {
        p.optionalSections[input.dataset.sectionId] = input.checked;
        saveProjects();
        renderReview(p);
      });
    });
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

    $("#spgAddDocumentBtn")?.addEventListener("click", () => {
      const p = getActiveProject();
      if (!p) return;
      p.documents.push({ id: entryId(), name: "", description: "", fileName: "" });
      saveProjects();
      renderDocumentsList(p);
    });

    $("#spgAddTeamBtn")?.addEventListener("click", () => {
      const p = getActiveProject();
      if (!p) return;
      p.team.push(emptyTeamMember());
      saveProjects();
      renderTeamList(p);
    });

    $("#spgAddContractBtn")?.addEventListener("click", () => {
      const p = getActiveProject();
      if (!p) return;
      p.contracts.push(emptyContract());
      saveProjects();
      renderContractsList(p);
    });

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

    $("#spgReviewConfirm")?.addEventListener("click", () => {
      persistActiveFromForm();
      const note = $("#spgReviewConfirmNote");
      if (note) {
        note.textContent =
          "تم حفظ اختيارات الأقسام. المرحلة التالية من توليد المحتوى ستتوفر قريبًا.";
        note.classList.remove("d-none");
      }
    });
  }

  function init() {
    if (!$(".spg-root")) return;

    loadProjects();
    if (projects.length && !activeProjectId) {
      activeProjectId = projects[0].id;
      const p = getActiveProject();
      wizardStep = normalizeWizardStep(p?.wizardStep);
      if (p) p.wizardStep = wizardStep;
      view = p?.view || "landing";
    }

    bindEvents();
    renderProjectList();
    setView(view);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
