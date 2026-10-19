import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "tr-flow-complete-en.mjs");

const mod = await import("./tr-flow-complete-en.mjs");
const obj = { ...mod.complete };

const DROP_KEYS = new Set([
  "بحث",
  "توريد",
  "الجهة",
  "النشاط",
  "المورد",
  "الملف",
  "مكتمل",
  "تشغيل وصيانة",
  "تم استخراج",
]);

function isHybridKey(k) {
  return /[A-Za-z]/.test(k) && /[\u0600-\u06FF]/.test(k);
}

for (const k of Object.keys(obj)) {
  if (DROP_KEYS.has(k)) delete obj[k];
  if (isHybridKey(k)) delete obj[k];
  if (/Actionات/.test(k)) delete obj[k];
  if (/[\u0643\u0631\u0627\u0633i]|[\u0647\u064a\u062f]r|\u0645\u0643\u062abbi/.test(k)) delete obj[k];
}

const MSAR = "\u0645\u0633\u0627\u0631";
const normalized = {};
for (const [k, v] of Object.entries(obj)) {
  const key = k.replace(/\u0645\u0633ar/g, MSAR);
  normalized[key] = v;
}

normalized[
  `\u0645\u0644\u062e\u0635 \u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u2014 ${MSAR} \u0627\u0644\u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u064a\u062f\u0648\u064a`
] = "Cost summary — manual entry path";
normalized[
  `\u0645\u0644\u062e\u0635 \u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u2014 ${MSAR} \u0627\u0644\u0645\u0633\u062a\u0646\u062f\u0627\u062a`
] = "Cost summary — documents path";
normalized[
  "\u062a\u0648\u0631\u064a\u062f \u0623\u062b\u0627\u062b \u0645\u0643\u062a\u0628\u064a \u2014 \u0643\u0631\u0627\u0633\u064a \u0647\u064a\u062f\u0631\u0648\u0644\u064a\u0643"
] = "Office furniture — hydraulic chairs";
normalized[
  "\u0644\u062f\u064a \u062c\u062f\u0648\u0644 \u0643\u0645\u064a\u0627\u062a \u0623\u0648 \u0643\u0631\u0627\u0633\u0629 \u0634\u0631\u0648\u0637"
] = "I have a BOQ or tender booklet";

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

const lines = Object.entries(normalized)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([k, v]) => `  "${esc(k)}": "${esc(v)}",`);

const out = `/** Additional Arabic → English (full strings, sample data). Sorted longest-first at build time. */
export const complete = {
${lines.join("\n")}
};
`;

fs.writeFileSync(file, out, "utf8");
console.log("Rewrote", file, "entries:", lines.length);
