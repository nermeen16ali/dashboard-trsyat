document.addEventListener("DOMContentLoaded", () => {
  const favoriteButtons = document.querySelectorAll(".fav-btn");

  favoriteButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const svg = this.querySelector("svg path");
      const isActive = this.classList.toggle("active");

      if (isActive) {
        // Heart filled (active state)
        svg.setAttribute("fill", "#ef4444");
        svg.setAttribute("stroke", "#ef4444");
      } else {
        // Heart outline (default state)
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "#292D32");
      }
    });
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

  function handleTabOverflow() {
    const container = document.getElementById("tabsContainer");
    const moreBtn = document.getElementById("moreMenuBtn");
    const dropdownMenu = document.getElementById("moreMenu");

    if (!container || !moreBtn || !dropdownMenu) return;

    const tabs = Array.from(
      container.getElementsByClassName("nav-link")
    ).filter((tab) => !tab.classList.contains("more-btn"));

    let containerWidth = container.clientWidth;
    let totalWidth = moreBtn.offsetWidth;
    let hiddenTabs = [];

    dropdownMenu.innerHTML = "";
    tabs.forEach((tab) => (tab.style.display = "inline-flex"));
    moreBtn.style.display = "none";

    // نستخدم 1200px لضمان تفعيل الالتفاف على التابلت واللابتوب الصغير
    const isSmallScreen = window.innerWidth < 1360;

    if (isSmallScreen) {
      // نطبق منطق الالتفاف (إخفاء ما لا يكفي في المساحة) فقط في الشاشات الصغيرة
      for (let tab of tabs) {
        totalWidth += tab.offsetWidth + 16;
        if (totalWidth > containerWidth) {
          tab.style.display = "none";
          hiddenTabs.push(tab);
        }
      }
    } else {
      // في شاشات الكمبيوتر الكبيرة (Desktop): نتركها فارغة لتظهر جميع العناصر دائماً
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

    // Mark as initialized to show the tabs
    container.classList.add("initialized");
  }

  // function handleTabOverflow() {
  //   const container = document.getElementById("tabsContainer"); // Tabs container
  //   const moreBtn = document.getElementById("moreMenuBtn"); // "..." button
  //   const dropdownMenu = document.getElementById("moreMenu"); // Dropdown menu

  //   if (!container || !moreBtn || !dropdownMenu) return;

  //   const tabs = Array.from(
  //     container.getElementsByClassName("nav-link")
  //   ).filter((tab) => !tab.classList.contains("more-btn"));

  //   let containerWidth = container.clientWidth; // Available width
  //   let totalWidth = moreBtn.offsetWidth; // Start with `...` button width
  //   let hiddenTabs = [];

  //   dropdownMenu.innerHTML = ""; // Clear previous dropdown items
  //   tabs.forEach((tab) => (tab.style.display = "inline-flex")); // Reset all tabs
  //   moreBtn.style.display = "none";

  //   const isSmallScreen = window.innerWidth < 992; // Adjust breakpoint as needed

  //   if (isSmallScreen) {
  //     // Mobile/Tablet: Show only active tab, others in dropdown
  //     tabs.forEach(tab => {
  //       if (tab.classList.contains("active")) {
  //         tab.style.display = "inline-flex";
  //       } else {
  //         tab.style.display = "none";
  //         hiddenTabs.push(tab);
  //       }
  //     });
  //   } else {
  //     for (let tab of tabs) {
  //       totalWidth += tab.offsetWidth + 16;
  //       if (totalWidth > containerWidth) {
  //         tab.style.display = "none";
  //         hiddenTabs.push(tab);
  //       }
  //     }
  //   }

  //   // Handle dropdown menu
  //   if (hiddenTabs.length > 0) {
  //     moreBtn.style.display = "inline-flex"; // Show `...` button
  //     hiddenTabs.forEach((tab) => {
  //       let dropdownItem = document.createElement("a");
  //       dropdownItem.className = "dropdown-item";
  //       dropdownItem.innerHTML = tab.innerHTML;
  //       dropdownItem.href = tab.href;
  //       dropdownMenu.appendChild(dropdownItem);
  //     });

  //     // Ensure click listener is attached to the button
  //     moreBtn.onclick = function () {
  //       dropdownMenu.classList.toggle("show");
  //     };

  //     // Close dropdown when clicking outside
  //     document.addEventListener('click', function (event) {
  //       if (!moreBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
  //         dropdownMenu.classList.remove('show');
  //       }
  //     });

  //   }
  // }

  // Ensure it runs on load and resize
  window.addEventListener("resize", handleTabOverflow);
  window.addEventListener("load", handleTabOverflow);

  // Initial call to prevent layout glitch
  handleTabOverflow();

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




// Video Explanation Popup Logic
document.addEventListener("click", (e) => {
  const videoBtn = e.target.closest(".outline-primary-gray.bordered-40");
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
