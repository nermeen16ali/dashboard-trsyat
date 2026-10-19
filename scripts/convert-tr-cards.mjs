import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapHistoryStyleListing, renderListingGrid } from './render-tr-listing-card.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'tenders-results.html');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'tr-flow-award-cards.json'), 'utf8'));
const labels = JSON.parse(fs.readFileSync(path.join(__dirname, 'tr-latest-awards-labels.json'), 'utf8'));

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

function replaceGridInSection(html, sectionId, gridHtml, opts = {}) {
  const secNeedle = `<section id="${sectionId}"`;
  const secIdx = html.indexOf(secNeedle);
  if (secIdx < 0) throw new Error(`Section ${sectionId} not found`);
  const secEnd = opts.untilSectionId
    ? html.indexOf(`<section id="${opts.untilSectionId}"`, secIdx)
    : html.length;
  if (secEnd < 0) throw new Error(`End section ${opts.untilSectionId} not found`);

  let searchFrom = secIdx;
  if (opts.afterMarker) {
    const markerIdx = html.indexOf(opts.afterMarker, secIdx);
    if (markerIdx < 0 || markerIdx >= secEnd) {
      throw new Error(`Marker ${opts.afterMarker} not found in ${sectionId}`);
    }
    searchFrom = markerIdx;
  }

  const rowNeedles = [
    '<div class="row g-3 tr-award-card-grid',
    '<div class="row g-3 tr-sector-competition-list',
  ];
  let rowStart = -1;
  for (const needle of rowNeedles) {
    const idx = html.indexOf(needle, searchFrom);
    if (idx >= 0 && idx < secEnd) {
      rowStart = idx;
      break;
    }
  }
  if (rowStart < 0) throw new Error(`Grid not found in ${sectionId}`);

  const lineStart = html.lastIndexOf('\n', rowStart) + 1;
  const gridEnd = endOfDiv(html, rowStart);
  return html.slice(0, lineStart) + `${gridHtml}\n` + html.slice(gridEnd);
}

const mapOpts = { historicalBadge: labels.historicalBadge };

let html = fs.readFileSync(htmlPath, 'utf8');

const sections = [
  {
    id: 'tr-history-list',
    untilSectionId: 'tr-sector',
    grid: renderListingGrid(data.history.map((c) => mapHistoryStyleListing(c, mapOpts))),
  },
  {
    id: 'tr-entity-kfu',
    untilSectionId: 'tr-results',
    afterMarker: 'id="tr-entity-tenders"',
    grid: renderListingGrid(
      data.entity.cards.map((c) => mapHistoryStyleListing(c, mapOpts)),
      { pad: data.entity.pad },
    ),
  },
  {
    id: 'tr-results',
    untilSectionId: 'tr-detail',
    grid: renderListingGrid(data.results.map((c) => mapHistoryStyleListing(c, mapOpts))),
  },
];

for (const sec of sections) {
  const { id, grid, untilSectionId, afterMarker } = sec;
  html = replaceGridInSection(html, id, grid, { untilSectionId, afterMarker });
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Regenerated tr-award-card grids (listing card layout).');
