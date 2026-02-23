/**
 * Unified Filtering Logic for Dashboard Trsyat
 * Handles both DataTables and Card Grids
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Handle DataTable Search and Filter Buttons
    initDataTableFilters();

    // 2. Handle Card Grid Search and Filters
    initCardGridFilters();
});

function initDataTableFilters() {
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
}

function setupDataTableEvents(table) {
    // Search input (already covered in dataTable.js, but ensuring it works with potential multiple inputs)
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
            table.column(5).search("").draw(); // Column 5 is usually the Status column in our tables
        } else {
            // Use exact match regex for status
            table.column(5).search('^' + filterValue + '$', true, false).draw();
        }
    });
}

function initCardGridFilters() {
    const searchInputs = document.querySelectorAll('input[placeholder*="البحث في المسابقات"], input[placeholder*="Search in auctions"]');

    searchInputs.forEach(input => {
        input.addEventListener("input", function () {
            const searchTerm = this.value.toLowerCase().trim();
            const tabPane = this.closest(".tab-pane");
            if (!tabPane) return;

            const cards = tabPane.querySelectorAll(".tender-card, .col-md-6.col-xxl-4"); // Adjust based on grid structure

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

    // Handle Filter Modal "Apply" button logic (Placeholder for now)
    const applyFilterBtn = document.querySelector("#filterModal .btn-primary");
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener("click", () => {
            // Logic to collect values from modal and filter the current view
            // This will depend on specific fields being added to cards/rows as data attributes
            console.log("Filtering applied from modal");
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
            if (modal) modal.hide();
        });
    }

    // Handle Filter Modal "Reset" button
    const resetFilterBtn = document.querySelector("#filterModal .btn-primary-outline");
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener("click", () => {
            const modalBody = document.querySelector("#filterModal .modal-body");
            const selects = modalBody.querySelectorAll("select");
            selects.forEach(select => {
                if (select.multiple) {
                    // Choices.js or native multiple
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
