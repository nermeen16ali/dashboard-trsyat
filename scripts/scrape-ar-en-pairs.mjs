import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function texts(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const pairs = {};
const SKIP = new Set([
  "tenders-results.html",
  "tenders-pricing.html",
  "tenders-results-ltr.html",
  "tenders-pricing-ltr.html",
]);

for (const name of fs
  .readdirSync(root)
  .filter((f) => f.endsWith(".html") && !f.endsWith("-ltr.html") && !SKIP.has(f))) {
  const ltr = name.replace(/\.html$/, "-ltr.html");
  if (!fs.existsSync(path.join(root, ltr)) || SKIP.has(ltr)) continue;
  const a = texts(fs.readFileSync(path.join(root, name), "utf8"));
  const e = texts(fs.readFileSync(path.join(root, ltr), "utf8"));
  const n = Math.min(a.length, e.length);
  for (let i = 0; i < n; i++) {
    if (/[\u0600-\u06FF]/.test(a[i]) && !/[\u0600-\u06FF]/.test(e[i]) && a[i].length > 1) {
      pairs[a[i]] = e[i];
    }
  }
}

fs.writeFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "_scraped-pairs.json"),
  JSON.stringify(pairs, null, 2),
  "utf8",
);
console.log("pairs", Object.keys(pairs).length);
