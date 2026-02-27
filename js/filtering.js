/**
 * DataTable Filtering Logic
 * Handles DataTable search input and filter buttons
 */

document.addEventListener("DOMContentLoaded", () => {
    if (typeof jQuery !== 'undefined') {
        initDataTableFilters();
    }
});

function initDataTableFilters() {
    if (typeof jQuery === 'undefined') return;

    const checkDataTable = setInterval(() => {
        if (typeof $.fn.DataTable !== 'undefined') {
            const $tables = $(".competition-table");
            if ($tables.length > 0) {
                clearInterval(checkDataTable);
                // Passing the first table for compatibility, but events will find local targets
                setupDataTableEvents($tables.DataTable());
            }
        }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkDataTable), 5000);
}

function setupDataTableEvents(table) {

    // 🔎 DataTable Search Input (Localized to the nearest table container)
    $(".table-search").on("keyup", function () {
        const $input = $(this);
        const $container = $input.closest('.tab-pane, .dash-widget, .container, body');
        const $table = $container.find(".competition-table");

        if ($table.length > 0) {
            $table.DataTable().search(this.value).draw();
        } else {
            table.search(this.value).draw();
        }
    });

    // 🎯 Filter Buttons (Status Column, Localized to the nearest table container)
    $(".filter-btns button").on("click", function () {
        const $btn = $(this);
        const filterValue = $btn.text().trim();
        const $container = $btn.closest('.tab-pane, .dash-widget, .container, body');
        const $table = $container.find(".competition-table");

        // Use localized table API if possible
        const targetTable = $table.length > 0 ? $table.DataTable() : table;

        // Toggle active state
        $btn.siblings().removeClass("active");
        $btn.addClass("active");

        if (filterValue === "الكل" || filterValue === "All") {
            targetTable.column(5).search("").draw();
        } else {
            // Use a regex that handles potential whitespace/newlines in the cell
            const regexValue = '^\\s*' + filterValue.replace(/\s+/g, '\\s+') + '\\s*$';
            targetTable
                .column(5)
                .search(regexValue, true, false, true)
                .draw();
        }
    });
}