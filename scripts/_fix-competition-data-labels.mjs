import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

import { globSync } from "fs";

const files = globSync("**/*.html", { cwd: root }).filter((f) => {
  const html = fs.readFileSync(path.join(root, f), "utf8");
  return html.includes("competition-table");
});

function fixTable(tableHtml) {
  const theadMatch = tableHtml.match(/<thead>([\s\S]*?)<\/thead>/i);
  if (!theadMatch) return tableHtml;
  const headerRow = theadMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
  if (!headerRow) return tableHtml;
  const labels = [...headerRow[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim()
  );

  return tableHtml.replace(/(<tbody[^>]*>)([\s\S]*?)(<\/tbody>)/i, (_, open, body, close) => {
    const fixedBody = body.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/gi, (trFull, trAttrs, trInner) => {
      let tdIndex = 0;
      const fixedInner = trInner.replace(/<td([^>]*)>/gi, (tdOpen, tdAttrs) => {
        const label = labels[tdIndex] ?? "";
        tdIndex++;
        if (/data-label=/.test(tdAttrs) || !label) {
          return `<td${tdAttrs}>`;
        }
        const esc = label.replace(/"/g, "&quot;");
        return `<td data-label="${esc}"${tdAttrs}>`;
      });
      return `<tr${trAttrs}>${fixedInner}</tr>`;
    });
    return `${open}${fixedBody}${close}`;
  });
}

function fixFile(rel) {
  const p = path.join(root, rel);
  let html = fs.readFileSync(p, "utf8");
  const tableRe = /<table[^>]*competition-table[^>]*>[\s\S]*?<\/table>/gi;
  html = html.replace(tableRe, (table) => fixTable(table));
  fs.writeFileSync(p, html, "utf8");
  console.log("Updated", rel);
}

for (const f of files) fixFile(f);
