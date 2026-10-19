import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'tenders-results.html');

const cards = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tr-latest-awards-cards.json'), 'utf8'),
);
const labels = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tr-latest-awards-labels.json'), 'utf8'),
);
const buildingIcon = fs.readFileSync(
  path.join(__dirname, 'tr-latest-awards-icon-building.svg'),
  'utf8',
);
const pickIcon = fs.readFileSync(
  path.join(__dirname, 'tr-latest-awards-icon-pick.svg'),
  'utf8',
);

const header = fs.readFileSync(path.join(__dirname, 'tr-latest-awards-header.html'), 'utf8');
const footer = fs.readFileSync(path.join(__dirname, 'tr-latest-awards-footer.html'), 'utf8');

function renderLatestAwardCard(c) {
  const titleAttr = c.dir ? ` dir="${c.dir}"` : '';
  const priceBlock = c.price
    ? `
                            <div class="tender-price">
                              <span class="fz-10 d-block mb-1 gray-text">${labels.valueLabel}</span>
                              <span class="fs-6 fw-medium ff-onest black-text">${c.price} ${labels.currency}</span>
                            </div>`
    : '';
  const tagLines = (c.tags || [])
    .map(
      (t) =>
        `                        <span class="sm-ele fz-10 bordered-8 prim-opacity-outlined">${t}</span>`,
    )
    .join('\n');

  return `                    <div class="col-12 col-md-6 col-xl-4">
                      <article class="tender-card tr-award-card p-3 h-100 d-flex flex-column text-start mb-0">
                        <div class="tender-header d-flex align-items-start justify-content-between gap-2 mb-2">
                          <div class="tender-number">
                            <span class="fz-10 gray-text">${labels.refLabel}</span>
                            <span class="fz-14 black-text fw-medium ff-onest d-block" dir="ltr"># ${c.ref}</span>
                          </div>
                          <span class="sm-ele fz-10 bordered-8 badge-success flex-shrink-0">${labels.historicalBadge}</span>
                        </div>
                        <div class="tender-sections p-12 rounded-12 bg-white flex-grow-1">
                          <div class="tender-section position-relative">
                            <h6 class="tender-title mb-2"${titleAttr}>${c.title}</h6>${priceBlock}
                          </div>
                          <div class="tender-section tr-award-card__meta position-relative">
                            <div class="d-flex align-items-start gap-2 mb-2">
                              ${buildingIcon}
                              <div class="flex-grow-1 min-w-0">
                                <span class="fz-10 gray-text d-block">${labels.entityLabel}</span>
                                <span class="fz-14 black-text">${c.entity}</span>
                              </div>
                            </div>
                            <div class="d-flex flex-wrap gap-1 mb-2">
                              <span class="sm-ele fz-10 bordered-8 badge-success">${labels.approvedBadge}</span>
                              <span class="sm-ele fz-10 bordered-8 prim-opacity-outlined">${labels.updateBadgePrefix} <span
                                  class="ff-onest">${c.update}</span></span>
                            </div>
                            <div class="d-flex flex-wrap gap-1">
${tagLines}
                            </div>
                          </div>
                        </div>
                        <div class="tender-footer">
                          <a href="#tr-detail-full"
                            class="btn-main h-41 btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2">
                            <span>${labels.pickBtn}</span>
                            ${pickIcon}
                          </a>
                        </div>
                      </article>
                    </div>`;
}

const cardHtml = cards.map((c) => renderLatestAwardCard(c)).join('\n');
const out = header + cardHtml + '\n                  </div>' + footer + '\n';

let text = fs.readFileSync(htmlPath, 'utf8');
const startMarker =
  '                  <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4 text-start">';
const start = text.indexOf(startMarker);
const end = text.indexOf('            <section id="tr-top-winners"');
if (start < 0 || end < 0) throw new Error('tr-latest-awards markers not found');
const sectionEnd = text.lastIndexOf('            </section>', end);
if (sectionEnd < start) throw new Error('tr-latest-awards section end not found');

text =
  text.slice(0, start) +
  out +
  '                </div>\n              </div>\n' +
  text.slice(sectionEnd);

fs.writeFileSync(htmlPath, text, 'utf8');
console.log('Updated tr-latest-awards award cards:', cards.length);
