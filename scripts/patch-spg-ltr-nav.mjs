import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NAV = [
  ["Upgrade الحساب", "Upgrade account"],
  ["دليل الأستخدام", "User guide"],
  ["الأعدادت", "Settings"],
  ["الإعدادات", "Settings"],
  ["الخروج", "Log out"],
  ["الاشعارات", "Notifications"],
  ["عرض جميع Notifications", "View all notifications"],
  ["تم استلام طلبك", "Your request has been received"],
  [
    "تم استلام طلب المناقصة بنجاح، وجار مراجعته من قبل الإدارة.",
    "The tender request has been successfully received and is being reviewed by the administration.",
  ],
  ["11:30 مساءً", "11:30 PM"],
  ["طلبك قيد المراجعة", "Your request is under review"],
  [
    "يتم حاليا مراجعة طلب المناقصة، وسيتم إشعارك فور اتخاذ إجراء.",
    "The tender request is currently being reviewed, and you will be notified once action is taken.",
  ],
  ["تم رفض الطلب", "Request rejected"],
  [
    "نأسف لإبلاغك بأنه تم رفض طلب المناقصة. يمكنك مراجعة التفاصيل لمعرفة السبب.",
    "We regret to inform you that your tender request has been rejected. You can review the details to see the reason.",
  ],
  ["نأسف لإبلاغك بأنه تم رفض طلب المناقصة. يمكنك مراجعة Details", "We regret to inform you that your tender request has been rejected. You can review the details"],
  ["لمعرفة السبب.", " to see the reason."],
  ["مطلوب تعديل على الطلب", "Action required: update request"],
  ["مطلوب Edit على الطلب", "Action required: update request"],
  [
    "يرجى إجراء التعديلات المطلوبة على طلب المناقصة لاستكمال المراجعة.",
    "Please make the required adjustments to your tender request to complete the review.",
  ],
  ["أمس", "Yesterday"],
  ["مناقصة على وشك الإغلاق", "Tender closing soon"],
  ["مناقصة على وشك الClose", "Tender closing soon"],
  ["تبقى وقت قليل على انتهاء موعد التقديم لهذه المناقصة.", "Little time remains before this tender submission deadline."],
  ["تم إعلان الترسية", "Award announced"],
  [
    "تم إعلان نتيجة الترسية لهذه المناقصة. يمكنك الاطلاع على التفاصيل.",
    "The award result for this tender has been announced. You can view the details.",
  ],
  ["5 نوفمبر 2025", "November 5, 2025"],
  ["تم إرسال عرض التسعير", "Pricing proposal sent"],
  ["تم إرسال عرض التسعير الخاص بك بنجاح.", "Your pricing proposal was sent successfully."],
  ["رد من الإدارة", "Reply from administration"],
  [
    "قامت الإدارة بإضافة ملاحظة على طلبك. يرجى الاطلاع عليها.",
    "The administration added a note to your request. Please review it.",
  ],
  ["ابقي علي الأطلاع بالإشعارات", "Stay updated with notifications"],
  ["الرئيسية", "Home"],
  ["المناقصات", "Tenders"],
  ["مناقصات ترشيحات", "Trsyat tenders"],
  ["المناقصات التقديرية", "Estimated tenders"],
  ["مناقصات الفرصة", "Forsa tenders"],
  ["المناقصات المرشحة", "Nominated tenders"],
  ["العروض والاستشارات", "Proposals & consultations"],
  ["نتائج المناقصات", "Tender results"],
  ["إعلان المناقصة", "Tender announcement"],
  ["تسعير المناقصات", "Tender pricing"],
  ["إدارة المناقصات", "Tenders management"],
  ["ترقية", "Upgrade"],
  ["الملف الشخصي", "Profile"],
  ["تسجيل الخروج", "Log out"],
  ["Support الفني", "Support"],
];

NAV.sort((a, b) => b[0].length - a[0].length);

for (const name of [
  "smart-proposal-generator-ltr.html",
  "smart-proposal-template-ltr.html",
  "smart-proposal-export-ltr.html",
]) {
  const filePath = path.join(root, name);
  let content = fs.readFileSync(filePath, "utf8");
  for (const [from, to] of NAV) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Patched nav:", name);
}
