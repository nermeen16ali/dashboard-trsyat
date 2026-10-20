import fs from 'fs';

const ids = (f) => [...fs.readFileSync(f, 'utf8').matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]).sort();
const a = ids('smart-proposal-generator.html');
const e = ids('smart-proposal-generator-ltr.html');
console.log('missing in LTR', a.filter((x) => !e.includes(x)));
console.log('extra in LTR', e.filter((x) => !a.includes(x)));
