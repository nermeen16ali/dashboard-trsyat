document.addEventListener("DOMContentLoaded", () => {
  // Fav-btn Flying Heart Animation
  const heartSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none"><path d="M9.07976 13.8733C8.85309 13.9533 8.47976 13.9533 8.25309 13.8733C6.31976 13.2133 1.99976 10.46 1.99976 5.79332C1.99976 3.73332 3.65976 2.06665 5.70642 2.06665C6.91976 2.06665 7.99309 2.65332 8.66642 3.55998C9.33976 2.65332 10.4198 2.06665 11.6264 2.06665C13.6731 2.06665 15.3331 3.73332 15.3331 5.79332C15.3331 10.46 11.0131 13.2133 9.07976 13.8733Z" stroke="#da1e1e" stroke-width="1.5" fill="#da1e1e" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function flyHeart(btn) {
    const isLTR = document.documentElement.dir === 'ltr' || document.body.classList.contains('ltr');
    let targetLink = isLTR
      ? document.querySelector('a[href="tenders-management-ltr.html"].nav-link')
      : document.querySelector('a[href="tenders-management.html"].nav-link');

    const moreBtn = document.getElementById("moreMenuBtn");

    // If target link is hidden or not found, fly to the "More" button
    if (!targetLink || targetLink.offsetParent === null) {
      targetLink = moreBtn;
    }

    if (!targetLink || targetLink.offsetParent === null) return;

    const btnRect = btn.getBoundingClientRect();
    const targetRect = targetLink.getBoundingClientRect();

    const startX = btnRect.left + btnRect.width / 2 - 11;
    const startY = btnRect.top + btnRect.height / 2 - 11;

    const endX = targetRect.left + targetRect.width / 2 - 11;
    const endY = targetRect.top + targetRect.height / 2 - 11;

    const heart = document.createElement('div');
    heart.className = 'flying-heart';
    heart.innerHTML = heartSVG;
    heart.style.left = startX + 'px';
    heart.style.top = startY + 'px';
    document.body.appendChild(heart);

    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const duration = Math.max(0.6, Math.min(1, dist / 800)); // Slightly faster straight flight

    heart.animate(
      [
        { left: startX + 'px', top: startY + 'px', opacity: 1, transform: 'scale(1.5)' },
        { left: endX + 'px', top: endY + 'px', opacity: 0, transform: 'scale(0.4)' }
      ],
      {
        duration: duration * 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      }
    ).onfinish = function () {
      targetLink.classList.remove('fav-target-pulse');
      void targetLink.offsetWidth;
      targetLink.classList.add('fav-target-pulse');
      setTimeout(() => targetLink.classList.remove('fav-target-pulse'), 700);

      if (heart.parentNode) heart.parentNode.removeChild(heart);
    };
  }

  // Delegate click for favorite buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".fav-btn");
    if (!btn) return;

    const svg = btn.querySelector("svg path");
    const wasFavorited = btn.classList.contains("is-favorited");
    btn.classList.toggle("is-favorited");
    btn.classList.toggle("active");

    if (!wasFavorited) {
      if (svg) {
        svg.setAttribute("fill", "#ef4444");
        svg.setAttribute("stroke", "#ef4444");
      }
      flyHeart(btn);
    } else {
      if (svg) {
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "#292D32");
      }
    }
  });
  document.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    const isMobile = window.innerWidth < 992;

    if (window.scrollY > 64) {
      navbar.style.padding = "12px 12px 10px";
    } else {
      // Use 16px for mobile, 24px for desktop
      navbar.style.padding = isMobile ? "16px 12px 10px" : "24px 12px 10px";
    }
  });

  function syncPageTabsScrollTrack(container) {
    if (!container) return;

    const isMobile = window.innerWidth < 992;
    let track = container.querySelector(":scope > .page-tabs-track");

    if (isMobile) {
      if (!track) {
        track = document.createElement("div");
        track.className = "page-tabs-track";
        while (container.firstChild) {
          track.appendChild(container.firstChild);
        }
        container.appendChild(track);
      }
    } else if (track) {
      while (track.firstChild) {
        container.insertBefore(track.firstChild, track);
      }
      track.remove();
    }
  }

  function positionPageTabsMainMenu(toggle, menu) {
    const rect = toggle.getBoundingClientRect();
    const isRtl =
      document.documentElement.dir === "rtl" ||
      document.body.classList.contains("rtl");

    menu.style.top = `${rect.bottom + 8}px`;
    menu.style.minWidth = `${Math.max(rect.width, 200)}px`;

    if (isRtl) {
      menu.style.left = "auto";
      menu.style.right = `${window.innerWidth - rect.right}px`;
    } else {
      menu.style.right = "auto";
      menu.style.left = `${rect.left}px`;
    }
  }

  function restorePageTabsPortaledMenu(menu) {
    if (!menu?._portalDropdown) return;
    menu.classList.remove("page-tabs-portal");
    menu.style.position = "";
    menu.style.top = "";
    menu.style.left = "";
    menu.style.right = "";
    menu.style.minWidth = "";
    menu.style.zIndex = "";
    menu._portalDropdown.appendChild(menu);
    delete menu._portalDropdown;
  }

  function setupPageTabsDropdownPortal(container) {
    if (!container || container.dataset.pageTabsPortalBound === "1") return;
    container.dataset.pageTabsPortalBound = "1";

    container.addEventListener("show.bs.dropdown", (event) => {
      if (window.innerWidth >= 992) return;

      const toggle = event.target.closest('[data-bs-toggle="dropdown"]');
      if (!toggle || toggle.id === "moreMenuBtn") return;

      const dropdown = toggle.closest(".dropdown");
      const menu = dropdown?.querySelector(".dropdown-menu.main-menu");
      if (!menu || menu.classList.contains("page-tabs-portal")) return;

      menu._portalDropdown = dropdown;
      menu.classList.add("page-tabs-portal");
      document.body.appendChild(menu);
    });

    container.addEventListener("shown.bs.dropdown", (event) => {
      if (window.innerWidth >= 992) return;
      const toggle = event.target.closest('[data-bs-toggle="dropdown"]');
      if (!toggle || toggle.id === "moreMenuBtn") return;
      const menu = document.querySelector(".dropdown-menu.main-menu.page-tabs-portal");
      if (menu) {
        positionPageTabsMainMenu(toggle, menu);
      }
    });

    container.addEventListener("hide.bs.dropdown", (event) => {
      const toggle = event.target.closest('[data-bs-toggle="dropdown"]');
      if (!toggle || toggle.id === "moreMenuBtn") return;
      const menu = document.querySelector(".dropdown-menu.main-menu.page-tabs-portal");
      if (menu) restorePageTabsPortaledMenu(menu);
    });
  }

  function scrollActivePageTabIntoView(container) {
    if (window.innerWidth >= 992 || !container) return;

    const activeLink = container.querySelector("a.nav-link.active:not(.more-btn)");
    let target = activeLink;
    if (activeLink) {
      const parentDropdown = activeLink.closest(".dropdown");
      const moreDropdown = container.querySelector(".dropdown:last-of-type");
      if (parentDropdown && parentDropdown !== moreDropdown) {
        target = parentDropdown;
      }
    } else {
      const activeInMenu = container.querySelector(
        ".dropdown:not(:last-of-type) .nav-link.active"
      );
      target = activeInMenu?.closest(".dropdown") || null;
    }
    if (!target) return;

    requestAnimationFrame(() => {
      target.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "auto",
      });
    });
  }

  function initPageTabsDropdownsStatic() {
    if (window.innerWidth >= 992 || typeof bootstrap === "undefined") return;

    const container = document.getElementById("tabsContainer");
    if (!container) return;

    container
      .querySelectorAll('.dropdown-toggle[data-bs-toggle="dropdown"]')
      .forEach((toggle) => {
        if (toggle.id === "moreMenuBtn") return;
        bootstrap.Dropdown.getOrCreateInstance(toggle, { display: "static" });
      });
  }

  function handleTabOverflow() {
    const container = document.getElementById("tabsContainer");
    const moreBtn = document.getElementById("moreMenuBtn");
    const dropdownMenu = document.getElementById("moreMenu");

    if (!container || !moreBtn || !dropdownMenu) return;

    syncPageTabsScrollTrack(container);
    initPageTabsDropdownsStatic();

    const tabs = Array.from(
      container.getElementsByClassName("nav-link")
    ).filter((tab) => !tab.classList.contains("more-btn"));

    let containerWidth = container.clientWidth;
    let totalWidth = moreBtn.offsetWidth;
    let hiddenTabs = [];

    dropdownMenu.innerHTML = "";
    moreBtn.style.display = "none";

    // Breakpoints
    const isMobile = window.innerWidth < 992;
    const isSmallScreen = window.innerWidth < 1360;

    if (isMobile) {
      tabs.forEach((tab) => {
        const wrapper = tab.closest(".dropdown") || tab;
        wrapper.style.display = "";
        tab.style.display = "inline-flex";
      });
      scrollActivePageTabIntoView(container);
    } else if (isSmallScreen) {
      // Tablet/Small Desktop: wrap overflowing tabs
      tabs.forEach((tab) => {
        const wrapper = tab.closest('.dropdown') || tab;
        wrapper.style.display = ""; // Reset to CSS default
        tab.style.display = "inline-flex";
      });

      for (let tab of tabs) {
        totalWidth += tab.offsetWidth + 16;
        if (totalWidth > containerWidth) {
          const wrapper = tab.closest('.dropdown') || tab;
          wrapper.style.display = "none";
          tab.style.display = "none";
          hiddenTabs.push(tab);
        }
      }
    } else {
      // Desktop: leave them to show all
      tabs.forEach((tab) => {
        const wrapper = tab.closest('.dropdown') || tab;
        wrapper.style.display = ""; // Reset to CSS default
        tab.style.display = "inline-flex";
      });
    }

    // التعامل مع القائمة المنسدلة (Dropdown)
    if (hiddenTabs.length > 0) {
      moreBtn.style.display = "inline-flex";
      hiddenTabs.forEach((tab) => {
        // Check if the tab is a dropdown container
        const parentDropdown = tab.closest('.dropdown');

        if (parentDropdown) {
          // Clone the entire dropdown structure
          const clonedDropdown = parentDropdown.cloneNode(true);
          clonedDropdown.style.display = ""; // Reset since original is display:none
          const clonedButton = clonedDropdown.querySelector('button, a');

          // Convert to dropdown-item style for the More menu
          if (clonedButton) {
            clonedButton.classList.remove('nav-link', 'w-100');
            clonedButton.classList.add('dropdown-item', 'dropdown-toggle');
            clonedButton.style.display = 'flex';
          }

          dropdownMenu.appendChild(clonedDropdown);
        } else {
          // Regular link - create simple dropdown item
          let dropdownItem = document.createElement("a");
          dropdownItem.className = "dropdown-item";
          dropdownItem.innerHTML = tab.innerHTML;
          dropdownItem.href = tab.href;
          dropdownMenu.appendChild(dropdownItem);
        }
      });

      moreBtn.onclick = function () {
        dropdownMenu.classList.toggle("show");
      };

      document.addEventListener('click', function (event) {
        if (!moreBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
          dropdownMenu.classList.remove('show');
        }
      });
    }

    container.classList.add("initialized");
  }

  // Ensure it runs on load and resize
  window.addEventListener("resize", handleTabOverflow);
  window.addEventListener("load", handleTabOverflow);

  // Initial call to prevent layout glitch
  handleTabOverflow();
  setupPageTabsDropdownPortal(document.getElementById("tabsContainer"));

  // Close navbar when clicking on backdrop (shadow area)
  document.addEventListener("click", (e) => {
    const navbarCollapse = document.querySelector(".navbar-collapse.show");

    // Check if navbar is open and click is on the pseudo-element backdrop
    // Since the backdrop is inside the navbar-collapse (as ::before), 
    // we check if the click target is exactly the navbar-collapse itself
    // and not any of its children.
    if (navbarCollapse && e.target === navbarCollapse) {
      const toggle = document.querySelector(`[data-bs-target="#${navbarCollapse.id}"]`);
      if (toggle) {
        // Bootstrap 5 collapse toggle
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) {
          bsCollapse.hide();
        } else {
          toggle.click();
        }
      }
    }
  });

  // Initialize Bootstrap tooltips globally
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {
    trigger: 'hover',
    animation: false,
    delay: { show: 0, hide: 0 }
  }));
});

// Custom Activity Multiselect Logic
const activityDropdown = document.getElementById("activityDropdown");
if (activityDropdown) {
  const availableList = document.getElementById("availableActivitiesList");
  const selectedContainer = document.getElementById("selectedActivitiesContainer");
  const searchInput = document.getElementById("activitySearch");
  const saveBtn = document.getElementById("saveActivitiesBtn");
  const trigger = document.getElementById("activityTrigger");
  const selectedCountBadge = trigger.querySelector(".selected-count");
  const customplaceholder = trigger.querySelector(".customplaceholder");

  // Sample Data
  const activities = [
    "التصميم الداخلي والتجهيزات", "تجهيز المكاتب وأثاثها", "أعمال النجارة",
    "أعمال السباكة", "أعمال الكهرباء", "أعمال تكييف الهواء", "أعمال الدهانات"
  ];

  let selectedActivities = new Set();

  function renderAvailable() {
    availableList.innerHTML = "";
    const filter = searchInput.value.trim();

    activities.forEach(activity => {
      if (selectedActivities.has(activity)) return;
      if (filter && !activity.includes(filter)) return;

      const item = document.createElement("div");
      item.className = "available-item";
      item.innerHTML = `
          <span>${activity}</span>
          <div class="add-btn">+</div>
        `;

      item.querySelector(".add-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        selectedActivities.add(activity);
        renderAll();
      });

      availableList.appendChild(item);
    });
  }

  function renderSelected() {
    selectedContainer.innerHTML = "";
    selectedActivities.forEach(activity => {
      const tag = document.createElement("div");
      tag.className = "selected-tag";
      tag.innerHTML = `
          <span>${activity}</span>
          <span class="remove-btn">✕</span>
        `;

      tag.querySelector(".remove-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        selectedActivities.delete(activity);
        renderAll();
      });

      selectedContainer.appendChild(tag);
    });
  }

  function updateTrigger() {
    const count = selectedActivities.size;
    if (count > 0) {
      // Clear placeholder and count badge
      selectedCountBadge.classList.add("d-none");
      customplaceholder.innerHTML = "";
      customplaceholder.classList.remove("customplaceholder"); // Optional: remove placeholder style

      // Render tags into the trigger
      selectedActivities.forEach(activity => {
        const tag = document.createElement("div");
        tag.className = "selected-tag trigger-tag";
        tag.innerHTML = `
          <span>${activity}</span>
          <span class="remove-btn">✕</span>
        `;

        tag.querySelector(".remove-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          selectedActivities.delete(activity);
          renderAll();
          updateTrigger();
        });

        customplaceholder.appendChild(tag);
      });
    } else {
      selectedCountBadge.classList.add("d-none");
      customplaceholder.innerHTML = "اختر النشاط الأساسي";
      customplaceholder.classList.add("customplaceholder");
    }
  }

  function renderAll() {
    renderAvailable();
    renderSelected();
  }

  // Toggle Dropdown
  trigger.addEventListener("click", () => {
    activityDropdown.classList.toggle("d-none");
  });

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (!trigger.contains(e.target) && !activityDropdown.contains(e.target)) {
      activityDropdown.classList.add("d-none");
    }
  });

  // Save Button Logic
  saveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    updateTrigger();
    activityDropdown.classList.add("d-none");
  });

  // Stop propagation inside dropdown to prevent closing
  activityDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Initial Render
  renderAll();

  // Search Listener
  searchInput.addEventListener("input", renderAvailable);
}

// Support Chat Modal for Mobile
function initChatModal() {
  const chatsIcon = document.querySelector('.chats-icon');
  const supportChats = document.querySelector('.support-chats');

  if (!chatsIcon || !supportChats) return;

  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'chat-modal-overlay';
  modalOverlay.style.display = 'none';

  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.className = 'chat-modal-container';

  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'chat-modal-header';

  // Get the title from the existing sidebar header
  const existingTitle = document.querySelector('.sidebar-header h6');
  const titleHTML = existingTitle ? existingTitle.innerHTML : 'Support <span>Chats</span>';

  modalHeader.innerHTML = `
    <h6 class="black-text">${titleHTML}</h6>
    <button class="chat-modal-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M1.16667 11.6667L0 10.5L4.66667 5.83333L0 1.16667L1.16667 0L5.83333 4.66667L10.5 0L11.6667 1.16667L7 5.83333L11.6667 10.5L10.5 11.6667L5.83333 7L1.16667 11.6667Z" fill="black"/>
</svg>
    </button>
  `;

  // Clone support chats content
  const chatsContent = supportChats.cloneNode(true);
  chatsContent.classList.add('modal-chats-content');

  // Assemble modal
  modalContainer.appendChild(modalHeader);
  modalContainer.appendChild(chatsContent);
  modalOverlay.appendChild(modalContainer);
  document.body.appendChild(modalOverlay);

  // Open modal
  function openModal() {
    if (window.innerWidth < 992) {
      // Update modal content with current state
      const currentChats = document.querySelector('.support-chats');
      const modalChats = modalOverlay.querySelector('.modal-chats-content');
      modalChats.innerHTML = currentChats.innerHTML;

      modalOverlay.style.display = 'flex';
      // Trigger reflow to ensure transition works
      modalOverlay.offsetHeight;
      modalOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  // Close modal
  function closeModal() {
    const modalContainer = modalOverlay.querySelector('.chat-modal-container');

    modalOverlay.classList.remove('show');
    // Add slide-down animation
    modalContainer.style.animation = 'slideDown 0.3s ease-in';

    // Wait for animation to complete before hiding
    setTimeout(() => {
      modalOverlay.style.display = 'none';
      document.body.style.overflow = '';
      // Reset animation for next open
      modalContainer.style.animation = '';
    }, 300);
  }

  // Event listeners
  chatsIcon.addEventListener('click', openModal);

  const closeBtn = modalOverlay.querySelector('.chat-modal-close');
  closeBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Close on window resize if screen becomes larger
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) {
      closeModal();
    }
  });
}

// Initialize chat modal when DOM is ready
if (document.querySelector('.chats-icon')) {
  initChatModal();
}

// Filter Sidebar Modal for Mobile
function initFilterModal() {
  const sortIcon = document.querySelector('.sort-icon');
  const filterSidebar = document.querySelector('.filter-sidebar');

  if (!sortIcon || !filterSidebar) return;

  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'filter-modal-overlay';
  modalOverlay.style.display = 'none';

  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.className = 'filter-modal-container';

  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'filter-modal-header';

  // Get the title from h6 (handle Arabic/English)
  const existingTitle = filterSidebar.querySelector('.filter-header h6');
  const title = existingTitle ? existingTitle.innerText : 'Filter and Search';

  modalHeader.innerHTML = `
    <div class="d-flex align-items-center gap-10">
      <img src="images/sort.svg" alt="Sort">
      <h6 class="black-text mb-0">${title}</h6>
    </div>
    <button class="filter-modal-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1.16667 11.6667L0 10.5L4.66667 5.83333L0 1.16667L1.16667 0L5.83333 4.66667L10.5 0L11.6667 1.16667L7 5.83333L11.6667 10.5L10.5 11.6667L5.83333 7L1.16667 11.6667Z" fill="black"/>
      </svg>
    </button>
  `;

  // Content container
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-filter-content';

  // Assemble modal
  modalContainer.appendChild(modalHeader);
  modalContainer.appendChild(modalContent);
  modalOverlay.appendChild(modalContainer);
  document.body.appendChild(modalOverlay);

  // Open modal
  function openModal() {
    if (window.innerWidth < 992) {
      // Clone all children of filter-sidebar except filter-header and search-wrapper
      // We use innerHTML clone to match the support chat implementation style
      const children = Array.from(filterSidebar.children);
      modalContent.innerHTML = '';
      children.forEach(child => {
        if (!child.classList.contains('filter-header') && !child.classList.contains('search-wrapper')) {
          const clone = child.cloneNode(true);
          modalContent.appendChild(clone);
        }
      });

      modalOverlay.style.display = 'flex';
      modalOverlay.offsetHeight;
      modalOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';

      // Re-initialize Flatpickr on cloned inputs in the modal
      const modalInputs = modalContent.querySelectorAll('.flatpickr-input');
      const isLTR = document.documentElement.dir === 'ltr' || document.body.classList.contains('ltr');

      modalInputs.forEach(input => {
        // Remove existing flatpickr instance if any (cloned might have remnants)
        if (input._flatpickr) {
          input._flatpickr.destroy();
        }

        flatpickr(input, {
          dateFormat: "Y-m-d",
          locale: isLTR ? "en" : "ar",
          disableMobile: true
          // Ensure the calendar is appended to the modal or body and has high z-index
        });
      });
    }
  }

  // Close modal
  function closeModal() {
    if (!modalOverlay.classList.contains('show')) return;

    modalOverlay.classList.remove('show');
    modalContainer.style.animation = 'slideDown 0.3s ease-in';

    setTimeout(() => {
      modalOverlay.style.display = 'none';
      document.body.style.overflow = '';
      modalContainer.style.animation = '';
    }, 300);
  }

  // Event listeners
  sortIcon.addEventListener('click', openModal);
  const closeBtn = modalOverlay.querySelector('.filter-modal-close');
  closeBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) {
      closeModal();
    }
  });
}

// Initialize filter modal when DOM is ready
if (document.querySelector('.sort-icon')) {
  initFilterModal();
}




// Video Guide Popup Logic
document.addEventListener("click", (e) => {
  const videoBtn = e.target.closest("button.outline-primary-gray.bordered-40");
  if (!videoBtn) return;

  e.preventDefault();

  // Create Modal
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "video-popup-overlay";

  const modalContainer = document.createElement("div");
  modalContainer.className = "video-popup-container";

  const closeBtn = document.createElement("button");
  closeBtn.className = "video-popup-close";
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  const videoWrapper = document.createElement("div");
  videoWrapper.className = "video-popup-wrapper";
  videoWrapper.innerHTML = `
    <iframe src="https://www.youtube.com/embed/1RfFNjc-9Yk?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  `;

  modalContainer.appendChild(closeBtn);
  modalContainer.appendChild(videoWrapper);
  modalOverlay.appendChild(modalContainer);
  document.body.appendChild(modalOverlay);

  // Prevent scrolling
  document.body.style.overflow = "hidden";

  // Close Logic
  const closePopup = () => {
    modalOverlay.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(modalOverlay);
      document.body.style.overflow = "";
    }, 300);
  };

  closeBtn.addEventListener("click", closePopup);
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) closePopup();
  });

  // Trigger animation
  setTimeout(() => modalOverlay.classList.add("show"), 10);
});

// Bank transfer field copy + toast feedback
(function initBankCopyButtons() {
  let toastEl = null;
  let toastTimer = null;

  function getToast() {
    if (toastEl) return toastEl;
    toastEl = document.createElement("div");
    toastEl.className = "bank-copy-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(toastEl);
    return toastEl;
  }

  function showCopiedToast(message) {
    const toast = getToast();
    const isRtl = document.documentElement.getAttribute("dir") === "rtl";
    const fallback = isRtl ? "تم النسخ" : "Copied";
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${message || fallback}</span>
    `;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "");
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".bank-copy-btn");
    if (!btn) return;

    const row = btn.closest(".bank-detail-value-row");
    const input = row ? row.querySelector(".bank-detail-input, input") : null;
    const text = (input ? input.value : btn.getAttribute("data-copy") || "").trim();
    if (!text) return;

    try {
      await copyText(text);
      document.querySelectorAll(".bank-copy-btn.is-copied").forEach((el) => el.classList.remove("is-copied"));
      btn.classList.add("is-copied");
      showCopiedToast(btn.getAttribute("data-copied-msg"));
      setTimeout(() => btn.classList.remove("is-copied"), 2000);
    } catch (err) {
      const isRtl = document.documentElement.getAttribute("dir") === "rtl";
      showCopiedToast(isRtl ? "تعذر النسخ" : "Could not copy");
    }
  });
})();

