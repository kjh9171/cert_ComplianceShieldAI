/**
 * 규칙 기반 대화 엔진 회귀 테스트
 * 실행: npx tsx scripts/test-rules.ts   또는  npm run test:rules
 */
import { interpret } from '../lib/chat/rules';
import { applyPatches, createDefaultState } from '../lib/state';
import { renderDocument } from '../lib/render';
import type { DocState } from '../lib/types';

type Case = {
  name: string;
  input: string;
  expect: (s: DocState, applied: string[]) => boolean | string;
};

const cases: Case[] = [
  {
    name: '회사명 변경',
    input: '회사명은 주식회사 에이비씨로 바꿔줘',
    expect: (s) => s.org.name === '주식회사 에이비씨' || `name=${s.org.name}`,
  },
  {
    name: '사업자등록번호 변경',
    input: '사업자등록번호는 111-22-33333으로 바꿔줘',
    expect: (s) => s.org.bizNumber.includes('111-22-33333') || `biz=${s.org.bizNumber}`,
  },
  {
    name: 'CPO 성명·이메일·전화 일괄 지정',
    input: '보호책임자는 김철수 / cpo@abc.co.kr / 02-111-2222',
    expect: (s) =>
      (s.org.cpo.name === '김철수' && s.org.cpo.email === 'cpo@abc.co.kr' && s.org.cpo.phone === '02-111-2222') ||
      `${s.org.cpo.name}/${s.org.cpo.email}/${s.org.cpo.phone}`,
  },
  {
    name: '주민등록번호 수집 항목 추가',
    input: '주민등록번호도 수집해줘',
    expect: (s) => s.processing.piiIds.includes('rrn') || s.processing.piiIds.join(','),
  },
  {
    name: '쿠키 수집 제외',
    input: '쿠키는 수집하지 않아줘',
    expect: (s) => !s.processing.piiIds.includes('cookie') || s.processing.piiIds.join(','),
  },
  {
    name: '유출방지 조치 적용',
    input: '유출방지 조치 적용해줘',
    expect: (s) => s.processing.safeguardIds.includes('dlp') || s.processing.safeguardIds.join(','),
  },
  {
    name: '암호화 제외',
    input: '암호화는 빼고 싶어',
    expect: (s) => !s.processing.safeguardIds.includes('enc_db') || s.processing.safeguardIds.join(','),
  },
  {
    name: '업종 전환 — 쇼핑몰',
    input: '우리 회사는 온라인 쇼핑몰이야',
    expect: (s) => s.org.industry === 'ecommerce' || s.org.industry,
  },
  {
    name: '업종 전환 — 병원',
    input: '우리는 병원이야',
    expect: (s) => s.org.industry === 'healthcare' || s.org.industry,
  },
  {
    name: '처리 목적 추가',
    input: '처리 목적에 포인트 적립 추가해줘',
    expect: (s) => s.processing.purposes.some((p) => p.includes('포인트')),
  },
  {
    name: '시행일자 지정',
    input: '시행일은 2027년 1월 1일로',
    expect: (s) => s.org.effectiveDate === '2027-01-01' || s.org.effectiveDate,
  },
  {
    name: '차기 검토일 상대 지정',
    input: '차기 검토일은 1년 뒤로 설정해줘',
    expect: (s) => s.org.nextReview >= '2026-10-01' || s.org.nextReview,
  },
  {
    name: '보유기간 항목 추가',
    input: '문의 기록은 3년 동안 보관해줘',
    expect: (s) => s.processing.retentionRules.some((r) => r.period.includes('3년')) || 'no 3year rule',
  },
  {
    name: '문서 종류 전환',
    input: '내부관리계획서로 문서를 바꿔줘',
    expect: (_s, applied) => applied.some((a) => a.includes('internal-plan')) || applied.join('|'),
  },
  {
    name: '로그 보관 기간 변경',
    input: '접속기록 보관 기간은 3년으로 바꿔줘',
    expect: (s) => s.processing.logRetention.includes('3년') || s.processing.logRetention,
  },
  {
    name: '평가 요청은 상태를 바꾸지 않음',
    input: '지금 문서를 점검해줘',
    expect: (_s, applied) => applied.length === 0 || applied.join('|'),
  },
];

let pass = 0;
let fail = 0;
const failures: string[] = [];

for (const c of cases) {
  const base = createDefaultState('generic');
  const res = interpret(c.input, base);
  const { state, applied } = applyPatches(base, res.ops);
  const ok = c.expect(state, applied);
  if (ok === true) {
    pass += 1;
    console.log(`  ✅ ${c.name}`);
  } else {
    fail += 1;
    failures.push(`${c.name} → ${String(ok)}`);
    console.log(`  ❌ ${c.name}\n       input: ${c.input}\n       got:   ${String(ok)}`);
    console.log(`       reply: ${res.reply.slice(0, 80)}`);
  }
}

console.log(`\n규칙 엔진: ${pass} 통과 / ${fail} 실패`);

/* ── 렌더링 스모크 테스트 ─────────────────────────────────── */
console.log('\n문서 렌더링 테스트');
for (const tpl of [
  'privacy-policy',
  'internal-plan',
  'security-guideline',
  'outsource-agreement',
  'breach-manual',
] as const) {
  const st = createDefaultState('ecommerce');
  const doc = renderDocument(tpl, st);
  const blocks = doc.blocks.length;
  const ok = doc.plainText.length > 1500 && doc.markdown.length > 500 && blocks > 10;
  console.log(
    `  ${ok ? '✅' : '❌'} ${tpl.padEnd(22)} 블록 ${String(blocks).padStart(3)}개 · 텍스트 ${String(
      doc.plainText.length,
    ).padStart(6)}자 · MD ${String(doc.markdown.length).padStart(6)}자 · slug=${doc.fileSlug}`,
  );
  if (!ok) fail += 1;
  else pass += 1;
}

if (fail > 0) {
  console.log(`\n실패 ${fail}건`);
  process.exit(1);
}
console.log('\n전체 통과');