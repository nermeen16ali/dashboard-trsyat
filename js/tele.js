document.addEventListener("DOMContentLoaded", function () {
    flatpickr(".flatpickr-input", {
        dateFormat: "Y-m-d",
        locale: "ar",
        disableMobile: true,
    });

    // Initialize Intl Tel Input
    const inputOptions = {
        initialCountry: "sa",
        preferredCountries: ["sa", "eg", "ae", "kw", "qa", "bh", "om"],
        separateDialCode: true,
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/utils.js",
    };

    // Select all inputs by class
    document.querySelectorAll(".intl-phone").forEach((input) => {
        window.intlTelInput(input, inputOptions);
    });
});
