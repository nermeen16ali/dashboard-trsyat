import fs, { globSync } from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

const files = globSync("**/*.html", { cwd: root }).filter((f) => {
  const html = fs.readFileSync(path.join(root, f), "utf8");
  return html.includes("competition-table");
});

const tableRe = /<table[^>]*competition-table[^>]*>([\s\S]*?)<\/table>/gi;

for (const rel of files) {
  const p = path.join(root, rel);
  const html = fs.readFileSync(p, "utf8");
  let m;
  let idx = 0;
  while ((m = tableRe.exec(html))) {
    idx++;
    const block = m[1];
    const ths = [...block.matchAll(/<th[^>]*>([^<]+)</g)].map((x) => x[1].trim());
    const tds = [...block.matchAll(/<td([^>]*)>/g)];
    const noLabel = tds.filter((x) => !/data-label=/.test(x[1])).length;
    if (noLabel) {
      console.log(`${rel} table #${idx}: ${noLabel}/${tds.length} td without data-label; th: ${ths.join(" | ")}`);
    }
  }
}
