import fs from 'fs';

const s = fs.readFileSync('css/main.css', 'utf8');
let depth = 0;
let line = 1;
let inStr = null;
let inComment = false;
const stack = [];

for (let i = 0; i < s.length; i++) {
  const c = s[i];
  const n = s[i + 1];
  if (c === '\n') {
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
  if (c === '{') {
    depth++;
    stack.push(line);
  }
  if (c === '}') {
    depth--;
    if (depth < 0) console.log('extra } at line', line);
    else stack.pop();
  }
}

console.log('final depth', depth);
if (depth > 0) {
  console.log('unclosed { from lines:', stack.slice(-5));
}
