import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const f of fs.readdirSync(root).filter((x) => x.endsWith("-ltr.html"))) {
  let h = fs.readFileSync(path.join(root, f), "utf8");
  if (f !== "tenders-results-ltr.html") {
    h = h.replaceAll('href="tenders-results.html"', 'href="tenders-results-ltr.html"');
  }
  if (f !== "tenders-pricing-ltr.html") {
    h = h.replaceAll('href="tenders-pricing.html"', 'href="tenders-pricing-ltr.html"');
  }
  fs.writeFileSync(path.join(root, f), h);
}
console.log("Updated LTR nav links for tender results/pricing.");
