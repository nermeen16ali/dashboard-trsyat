document.addEventListener("DOMContentLoaded", function () {
  flatpickr(".flatpickr-input", {
    dateFormat: "Y-m-d", // format: 2025-11-12
    locale: "ar", // use Arabic calendar labels
    disableMobile: true, // ensures consistent desktop UI
  });
});
