import fs from 'fs';

const ar = fs.readFileSync('smart-proposal-generator.html', 'utf8');
const en = fs.readFileSync('smart-proposal-generator-ltr.html', 'utf8');

function norm(s) {
  return s
    .replace(/[\u0600-\u06FF]+/g, '')
    .replace(/text-end/g, 'text-align')
    .replace(/text-start/g, 'text-align')
    .replace(/[A-Za-z]+/g, '')
    .replace(/\.html/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const marker = '<div class="dash-widget sm-0 p-lg-4 spg-root">';
const aLines = ar.slice(ar.indexOf(marker)).split(/\r?\n/);
const eLines = en.slice(en.indexOf(marker)).split(/\r?\n/);

const aFiltered = aLines.map(norm).filter((l) => l.length > 0);
const eFiltered = eLines.map(norm).filter((l) => l.length > 0);

let i = 0;
let j = 0;
const mismatches = [];
while (i < aFiltered.length && j < eFiltered.length && mismatches.length < 25) {
  if (aFiltered[i] === eFiltered[j]) {
    i++;
    j++;
    continue;
  }
  mismatches.push({ ar: aLines[i], en: eLines[j], arN: aFiltered[i], enN: eFiltered[j] });
  if (aFiltered[i].length > eFiltered[j].length) i++;
  else j++;
}
console.log('filtered lines AR', aFiltered.length, 'EN', eFiltered.length);
for (const m of mismatches) {
  console.log('---');
  console.log('AR:', (m.ar || '').trim().slice(0, 160));
  console.log('EN:', (m.en || '').trim().slice(0, 160));
}
