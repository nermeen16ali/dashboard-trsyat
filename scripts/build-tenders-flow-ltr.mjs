#!/usr/bin/env node
/**
 * Build tenders-results-ltr.html / tenders-pricing-ltr.html from RTL sources.
 *
 * Translates static UI only (nav, wizard, tabs, buttons, labels, table headers,
 * placeholders, aria-labels). Mock cards, table rows, and chart/list samples stay
 * as in the RTL HTML until the backend supplies English content.
 *
 * Usage: node scripts/build-tenders-flow-ltr.mjs [tenders-results|tenders-pricing|all]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { shared, results, pricing } from "./tr-flow-translations.mjs";
import { complete } from "./tr-flow-complete-en.mjs";
import { multiline } from "./tr-flow-multiline-en.mjs";
import { applyLtrArrowFixes } from "./ltr-arrow-fixes.mjs";
import { syncMainNavForFile } from "./sync-ltr-main-nav-tabs.mjs";

/** Substring keys that corrupt longer Arabic phrases when replaced globally. */
const UNSAFE_SUBSTRING_KEYS = new Set([
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

function buildTranslationMap(cfg) {
  const raw = { ...shared, ...cfg.extra, ...complete };
  for (const k of UNSAFE_SUBSTRING_KEYS) {
    delete raw[k];
  }
  for (const k of Object.keys(raw)) {
    const htmlFragment = k.startsWith("<") || (k.includes('="') && k.includes(">"));
    if (htmlFragment) continue;
    if (/[A-Za-z]/.test(k) && /[\u0600-\u06FF]/.test(k)) {
      delete raw[k];
    }
  }
  return { ...multiline, ...raw };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PAGE_CONFIG = {
  "tenders-results": {
    src: "tenders-results.html",
    out: "tenders-results-ltr.html",
    rtlHref: "tenders-results.html",
    title: "Tender Results",
    description:
      "Tender intelligence — search prior tender results, awards, and bidders.",
    extra: results,
  },
  "tenders-pricing": {
    src: "tenders-pricing.html",
    out: "tenders-pricing-ltr.html",
    rtlHref: "tenders-pricing.html",
    title: "Tender Pricing",
    description:
      "Tender pricing on Trsyat — estimate line-item costs and compare prices from multiple sources.",
    extra: pricing,
  },
};

function listLtrBases() {
  return fs
    .readdirSync(root)
    .filter((f) => f.endsWith("-ltr.html"))
    .map((f) => f.replace("-ltr.html", ".html"));
}

function rewriteInternalLinks(html) {
  const ltrBases = new Set(listLtrBases());
  ltrBases.add("tenders-results.html");
  ltrBases.add("tenders-pricing.html");

  return html.replace(/href="([^"#?]+\.html)"/g, (full, href) => {
    if (href.includes("-ltr.html")) return full;
    const base = path.basename(href);
    const name = base.replace(/\.html$/, "");
    const ltrName = `${name}-ltr.html`;
    if (ltrBases.has(base) || ltrBases.has(ltrName.replace("-ltr.html", ".html"))) {
      const dir = href.includes("/") ? href.slice(0, href.lastIndexOf("/") + 1) : "";
      return `href="${dir}${ltrName}"`;
    }
    return full;
  });
}

function extractNotificationModal(indexLtr) {
  const start = indexLtr.indexOf("<!--Notification Modal-->");
  const end = indexLtr.indexOf("<!-- Top Navigation Bar -->");
  if (start === -1 || end === -1) {
    throw new Error("Could not extract notification modal from index-ltr.html");
  }
  return indexLtr.slice(start, end);
}

function applyTranslations(html, map) {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  let out = html;
  for (const ar of keys) {
    out = out.split(ar).join(map[ar]);
  }
  return out;
}

function buildPage(key) {
  const cfg = PAGE_CONFIG[key];
  const srcPath = path.join(root, cfg.src);
  const indexLtr = fs.readFileSync(path.join(root, "index-ltr.html"), "utf8");
  let html = fs.readFileSync(srcPath, "utf8");

  html = html.replace(/<html lang="ar" dir="rtl">/, '<html lang="en" dir="ltr">');
  html = html.replace(
    /<link href="assets\/css\/bootstrap\.rtl\.min\.css" rel="stylesheet" \/>/,
    `<link href="assets/css/inter.css" rel="stylesheet" />\n  <link href="assets/css/bootstrap.min.css" rel="stylesheet" />`,
  );
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${cfg.title}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${cfg.description}" />`,
  );

  const modalBlock = extractNotificationModal(indexLtr);
  html = html.replace(
    /<!--Notification Modal-->[\s\S]*?<!-- Top Navigation Bar -->/,
    modalBlock + "\n\n  <!-- Top Navigation Bar -->",
  );

  html = rewriteInternalLinks(html);

  html = html.replace(
    /(<a href=")[^"]*(" class="nav-link">\s*<svg[\s\S]*?<\/svg>\s*)<span>English<\/span>/,
    `$1${cfg.rtlHref}$2<span>العربية</span>`,
  );

  html = html.replace(/\btext-end w-100\b/g, "text-start w-100");
  html = html.replace(/gap-3 text-end w-100/g, "gap-3 text-start w-100");

  const map = buildTranslationMap(cfg);
  html = applyTranslations(html, map);
  html = applyLtrArrowFixes(html);

  const outPath = path.join(root, cfg.out);
  fs.writeFileSync(outPath, html, "utf8");
  if (syncMainNavForFile(cfg.out)) {
    console.log(`Synced main nav-tabs on ${cfg.out}`);
  }
  console.log(`Wrote ${cfg.out} (${html.length} bytes)`);
  return outPath;
}

const arg = process.argv[2] || "all";
const keys =
  arg === "all" ? Object.keys(PAGE_CONFIG) : arg in PAGE_CONFIG ? [arg] : null;
if (!keys) {
  console.error("Usage: node scripts/build-tenders-flow-ltr.mjs [tenders-results|tenders-pricing|all]");
  process.exit(1);
}
for (const k of keys) buildPage(k);
