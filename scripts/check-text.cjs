#!/usr/bin/env node
/**
 * 한국어 텍스트 무결성 검사기
 *
 * 한국어 문자열을 다루는 과정에서 생길 수 있는 토큰 깨짐을 잡아냅니다.
 *   1. 한자(中日韓) 혼입 — 한국어 문서에는 등장하지 않아야 합니다.
 *   2. 한글 + 영문 혼합 단어 (예: "Dissertation하여" 같은 깨진 토큰)
 *   3. 알려진 mojibake 마커
 *
 * 정상 표기는 통과합니다: "CPO에게", "AES-256", "TLS(SSL)", "HWP 파일" 등
 * (조사 제거 후 단독 스크립트면 통과, 정규식 리터럴은 검사 대상에서 제외)
 *
 * 사용: node scripts/check-text.cjs   (오류 발견 시 종료코드 1)
 */
const fs = require('fs');
const path = require('path');

const ROOTS = ['app', 'components', 'lib'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx', '.md']);

const HAN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const HANGUL = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;
const LATIN = /[A-Za-z]/;

const MOJIBAKE = ['ï¿½', 'ï¿', 'â€', 'Ã¢', 'ðŸ', 'Â '];

/** 로마자 약어 뒤에 붙는 한국어 조사(助詞). 제거 후 단독 스크립트면 정상. */
const JOSA = [
  '이라는', '라는', '이란', '에서', '에게', '한테', '으로는', '으로도', '에는', '에도',
  '이라고', '라고', '이라서', '면서', '이나', '라도', '이며', '이고', '만큼', '처럼',
  '보다', '까지', '부터', '으로', '로서', '로써', '같이', '이라고', '라고',
  '은', '는', '이', '가', '을', '를', '의', '에', '와', '과', '도', '로', '야', '여',
  '자', '및', '며', '고', '서', '나', '면', '든', '임', '함', '등', '외', '참', '별',
];

function stripJosa(token) {
  let t = token;
  for (const j of JOSA) {
    if (t.length > j.length && t.endsWith(j)) {
      const head = t.slice(0, -j.length);
      if (HANGUL.test(head) || LATIN.test(head)) return head;
    }
  }
  return t;
}

/** 정규식 리터럴을 제거하여 오탐을 방지합니다. */
function stripRegexLiterals(line) {
  let out = '';
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '/' && line[i + 1] !== '/' && line[i + 1] !== '*') {
      const prev = line[i - 1];
      if (prev === "'" || prev === '"' || prev === '`') {
        out += ch;
        i += 1;
        continue;
      }
      let j = i + 1;
      let inClass = false;
      while (j < line.length) {
        const c = line[j];
        if (c === '\\') {
          j += 2;
          continue;
        }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if (c === '/' && !inClass) break;
        else if (c === '\n') break;
        j += 1;
      }
      i = j + 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function checkString(text, lineNo, file, issues) {
  if (HAN.test(text)) {
    issues.push({ file, line: lineNo, kind: 'CJK', text: text.trim().slice(0, 140) });
    return;
  }
  for (const m of MOJIBAKE) {
    if (text.includes(m)) {
      issues.push({ file, line: lineNo, kind: 'MOJIBAKE', text: m });
      return;
    }
  }

  const tokens = text.split(/[\s()[\]{}"'`,.;:/·\-–—|!?*=<>+&#@~\\]+/);
  for (const raw of tokens) {
    if (!raw) continue;
    const tk = stripJosa(raw);
    if (!tk) continue;
    if (!HANGUL.test(tk) || !LATIN.test(tk)) continue;
    const la = (tk.match(/[A-Za-z]+/g) || []).join('');
    const ko = tk.replace(/[A-Za-z]/g, '');
    if (la.length >= 3 || ko.length >= 3) {
      issues.push({ file, line: lineNo, kind: 'MIXED', text: raw });
    }
  }
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (EXTS.has(path.extname(entry.name))) acc.push(full);
  }
  return acc;
}

const files = ROOTS.filter((r) => fs.existsSync(r)).flatMap((r) => walk(r));
const issues = [];

for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!HANGUL.test(line) && !HAN.test(line)) return;
    const stripped = stripRegexLiterals(
      line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, ''),
    );
    checkString(stripped, i + 1, f, issues);
  });
}

if (issues.length === 0) {
  console.log(`✅ 텍스트 무결성 검사 통과 (${files.length}개 파일)`);
  process.exit(0);
}

const byFile = new Map();
for (const it of issues) {
  if (!byFile.has(it.file)) byFile.set(it.file, []);
  byFile.get(it.file).push(it);
}

console.log(`❌ 텍스트 무결성 오류 ${issues.length}건 발견\n`);
for (const [file, list] of byFile) {
  console.log(`── ${file}`);
  for (const it of list.slice(0, 40)) {
    console.log(`   L${String(it.line).padStart(4)} [${it.kind}] ${it.text}`);
  }
  if (list.length > 40) console.log(`   … 외 ${list.length - 40}건`);
  console.log('');
}
process.exit(1);