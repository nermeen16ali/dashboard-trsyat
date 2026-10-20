import fs from 'fs';

const s = fs.readFileSync('css/main.css', 'utf8');
let depth = 0;
let line = 1;
let inStr = null;
let inComment = false;
const targets = new Set([10943, 11060, 11062, 11080]);

for (let i = 0; i < s.length; i++) {
  const c = s[i];
  const n = s[i + 1];
  if (c === '\n') {
    if (targets.has(line)) console.log(`line ${line} end: depth ${depth}`);
    line++;
    continue;
  }
  if (inComment) {
    if (c === '*' && n === '/') {
      inComment = false;
      i++;
    }
    continue;
  }
  if (inStr) {
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === inStr) inStr = null;
    continue;
  }
  if (c === '/' && n === '*') {
    inComment = true;
    i++;
    continue;
  }
  if (c === '"' || c === "'") {
    inStr = c;
    continue;
  }
  if (c === '{') depth++;
  if (c === '}') depth--;
}

console.log('EOF depth', depth, 'total lines', line);
