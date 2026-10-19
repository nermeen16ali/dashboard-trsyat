#!/usr/bin/env node
/**
 * Sync main <nav class="nav-tabs"> from tenders-pricing-ltr.html and set active tab per page.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REF = path.join(root, "tenders-pricing-ltr.html");

export const ACTIVE_BY_FILE = {
  "tenders-pricing-ltr.html": "tenders-pricing-ltr.html",
  "tenders-results-ltr.html": "tenders-results-ltr.html",
  "smart-proposal-generator-ltr.html": "smart-proposal-generator-ltr.html",
  "smart-proposal-template-ltr.html": "smart-proposal-generator-ltr.html",
  "smart-proposal-template-preview-ltr.html": "smart-proposal-generator-ltr.html",
};

export function extractMainNavTabs(html) {
  const start = html.indexOf('    <nav class="nav-tabs">');
  const end = html.indexOf("    </nav>", start);
  if (start === -1 || end === -1) {
    throw new Error("Could not find main nav-tabs in reference");
  }
  return html.slice(start, end + "    </nav>".length);
}

export function applyActive(navHtml, activeHref) {
  let out = navHtml.replace(/ class="nav-link active"/g, ' class="nav-link"');
  const needle = `href="${activeHref}" class="nav-link"`;
  if (!out.includes(needle)) {
    throw new Error(`Active href not in nav: ${activeHref}`);
  }
  out = out.replace(needle, `href="${activeHref}" class="nav-link active"`);
  return out;
}

export function replaceMainNavTabs(html, navBlock) {
  const start = html.indexOf('    <nav class="nav-tabs">');
  if (start === -1) {
    return null;
  }
  const end = html.indexOf("    </nav>", start);
  if (end === -1) {
    return null;
  }
  return html.slice(0, start) + navBlock + html.slice(end + "    </nav>".length);
}

let cachedBaseNav = null;

export function getBaseNavFromReference() {
  if (cachedBaseNav) return cachedBaseNav;
  const refHtml = fs.readFileSync(REF, "utf8");
  cachedBaseNav = extractMainNavTabs(refHtml);
  return cachedBaseNav;
}

/** @returns {boolean} whether the file was updated */
export function syncMainNavForFile(basename, activeHref = ACTIVE_BY_FILE[basename]) {
  if (!activeHref) return false;
  const filePath = path.join(root, basename);
  if (!fs.existsSync(filePath)) return false;
  let html = fs.readFileSync(filePath, "utf8");
  const nav = applyActive(getBaseNavFromReference(), activeHref);
  const next = replaceMainNavTabs(html, nav);
  if (!next) return false;
  fs.writeFileSync(filePath, next, "utf8");
  return true;
}

function main() {
  for (const [file, activeHref] of Object.entries(ACTIVE_BY_FILE)) {
    if (syncMainNavForFile(file, activeHref)) {
      console.log("Synced nav-tabs:", file, "→ active", activeHref);
    } else {
      console.warn("Skip", file);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
