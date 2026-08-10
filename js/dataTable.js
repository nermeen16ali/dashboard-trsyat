// $(document).ready(function () {

//   const table = $("#competitionTable").DataTable({
//     responsive: true,
//     paging: true,
//     info: false,
//     pageLength: 8,
//     lengthChange: false,
//     language: {
//       url: "assets/i18n/datatables-ar.json",
//     },
//   });

//   // Custom search
//   $("#tableSearch").on("keyup", function () {
//     table.search(this.value).draw();
//   });
// });

$(document).ready(function () {
  const isRTL = document.documentElement.dir === "rtl";

  const rightArrow = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 21 20" fill="none">
                        <path d="M12.5249 15.0586L17.5832 10.0002L12.5249 4.94189" stroke="#0C2030" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path opacity="0.4" d="M3.41675 10H17.4417" stroke="#0C2030" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
        `;

  const leftArrow = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 21 20" fill="none">
                        <path d="M8.4751 15.0586L3.41676 10.0002L8.4751 4.94189" stroke="#0C2030" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path opacity="0.4" d="M17.5833 10H3.55825" stroke="#0C2030" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
        `;

  const table = $(".competition-table").DataTable({
    responsive: true,
    paging: true,
    info: false,
    pageLength: 8,
    lengthChange: false,
    language: {
      url: isRTL
        ? "assets/i18n/datatables-ar.json"
        : "assets/i18n/datatables-en-GB.json",
      paginate: {
        previous: isRTL ? rightArrow : leftArrow,
        next: isRTL ? leftArrow : rightArrow,
      },
    },
  });

  // Custom search
  $(".table-search").on("keyup", function () {
    table.search(this.value).draw();
  });

  // Select All Checkbox Logic for Pricing Table
  const selectAllPricing = document.getElementById("selectAllPricing");
  if (selectAllPricing) {
    const pricingCheckboxes = document.querySelectorAll(".pricing-checkbox");

    // Header checkbox change event
    selectAllPricing.addEventListener("change", function () {
      pricingCheckboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
    });

    // Individual checkbox change event
    pricingCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        if (!this.checked) {
          selectAllPricing.checked = false;
        } else {
          const allChecked = Array.from(pricingCheckboxes).every(
            (cb) => cb.checked
          );
          selectAllPricing.checked = allChecked;
        }
      });
    });
  }
});
