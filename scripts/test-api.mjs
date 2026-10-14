#!/usr/bin/env node
/**
 * API 통합 테스트 — 실행 중인 서버(기본 http://localhost:3000) 대상
 * 사용: node scripts/test-api.mjs
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

let pass = 0;
let fail = 0;

function ok(name, cond, extra = '') {
  if (cond) {
    pass += 1;
    console.log(`  ✅ ${name}`);
  } else {
    fail += 1;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

const post = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
};

/* ── 1. /api/generate ─────────────────────────────────────── */
console.log('\n/api/generate');
{
  const res = await post('/api/generate', {
    templateId: 'privacy-policy',
    state: {
      org: {
        name: '(주)테스트컴퍼니',
        cpo: { name: '테스트담당', email: 'cpo@test.co.kr', phone: '02-000-1111' },
        effectiveDate: '2026-10-14',
      },
      processing: { industry: 'ecommerce' },
    },
  });
  const data = await res.json();
  ok('HTTP 200', res.status === 200, `status=${res.status}`);
  ok('blocks 배열 반환', Array.isArray(data.blocks) && data.blocks.length > 20);
  ok('plainText 10,000자 이상', data.plainText?.length > 10000, `len=${data.plainText?.length}`);
  ok('markdown 생성', data.markdown?.length > 500);
  ok('fileSlug 한글 인코딩', data.fileSlug?.includes('테스트컴퍼니'), data.fileSlug);
  ok('法 제30조 조항 포함', data.plainText?.includes('제30조'));
  ok('CPO 반영', data.plainText?.includes('테스트담당'));
}

{
  const res = await post('/api/generate', { templateId: 'nope' });
  const data = await res.json();
  ok('잘못된 문서 종류 400', res.status === 400, `status=${res.status}`);
  ok('오류 메시지', typeof data.error === 'string');
}

{
  const res = await fetch(`${BASE}/api/generate`, { method: 'POST', body: 'not-json' });
  ok('잘못한 JSON 400', res.status === 400, `status=${res.status}`);
}

/* ── 2. /api/chat ─────────────────────────────────────────── */
console.log('\n/api/chat');
{
  const cases = [
    ['회사명 변경', '회사명은 주식회사 신한물산으로 바꿔줘', (r) => r.state.org.name === '주식회사 신한물산'],
    ['CPO 지정', '보호책임자는 박민수 / cpo@shinhan.co.kr / 02-333-4444', (r) => r.state.org.cpo.email === 'cpo@shinhan.co.kr'],
    ['업종 전환', '우리 회사는 병원이다', (r) => r.state.org.industry === 'healthcare'],
    ['민감정보 추가', '주민등록번호 추가해줘', (r) => r.state.processing.piiIds.includes('rrn')],
    ['항목 제외', '쿠키는 빼줘', (r) => !r.state.processing.piiIds.includes('cookie')],
    ['보호조치 적용', '유출방지 조치 적용', (r) => r.state.processing.safeguardIds.includes('dlp')],
    ['위탁 추가', 'PG사에 결제를 위탁해줘', (r) => r.state.processing.entrusted.length > 0],
  ];

  for (const [name, msg, assert] of cases) {
    const res = await post('/api/chat', { message: msg, state: {} });
    const data = await res.json();
    ok(`${name} (${data.engine})`, res.status === 200 && assert(data), JSON.stringify(data).slice(0, 160));
  }

  const res = await post('/api/chat', { message: '', state: {} });
  ok('빈 메시지 400', res.status === 400, `status=${res.status}`);
}

/* ── 3. /api/export ───────────────────────────────────────── */
console.log('\n/api/export');
{
  const res = await post('/api/export', { templateId: 'privacy-policy', format: 'docx', state: {} });
  const buf = Buffer.from(await res.arrayBuffer());
  ok('DOCX HTTP 200', res.status === 200, `status=${res.status}`);
  ok(
    'MIME 타입',
    res.headers.get('content-type')?.includes('wordprocessingml'),
    res.headers.get('content-type'),
  );
  ok('DOCX 시그니처(PK)', buf.subarray(0, 2).toString() === 'PK');
  ok('크기 15KB 이상', buf.length > 15000, `bytes=${buf.length}`);

  const cd = res.headers.get('content-disposition') ?? '';
  ok('filename* UTF-8 인코딩', cd.includes("filename*=UTF-8''"), cd.slice(0, 80));
}

for (const fmt of ['md', 'txt', 'hwp']) {
  const res = await post('/api/export', { templateId: 'internal-plan', format: fmt, state: {} });
  const text = await res.text();
  ok(`${fmt.toUpperCase()} 생성`, res.status === 200 && text.length > 3000, `len=${text.length}`);
}

{
  const res = await post('/api/export', { templateId: 'privacy-policy', format: 'pdf', state: {} });
  const html = await res.text();
  ok('PDF(인쇄 HTML) 200', res.status === 200);
  ok('A4 @page 포함', html.includes('@page') && html.includes('A4'));
  ok('window.print 버튼', html.includes('window.print'));
}

{
  const res = await post('/api/export', { templateId: 'privacy-policy', format: 'xyz', state: {} });
  ok('지원하지 않는 형식 400', res.status === 400, `status=${res.status}`);
}

/* ── 4. 정적 페이지 ───────────────────────────────────────── */
console.log('\n정적 자산');
{
  const home = await fetch(BASE);
  const html = await home.text();
  ok('홈페이지 200', home.status === 200);
  ok('제목 포함', html.includes('ComplianceShield AI'));
  ok('한국어 메타', html.includes('개인정보'));
  ok('한글 폰트 로드', /__variable_[a-z0-9]+/.test(html) && /sans-ko|serif/.test(html), 'CSS 변수 누락');

  const logo = await fetch(`${BASE}/logo.svg`);
  ok('logo.svg 200', logo.status === 200);

  const og = await fetch(`${BASE}/opengraph-image`);
  ok('OG 이미지 200', og.status === 200, `status=${og.status}`);
}

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail > 0 ? 1 : 0);