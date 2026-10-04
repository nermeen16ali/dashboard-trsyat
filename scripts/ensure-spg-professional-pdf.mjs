/**
 * Writes a minimal valid PDF if professional-proposal.pdf is missing or empty.
 * Replace assets/spg/templates/professional-proposal.pdf with your real template when ready.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(
  __dirname,
  "..",
  "assets",
  "spg",
  "templates",
  "professional-proposal.pdf"
);

/** Minimal single-page PDF (blank page, valid structure). */
const MINIMAL_PDF_B64 =
  "JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFI+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNC9Sb290IDEwIFI+PgplbmRvYmoKc3RhcnR4cmVmCjE3NAplbm9icGF0Cg==";

fs.mkdirSync(path.dirname(outPath), { recursive: true });

let size = 0;
try {
  size = fs.statSync(outPath).size;
} catch {
  size = 0;
}

if (size < 32) {
  fs.writeFileSync(outPath, Buffer.from(MINIMAL_PDF_B64, "base64"));
  console.log("Wrote minimal placeholder PDF:", outPath);
} else {
  console.log("PDF already present (", size, "bytes ), skipped.");
}
