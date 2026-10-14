import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { TEMPLATE_IDS, renderDocument } from '../lib/render';
import { renderDocx } from '../lib/docx';
import { createDefaultState } from '../lib/state';
import type { TemplateId } from '../lib/types';

const TMP = '/tmp/csa-docx-check.docx';

let fail = 0;

/** DOCX XML 텍스트 노드를 추출합니다. */
function collectXmlText(xml: string): string {
  const out: string[] = [];
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out.join('');
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function main() {
  for (const tpl of TEMPLATE_IDS as TemplateId[]) {
    const doc = renderDocument(tpl, createDefaultState('ecommerce'));
    const buf = await renderDocx(doc);

    writeFileSync(TMP, buf);
    const xml = execSync(`unzip -p ${TMP} word/document.xml`).toString();
    const decoded = decode(collectXmlText(xml));

    const problems: string[] = [];

    // 1) 문서에 실제로 남아 있는 엔티티 (사용자에게 &quot; 로 보이는 버그)
    const entities = [...decoded.matchAll(/&[a-z]+;/gi)].map((m) => m[0]);
    if (entities.length) problems.push(`DOCX에 엔티티 잔존: ${[...new Set(entities)].join(', ')}`);

    // 2) 원문 대비 핵심 조항 누락 검사
    const sample = doc.plainText.replace(/\s+/g, '');
    const decodedFlat = decoded.replace(/\s+/g, '');
    for (const probe of ['개인정보보호법', '보호책임자', '보유', '파기']) {
      if (sample.includes(probe) && !decodedFlat.includes(probe)) {
        problems.push(`DOCX에 "${probe}" 누락`);
      }
    }

    // 3) 한글 서체 지정
    if (!/Malgun Gothic|맑은/.test(xml)) problems.push('한글 서체(맑은 고딕)가 지정되지 않음');

    // 4) 표 구조
    const tables = (xml.match(/<w:tbl>/g) ?? []).length;
    if (tables === 0 && tpl !== 'security-guideline') problems.push('표가 하나도 없음');

    const ok = problems.length === 0;
    if (!ok) fail += 1;
    const hangul = [...decoded].filter((c) => /[가-힣]/.test(c)).length;

    console.log(
      `  ${ok ? '✅' : '❌'} ${tpl.padEnd(22)} ${String(buf.byteLength).padStart(6)}B · 표 ${String(tables).padStart(2)}개 · 한글 ${String(hangul).padStart(5)}자`,
    );
    for (const p of problems) console.log(`       └ ${p}`);
  }

  try {
    unlinkSync(TMP);
  } catch {
    /* noop */
  }

  if (fail > 0) {
    console.log(`\nDOCX 검증 실패 ${fail}건`);
    process.exit(1);
  }
  console.log('\nDOCX 생성 검증 전체 통과');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});