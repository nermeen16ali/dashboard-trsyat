import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const file of ["tenders-results.html", "tenders-results-ltr.html"]) {
  const filePath = path.join(root, file);
  let html = fs.readFileSync(filePath, "utf8");
  const tbodyMark = 'id="trTopWinnersBody"';
  const idx = html.indexOf(tbodyMark);
  if (idx === -1) {
    console.warn("skip", file);
    continue;
  }
  const tableStart = html.lastIndexOf("<table", idx);
  const theadEnd = html.indexOf("</thead>", tableStart);
  const tbodyStart = html.indexOf("<tbody", theadEnd);
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  const thead = html.slice(tableStart, theadEnd + 8);
  const ths = [...thead.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  );
  let tbody = html.slice(tbodyStart, tbodyEnd + 8);
  tbody = tbody.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/gi, (full, trAttrs, inner) => {
    let cellIdx = 0;
    const next = inner.replace(/<td([^>]*)>/gi, (m, attrs) => {
      const label = ths[cellIdx];
      cellIdx++;
      if (!label || cellIdx === 1 || attrs.includes("data-label=")) {
        return `<td${attrs}>`;
      }
      const esc = label.replace(/"/g, "&quot;");
      return `<td data-label="${esc}"${attrs}>`;
    });
    return `<tr${trAttrs}>${next}</tr>`;
  });
  html = html.slice(0, tbodyStart) + tbody + html.slice(tbodyEnd + 8);
  fs.writeFileSync(filePath, html);
  console.log("labeled trTopWinnersBody in", file);
}
