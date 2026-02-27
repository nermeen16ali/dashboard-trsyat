
/**
 * DataTable Filtering Logic
 * Handles DataTable search input and filter buttons only
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
            const table = $(".competition-table").DataTable();
            if (table) {
                clearInterval(checkDataTable);
                setupDataTableEvents(table);
            }
        }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkDataTable), 5000);
}

function setupDataTableEvents(table) {

    // 🔎 DataTable Search Input
    $(".table-search").on("keyup", function () {
        table.search(this.value).draw();
    });

    // 🎯 Filter Buttons (Status Column)
    $(".filter-btns button").on("click", function () {
        const $btn = $(this);
        const filterValue = $btn.text().trim();

        // Toggle active state
        $btn.siblings().removeClass("active");
        $btn.addClass("active");

        if (filterValue === "الكل" || filterValue === "All") {
            table.column(5).search("").draw();
        } else {
            // Use a regex that handles potential whitespace/newlines in the cell
            var regexValue = '^\\s*' + filterValue.replace(/\s+/g, '\\s+') + '\\s*$';
            table
                .column(5)
                .search(regexValue, true, false, true)
                .draw();
        }
    });
}