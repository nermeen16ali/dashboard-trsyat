document.addEventListener("DOMContentLoaded", () => {
    const uploadBoxes = document.querySelectorAll(".uploadBox");
    const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

    uploadBoxes.forEach(uploadBox => {
        const fileInput = uploadBox.querySelector(".fileInput");
        const fileInfo = uploadBox.querySelector(".fileInfo");
        const errorMsg = uploadBox.querySelector(".errorMsg");

        if (!fileInput || !fileInfo || !errorMsg) return;

        uploadBox.addEventListener("click", () => {
            fileInput.click();
        });

        uploadBox.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadBox.classList.add("dragover");
        });

        uploadBox.addEventListener("dragleave", () => {
            uploadBox.classList.remove("dragover");
        });

        uploadBox.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadBox.classList.remove("dragover");
            handleFile(e.dataTransfer.files[0], fileInfo, errorMsg);
        });

        fileInput.addEventListener("change", () => {
            handleFile(fileInput.files[0], fileInfo, errorMsg);
        });
    });

    function handleFile(file, fileInfo, errorMsg) {
        // reset state
        fileInfo.classList.add("d-none");
        errorMsg.classList.add("d-none");
        fileInfo.textContent = "";
        errorMsg.textContent = "";

        if (!file) return;

        if (file.size > MAX_SIZE) {
            errorMsg.textContent = "حجم الملف أكبر من 500 ميغابايت";
            errorMsg.classList.remove("d-none");
            return;
        }

        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

        fileInfo.textContent = `تم اختيار الملف: ${file.name} (${sizeMB} MB)`;
        fileInfo.classList.remove("d-none");

        // 👉 upload logic later
        console.log("File ready to upload:", file);
    }
});