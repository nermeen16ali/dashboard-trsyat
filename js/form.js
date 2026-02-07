document.querySelectorAll("textarea").forEach((textarea) => {
  const charCount = textarea.nextElementSibling;

  textarea.addEventListener("input", function () {
    const currentLength = this.value.length;
    const maxLength = this.getAttribute("maxlength");
    charCount.textContent = `${currentLength}/${maxLength}`;
  });
});

document.getElementById("tenderForm").addEventListener("submit", function (e) {
  e.preventDefault();
  alert("تم إرسال النموذج بنجاح!");
});
