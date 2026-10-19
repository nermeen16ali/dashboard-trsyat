import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "tr-flow-complete-en.mjs");
let s = fs.readFileSync(p, "utf8");
s = s.replace(
  /  "توريد أثاث مكتبي — كrاسi هيدrوليك": "Office furniture — hydraulic chairs",\n  "توريد أثاث مكتbbi — كrاسi هيدrوليك": "Office furniture — hydraulic chairs",\n\};/,
  "",
);
if (!s.includes("توريد أجهزة حاسب")) {
  const extra = `
  "توريد أثاث مكتبي — كrاسi هيدrوليك": "Office furniture — hydraulic chairs",
  "توريد أجهزة حاسب": "Supply desktop computers",
  "توريد وتجهيز البنية التقنية": "Supply and setup IT infrastructure",
  "توريد وتركيب مكيفات سبليت 18 وحدة": "Supply and install 18 split AC units",
  "توريد وتركيب نقاط شبكة": "Supply and install network points",
  "جاري جمع أسعار مرجعية للبند الحالي.": "Gathering reference prices for the current item.",
  "جاهز للتحليل": "Ready for analysis",
  "جدول البنود": "Line items table",
  "جدول الكميات": "Bill of quantities",
  "جميع البنود": "All items",
  "حالة التسعير": "Pricing status",
  "حبة": "Unit",
  "حفظ التعديلات": "Save changes",
  "ضريبة (15%)": "VAT (15%)",
  "طريقة إدخال البنود": "Line item entry method",
  "قيد المعالجة": "Processing",
  "كراسة الشروط": "Tender booklet",
  "كيف تريد إدخال بنود المناقصة؟": "How do you want to enter tender line items?",
  "لدي جدول كميات أو كrاسة شروط": "I have a BOQ or tender booklet",
  "متبقي": "Remaining",
  "متوسط السعر": "Average price",
  "مسعّر تلقائياً": "Auto-priced",
  "مشروع تشغيل وصيانة": "Operations and maintenance project",
  "ملخص التكلفة": "Cost summary",
  "ملخص التكلفة النهائي": "Final cost summary",
  "ملخص الخطوات": "Steps summary",
  "نموذج ثابت: جهة ببيانات كاملة للمعاينة.": "Static sample: entity with full data for preview.",
  "معاينة": "Preview",
  "تبويب المتقدmين (قريباً)": "Bidders tab (coming soon)",
};`;
  s = s.replace(/\};[\s]*$/, extra);
}
fs.writeFileSync(p, s);
console.log("patched");
