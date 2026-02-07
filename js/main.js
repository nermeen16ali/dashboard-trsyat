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
    if (window.scrollY > 64) {
      navbar.style.padding = "12px 12px 10px";
    } else {
      navbar.style.padding = "24px 12px 10px";
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
        let dropdownItem = document.createElement("a");
        dropdownItem.className = "dropdown-item";
        dropdownItem.innerHTML = tab.innerHTML;
        dropdownItem.href = tab.href;
        dropdownMenu.appendChild(dropdownItem);
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
      tag.className = "tag";
      tag.innerHTML = `
          <span>${activity}</span>
          <span class="remove-btn">&times;</span>
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
      selectedCountBadge.textContent = count;
      selectedCountBadge.classList.remove("d-none");
      customplaceholder.textContent = "تم اختيار " + count;
    } else {
      selectedCountBadge.classList.add("d-none");
      customplaceholder.textContent = "اختر النشاط الأساسي";
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
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18" stroke="#6F6F6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="#6F6F6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
      document.body.style.overflow = 'hidden';
    }
  }

  // Close modal
  function closeModal() {
    modalOverlay.style.display = 'none';
    document.body.style.overflow = '';
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

