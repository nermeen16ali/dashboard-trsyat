/**
 * Mobile collapsible history sidebar (tender results / pricing).
 */
(function () {
  function initFlowHistorySidebars() {
    const mobileQuery = window.matchMedia("(max-width: 767.98px)");

    document.querySelectorAll("[data-flow-history-sidebar]").forEach((root) => {
      if (root.dataset.flowHistorySidebarBound === "1") return;
      root.dataset.flowHistorySidebarBound = "1";

      const dropdown = root.querySelector("[data-history-dropdown]");
      const openBtn = root.querySelector("[data-history-open]");
      const backdrop = root.querySelector("[data-history-backdrop]");
      const labelEl = root.querySelector("[data-history-label]");
      const list = root.querySelector("[data-history-list]");

      if (!dropdown || !openBtn) return;

      function syncLabel() {
        if (!labelEl || !list) return;
        const active =
          list.querySelector(".chat-item.active") ||
          list.querySelector(".chat-item[aria-current='true']");
        const title =
          active?.querySelector(".ticket-id")?.textContent?.trim() || "";
        if (title) labelEl.textContent = title;
      }

      function setOpen(open) {
        root.classList.toggle("spg-projects-drawer-open", open);
        openBtn.setAttribute("aria-expanded", open ? "true" : "false");
        dropdown.setAttribute("aria-hidden", open ? "false" : "true");
      }

      function close() {
        if (!mobileQuery.matches) return;
        setOpen(false);
        openBtn.focus();
      }

      function toggle(e) {
        if (!mobileQuery.matches) return;
        e?.stopPropagation();
        setOpen(!root.classList.contains("spg-projects-drawer-open"));
      }

      function handleViewport() {
        if (!mobileQuery.matches) {
          setOpen(false);
          dropdown.removeAttribute("aria-hidden");
        } else {
          dropdown.setAttribute("aria-hidden", "true");
          syncLabel();
        }
      }

      openBtn.addEventListener("click", toggle);
      backdrop?.addEventListener("click", close);

      list?.addEventListener("click", (e) => {
        if (!e.target.closest(".chat-item") || !mobileQuery.matches) return;
        syncLabel();
        close();
      });

      document.addEventListener("click", (e) => {
        if (
          !mobileQuery.matches ||
          !root.classList.contains("spg-projects-drawer-open")
        ) {
          return;
        }
        if (!e.target.closest("[data-history-panel], [data-history-open]")) {
          close();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
      });

      mobileQuery.addEventListener("change", handleViewport);
      handleViewport();
      syncLabel();
    });
  }

  document.addEventListener("DOMContentLoaded", initFlowHistorySidebars);
})();
