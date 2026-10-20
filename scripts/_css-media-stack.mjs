import fs from 'fs';

const lines = fs.readFileSync('css/main.css', 'utf8').split(/\r?\n/);
let depth = 0;
let inComment = false;
const stack = [];

function stripComments(line) {
  // crude: skip comment-only handling per line for @media detection
  return line;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNo = i + 1;
  let j = 0;
  while (j < line.length) {
    if (inComment) {
      if (line[j] === '*' && line[j + 1] === '/') {
        inComment = false;
        j += 2;
        continue;
      }
      j++;
      continue;
    }
    if (line[j] === '/' && line[j + 1] === '*') {
      inComment = true;
      j += 2;
      continue;
    }
    if (line[j] === '{') {
      depth++;
      stack.push({ line: lineNo, text: line.trim().slice(0, 80) });
    }
    if (line[j] === '}') {
      depth--;
      stack.pop();
    }
    j++;
  }
}

console.log('depth at EOF', depth);
if (depth > 0) {
  console.log('unclosed stack (last 10):');
  stack.slice(-10).forEach((s) => console.log(s.line, s.text));
}
