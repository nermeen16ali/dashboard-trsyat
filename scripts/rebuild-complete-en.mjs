#!/usr/bin/env node
/**
 * Rebuild tr-flow-complete-en.mjs: Arabic strings not covered by shared/results/pricing/multiline.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { shared, results, pricing } from "./tr-flow-translations.mjs";
import { multiline } from "./tr-flow-multiline-en.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const UNSAFE = new Set([
  "بحث",
  "توريد",
  "الجهة",
  "النشاط",
  "المورد",
  "الملف",
  "مكتمل",
  "تشغيل وصيانة",
  "تم استخراج",
  "البند",
]);

function applyMap(text, map) {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  let out = text;
  for (const k of keys) {
    if (UNSAFE.has(k)) continue;
    out = out.split(k).join(map[k]);
  }
  return out;
}

const base = { ...multiline, ...shared, ...results, ...pricing };
const rtl = JSON.parse(fs.readFileSync(path.join(__dirname, "_rtl-ar-strings.json"), "utf8"));
const sources = [...rtl.results, ...rtl.pricing];
const htmlSnippets = [
  fs.readFileSync(path.join(root, "tenders-results.html"), "utf8"),
  fs.readFileSync(path.join(root, "tenders-pricing.html"), "utf8"),
];

/** @type {Record<string, string>} */
const extraFile = path.join(__dirname, "_complete-en-extra.json");
const extra = fs.existsSync(extraFile)
  ? JSON.parse(fs.readFileSync(extraFile, "utf8"))
  : {};

// All explicit keys from i18n modules (covers most UI + many samples).
for (const [k, v] of Object.entries({ ...shared, ...results, ...pricing, ...multiline })) {
  if (/[\u0600-\u06FF]/.test(k)) extra[k] = v;
}

const candidates = new Set([...sources, ...Object.keys(extra)]);
for (const h of htmlSnippets) {
  const re = /[\u0600-\u06FF][\u0600-\u06FF\s\d،.؛:!؟\-–—«»%()\[\]\/\\+\u2019'"]{2,}/g;
  for (const m of h.matchAll(re)) {
    const t = m[0].trim();
    if (t.length >= 3 && t.length <= 400) candidates.add(t);
  }
}

const scraped = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_scraped-pairs.json"), "utf8"),
);
const tenderRtl =
  fs.readFileSync(path.join(root, "tenders-results.html"), "utf8") +
  fs.readFileSync(path.join(root, "tenders-pricing.html"), "utf8");

/** @type {Record<string, string>} */
const complete = {};
function addComplete(k, v) {
  if (!k || !v || !/[\u0600-\u06FF]/.test(k)) return;
  if (UNSAFE.has(k)) return;
  if (/[A-Za-z]/.test(k) && /[\u0600-\u06FF]/.test(k)) return;
  if (base[k] !== undefined) return;
  if (/[\u0600-\u06FF]/.test(v)) return;
  if (!tenderRtl.includes(k)) return;
  complete[k] = v;
}
for (const [k, v] of Object.entries(extra)) addComplete(k, v);

for (const k of Object.keys(complete)) {
  if (UNSAFE.has(k)) delete complete[k];
  if (/[A-Za-z]/.test(k) && /[\u0600-\u06FF]/.test(k)) delete complete[k];
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

const lines = Object.entries(complete)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([k, v]) => `  "${esc(k)}": "${esc(v)}",`);

const out = `/** Additional Arabic → English (full strings, sample data). Sorted longest-first at build time. */
export const complete = {
${lines.join("\n")}
};
`;

fs.writeFileSync(path.join(__dirname, "tr-flow-complete-en.mjs"), out, "utf8");
const untranslated = [...candidates].filter(
  (ar) => /[\u0600-\u06FF]/.test(ar) && applyMap(ar, { ...base, ...complete }) === ar,
);
console.log("complete entries:", lines.length, "still untranslated:", untranslated.length);
if (untranslated.length) {
  fs.writeFileSync(
    path.join(__dirname, "_complete-en-missing.json"),
    JSON.stringify(untranslated.slice(0, 200), null, 2),
    "utf8",
  );
}
