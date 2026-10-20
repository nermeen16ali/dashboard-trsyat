import fs from 'fs';

const s = fs.readFileSync('css/main.css', 'utf8');
let inComment = false;
let line = 1;
let commentStart = 0;

for (let i = 0; i < s.length; i++) {
  const c = s[i];
  const n = s[i + 1];
  if (c === '\n') line++;
  if (!inComment && c === '/' && n === '*') {
    inComment = true;
    commentStart = line;
    i++;
    continue;
  }
  if (inComment && c === '*' && n === '/') {
    inComment = false;
    i++;
    continue;
  }
}

if (inComment) {
  console.log('UNCLOSED comment starting line', commentStart);
} else {
  console.log('All block comments closed');
}
