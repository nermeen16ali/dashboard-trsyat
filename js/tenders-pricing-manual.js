document.addEventListener("DOMContentLoaded", () => {
  const formCard = document.getElementById("tpManualItemFormCard");
  const tableBody = document.getElementById("tpManualItemsTableBody");
  const countEl = document.getElementById("tpManualItemsCount");

  if (!formCard || !tableBody) {
    return;
  }

  const fields = {
    num: document.getElementById("tpManualNum"),
    name: document.getElementById("tpManualName"),
    unit: document.getElementById("tpManualUnit"),
    qty: document.getElementById("tpManualQty"),
    desc: document.getElementById("tpManualDesc"),
  };

  const primaryActions = document.getElementById("tpManualFormPrimaryActions");
  const editActions = document.getElementById("tpManualEditActions");
  const editSaveBtn = document.getElementById("tpManualEditSave");
  const editCancelBtn = document.getElementById("tpManualEditCancel");

  let editingRow = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cellText(td) {
    if (!td) {
      return "";
    }
    const span = td.querySelector("span");
    return (span || td).textContent.replace(/\s+/g, " ").trim();
  }

  function readRowIntoFields(tr) {
    const cells = tr?.querySelectorAll("td");
    if (!cells || cells.length < 5) {
      return;
    }

    if (fields.num) {
      fields.num.value = cellText(cells[0]);
    }
    if (fields.name) {
      fields.name.value = cellText(cells[1]);
    }
    if (fields.desc) {
      fields.desc.value = cellText(cells[2]);
    }
    if (fields.unit) {
      fields.unit.value = cellText(cells[3]);
    }
    if (fields.qty) {
      fields.qty.value = cellText(cells[4]);
    }
  }

  function readFieldsFromForm() {
    return {
      num: fields.num?.value.trim() ?? "",
      name: fields.name?.value.trim() ?? "",
      desc: fields.desc?.value.trim() ?? "",
      unit: fields.unit?.value.trim() ?? "",
      qty: fields.qty?.value.trim() ?? "",
    };
  }

  function writeRowFromFields(tr, data) {
    const cells = tr.querySelectorAll("td");
    if (cells.length < 5) {
      return;
    }

    cells[0].innerHTML = `<span class="ff-onest fw-medium black-text">${escapeHtml(data.num)}</span>`;
    cells[1].innerHTML = `<span class="black-text fw-medium">${escapeHtml(data.name)}</span>`;
    cells[2].innerHTML = `<span class="text-gray fz-12 ellipse-text">${escapeHtml(data.desc)}</span>`;
    cells[3].textContent = data.unit;
    cells[4].innerHTML = `<span class="ff-onest fw-medium black-text">${escapeHtml(data.qty)}</span>`;
  }

  function clearFormFields() {
    Object.values(fields).forEach((el) => {
      if (el) {
        el.value = "";
      }
    });
  }

  function updateItemsCount() {
    if (!countEl) {
      return;
    }
    countEl.textContent = String(tableBody.querySelectorAll("tr").length);
  }

  function scrollFormIntoView(focusEl) {
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

      if (!target || typeof target.focus !== "function") {
        return;
      }

      try {
        target.focus({ preventScroll: true });
      } catch (_err) {
        target.focus();
      }
    });
  }

  function setEditingRow(tr) {
    tableBody.querySelectorAll("tr").forEach((row) => {
      row.classList.toggle("tp-manual-item-row-editing", row === tr);
    });
  }

  function updateEditUI() {
    const isEditing = Boolean(editingRow);

    primaryActions?.classList.toggle("d-none", isEditing);
    primaryActions?.classList.toggle("d-flex", !isEditing);
    if (primaryActions && !isEditing) {
      primaryActions.classList.add("justify-content-end");
    }

    editActions?.classList.toggle("d-none", !isEditing);
    editActions?.classList.toggle("d-flex", isEditing);

    formCard.classList.toggle("spg-collection-form-editing", isEditing);
  }

  function resetManualItemForm(clearEditing = true) {
    if (clearEditing) {
      editingRow = null;
      setEditingRow(null);
    }
    clearFormFields();
    updateEditUI();
  }

  function startEditFromRow(tr) {
    editingRow = tr;
    readRowIntoFields(tr);
    setEditingRow(tr);
    updateEditUI();
    scrollFormIntoView(fields.num);
  }

  function saveManualItemEdit() {
    if (!editingRow) {
      return;
    }

    const data = readFieldsFromForm();
    if (!data.name) {
      fields.name?.classList.add("is-invalid");
      fields.name?.focus();
      return;
    }

    fields.name?.classList.remove("is-invalid");
    writeRowFromFields(editingRow, data);
    resetManualItemForm(true);
  }

  if (!tableBody.dataset.tpManualActionsBound) {
    tableBody.dataset.tpManualActionsBound = "1";

    tableBody.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".tp-manual-item-edit");
      if (!editBtn) {
        return;
      }

      const tr = editBtn.closest("tr");
      if (tr) {
        startEditFromRow(tr);
      }
    });
  }

  editSaveBtn?.addEventListener("click", saveManualItemEdit);
  editCancelBtn?.addEventListener("click", () => resetManualItemForm(true));

  updateItemsCount();
  updateEditUI();
});
