/**
 * Unified Filtering Logic for Dashboard Trsyat
 * Handles both DataTables and Card Grids
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Handle DataTable Search and Filter Buttons (Requires jQuery)
    if (typeof jQuery !== 'undefined') {
        initDataTableFilters();
    }

    // 2. Handle Card Grid Search and Filters (Vanilla JS)
    initCardGridFilters();
});

function initDataTableFilters() {
    // Safety check just in case
    if (typeof jQuery === 'undefined') return;

    // Use an interval or check for DataTables initialization
    const checkDataTable = setInterval(() => {
        if (typeof $.fn.DataTable !== 'undefined') {
            const tables = $(".competition-table").DataTable();
            if (tables) {
                clearInterval(checkDataTable);
                setupDataTableEvents(tables);
            }
        }
    }, 100);

    // Stop checking after 5 seconds to avoid infinite loop
    setTimeout(() => clearInterval(checkDataTable), 5000);
}

function setupDataTableEvents(table) {
    // Search input
    $(".table-search").on("keyup", function () {
        table.search(this.value).draw();
    });

    // Status Filter Buttons (e.g., "الكل", "تم قبولها", etc.)
    $(".filter-btns button").on("click", function () {
        const $btn = $(this);
        const filterValue = $btn.text().trim();

        // Update active state
        $btn.siblings().removeClass("active");
        $btn.addClass("active");

        if (filterValue === "الكل" || filterValue === "All") {
            table.column(5).search("").draw();
        } else {
            table.column(5).search('^' + filterValue + '$', true, false).draw();
        }
    });
}

function initCardGridFilters() {
    const searchInputs = document.querySelectorAll('input[placeholder*="البحث في المسابقات"], input[placeholder*="Search in auctions"], input[placeholder*="Search in Tenders"]');

    searchInputs.forEach(input => {
        input.addEventListener("input", function () {
            const searchTerm = this.value.toLowerCase().trim();
            const tabPane = this.closest(".tab-pane") || document.querySelector(".tab-content") || document.body;

            const cards = tabPane.querySelectorAll(".tender-card, .col-md-6.col-xxl-4");

            cards.forEach(card => {
                const title = card.querySelector(".tender-title")?.innerText.toLowerCase() || "";
                const number = card.querySelector(".tender-number")?.innerText.toLowerCase() || "";

                if (title.includes(searchTerm) || number.includes(searchTerm)) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    // Handle Filter Modal "Apply" button logic 
    const applyFilterBtn = document.querySelector("#filterModal .btn-primary");
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener("click", () => {
            console.log("Filtering applied from modal");

            // Defensive bootstrap check
            if (typeof bootstrap !== 'undefined') {
                const modalElement = document.getElementById('filterModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
        });
    }

    // Handle Filter Modal "Reset" button
    const resetFilterBtn = document.querySelector("#filterModal .btn-primary-outline");
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener("click", () => {
            const modalBody = document.querySelector("#filterModal .modal-body");
            if (!modalBody) return;

            const selects = modalBody.querySelectorAll("select");
            selects.forEach(select => {
                if (select.multiple) {
                    if (select.choices) {
                        select.choices.removeActiveItems();
                    } else {
                        Array.from(select.options).forEach(opt => opt.selected = false);
                    }
                } else {
                    select.selectedIndex = 0;
                }
            });
            console.log("Filters reset");
        });
    }
}
