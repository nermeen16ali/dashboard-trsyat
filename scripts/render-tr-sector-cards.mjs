import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapListingCardStyle, renderListingGrid } from './render-tr-listing-card.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'tenders-results.html');
const cards = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tr-sector-competition-cards.json'), 'utf8'),
);

function endOfDiv(html, pos) {
  let i = pos;
  let depth = 0;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth += 1;
      i += 4;
      continue;
    }
    if (html.startsWith('</div>', i)) {
      depth -= 1;
      i += 6;
      if (depth === 0) return i;
      continue;
    }
    i += 1;
  }
  throw new Error(`Unclosed div from ${pos}`);
}

const listHtml = renderListingGrid(cards.map(mapListingCardStyle), {
  pad: '                  ',
  gridClass: 'tr-sector-competition-list',
});

let html = fs.readFileSync(htmlPath, 'utf8');
const secIdx = html.indexOf('<section id="tr-sector"');
const secEnd = html.indexOf('<section id="tr-entity"', secIdx);
if (secIdx < 0 || secEnd < 0) throw new Error('tr-sector section bounds not found');

const headingIdx = html.indexOf('>المنافسات<', secIdx);
if (headingIdx < 0 || headingIdx >= secEnd) throw new Error('Sector competitions heading not found');

const gridIdx = html.indexOf('tr-sector-competition-list', headingIdx);
if (gridIdx < 0 || gridIdx >= secEnd) throw new Error('Sector competition list not found in tr-sector');

const rowStart = html.lastIndexOf('<div class="row g-3', gridIdx);
const lineStart = html.lastIndexOf('\n', rowStart) + 1;
const gridEnd = endOfDiv(html, rowStart);
html = html.slice(0, lineStart) + listHtml + '\n' + html.slice(gridEnd);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Updated tr-sector listing cards:', cards.length);
