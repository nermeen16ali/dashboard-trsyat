// $(document).ready(function () {
//   const table = $("#competitionTable").DataTable({
//     responsive: true,
//     paging: true,
//     info: false,
//     pageLength: 8,
//     lengthChange: false,
//     language: {
//       url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json",
//     },
//   });

//   // Custom search
//   $("#tableSearch").on("keyup", function () {
//     table.search(this.value).draw();
//   });
// });

$(document).ready(function () {
  const table = $(".competition-table").DataTable({
    responsive: true,
    paging: true,
    info: false,
    pageLength: 8,
    lengthChange: false,
    language: {
      url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json",
      paginate: {
        previous: `
                  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                        <path d="M12.5249 15.0586L17.5832 10.0002L12.5249 4.94189" stroke="#0C2030" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path opacity="0.4" d="M3.41675 10H17.4417" stroke="#0C2030" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
        `,
        next: `
                  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                        <path d="M8.4751 15.0586L3.41676 10.0002L8.4751 4.94189" stroke="#0C2030" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path opacity="0.4" d="M17.5833 10H3.55825" stroke="#0C2030" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>

        `
      }
    },
  });

  // Custom search
  $(".table-search").on("keyup", function () {
    table.search(this.value).draw();
  });
});
