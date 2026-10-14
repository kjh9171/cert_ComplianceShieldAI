import { INDUSTRY_PRESETS } from '../catalog';
import { addMonths, toISODate } from '../state';
import type { DocState, IndustryKey, PatchOp, TemplateId } from '../types';
import type { RuleResult } from './lexicon';
import {
  hasNegative,
  matchCatalog,
  PII_KEYWORDS,
  SAFEGUARD_KEYWORDS,
  splitTriplet,
  TEMPLATE_WORDS,
  valueAfter,
} from './lexicon';

const DONE = '적용했습니다.';
const FALLBACK_SUGGESTIONS = [
  '회사명은 주식회사 에이비씨로 바꿔줘',
  '보호책임자는 김철수 / cpo@abc.co.kr / 02-000-0000',
  '주민등록번호를 수집 항목에 추가해줘',
  '유출방지 조치를 적용해줘',
  '우리 회사는 병원이야',
  'PG사에 결제를 위탁해줘',
  '현재 문서를 점검해줘',
];

function trimTo(s: string, max = 80): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * 규칙 기반 한국어 의도 분석기.
 * API 키가 없어도 100% 동작하며, LLM 연동 시 동일한 PatchOp 계약을 사용합니다.
 */
export function interpret(input: string, state: DocState): RuleResult {
  const raw = input.trim();
  if (!raw) {
    return { reply: '무엇을 바꿔드릴까요?', ops: [], matched: 'empty', suggestions: FALLBACK_SUGGESTIONS };
  }
  const text = raw.replace(/\s+/g, ' ');
  const ops: PatchOp[] = [];
  const applied: string[] = [];

  /* ── 1. 인사와 도움말 ─────────────────────────────────────── */
  if (/(안녕|하이|hello|help|도움|뭐\s*할\s*수|어떻게\s*사용|기능\s*안내|가능한\s*것)/i.test(text)) {
    return {
      reply:
        '안녕하세요. ComplianceShield AI 문서 비서입니다. 다음처럼 말씀해 주시면 문서에 바로 반영됩니다.\n' +
        '· "회사명은 주식회사 에이비씨로 바꿔줘"\n' +
        '· "주민등록번호 추가, 쿠키는 빼줘"\n' +
        '· "우리 회사는 병원이야" (업종 자동 적용)\n' +
        '· "접속기록 3년 보관으로 변경"\n' +
        '· "현재 문서를 점검해줘"',
      ops: [],
      matched: 'help',
      suggestions: FALLBACK_SUGGESTIONS,
    };
  }

  /* ── 2. 감사 점검 요청 ────────────────────────────────────── */
  if (/(점검|검사|점수|진단|갭|보완|문제\s*있|확인해|체크해|리뷰)/.test(text)) {
    return {
      reply:
        '현재 입력된 정보를 기준으로 자동 점검합니다. 점검 결과와 미충족 항목은 「컴플라이언스 점검」 탭에서 확인할 수 있습니다. ' +
        '특히 법정 기재 항목이 비어 있으면 먼저 채워 주세요.',
      ops: [],
      matched: 'audit',
      suggestions: ['차기 검토일은 1년 뒤로 설정해줘', '보호조치를 전부 추천해줘', '내부관리계획서로 문서를 바꿔줘'],
    };
  }

  /* ── 3. 업종 변경 ─────────────────────────────────────────── */
  const industryHit = matchIndustry(text);
  if (industryHit) {
    return {
      reply: `${INDUSTRY_PRESETS[industryHit].label} 업종으로 전환하고, 이 업종에 맞는 수집 항목·보호조치·위탁 항목을 자동으로 반영했습니다.`,
      ops: [{ op: 'setField', path: 'org.industry', value: industryHit }],
      matched: 'industry',
      suggestions: [
        `${INDUSTRY_PRESETS[industryHit].emoji} 업종에 맞는 위탁 업체 추가해줘`,
        '이 업종에서 특히 민감한 항목을 더 체크해줘',
      ],
    };
  }

  /* ── 4. 문서 종류 전환 ────────────────────────────────────── */
  const tplHit = matchTemplate(text);
  if (tplHit) {
    const meta = TEMPLATE_WORDS.find((t) => t.id === tplHit)!;
    return {
      reply: `「${meta.title}」 문서로 전환할까요? 아래 버튼을 누르면 해당 문서가 생성됩니다.`,
      ops: [{ op: 'switchTemplate', id: tplHit }],
      matched: 'template',
      suggestions: [],
    };
  }

  /* ── 5. 날짜 ──────────────────────────────────────────────── */
  const dateOps = matchDates(text, state);
  ops.push(...dateOps);
  dateOps.forEach((o) => {
    if (o.op === 'setField') applied.push(`${o.path} = ${String(o.value)}`);
  });

  /* ── 6. 보유 기간 ─────────────────────────────────────────── */
  const retention = matchRetention(text);
  if (retention) {
    ops.push(retention);
  }

  /* ── 7. 위탁 / 제3자 제공 / 국외이전 ───────────────────────── */
  const partner = matchPartners(text);
  ops.push(...partner);

  /* ── 8. 보호책임자(CPO) ───────────────────────────────────── */
  const cpo = matchOfficer(text, ['cpo']);
  ops.push(...cpo);

  /* ── 9. 선정업무 담당자 ───────────────────────────────────── */
  const officer = matchOfficer(text, ['officer']);
  ops.push(...officer);

  /* ── 10. 법인 기본 정보 ──────────────────────────────────── */
  ops.push(...matchOrgFields(text));

  /* ── 11. 처리 목적 추가 ──────────────────────────────────── */
  const purpose = matchPurpose(text);
  if (purpose) ops.push(purpose);

  /* ── 12. 개인정보 수집 항목 ──────────────────────────────── */
  ops.push(...matchPii(text, state));

  /* ── 13. 운영 정책 문구 ──────────────────────────────────── */
  ops.push(...matchPolicyFields(text, state));

  /* ── 13. 안전성 확보조치 ─────────────────────────────────── */
  ops.push(...matchSafeguards(text, state));

  if (ops.length === 0) {
    return {
      reply:
        '요청하신 내용을 정확히 파악하지 못했습니다. 아래 형식으로 다시 말씀해 주시면 바로 반영됩니다.\n' +
        '· "회사명은 ○○로 바꿔줘"\n' +
        '· "보호책임자는 성명 / 이메일 / 전화번호"\n' +
        '· "○○을 수집 항목에 추가해줘" 또는 "○○은 빼줘"\n' +
        '· "처리 목적에 ○○ 추가"',
      ops: [],
      matched: 'fallback',
      suggestions: FALLBACK_SUGGESTIONS,
    };
  }

  const hasStateChange = ops.some((o) => o.op !== 'switchTemplate');
  return {
    reply: hasStateChange
      ? `${ops.length}개의 요청을 문서에 ${DONE}`
      : '요청을 확인했습니다. 아래 안내대로 진행해 주세요.',
    ops,
    matched: 'mixed',
    suggestions: [],
  };
}

/* ================================================================== */
/*  매처 구현                                                            */
/* ================================================================== */

function matchIndustry(text: string): IndustryKey | null {
  const direct: [IndustryKey, string[]][] = [
    ['ecommerce', ['쇼핑몰', '전자상거래', '이커머스', '스토어', '쇼핑']],
    ['healthcare', ['병원', '의원', '의료', '치과', '한의원', '임상']],
    ['education', ['학원', '학교', '교육', '강의', '학교']],
    ['finance', ['금융', '핀테크', '은행', '카드사', '자산운용']],
    ['logistics', ['물류', '배송', '택배', '콜택시', '화물']],
    ['manufacturing', ['제조', '공장', '생산', '제조업']],
    ['marketing', ['마케팅', '광고', '퍼포먼스', '애드']],
    ['media', ['미디어', '콘텐츠', '커뮤니티', '커머스', '블로그', '영상']],
    ['it-saas', ['SaaS', 'SaaS', '소프트웨어', 'IT', '클라우드', '앱', '플랫폼', '개발']],
    ['generic', ['일반 기업', '일반 회사', '기타']],
  ];
  for (const [key, words] of direct) {
    if (words.some((w) => text.toLowerCase().includes(w.toLowerCase()))) return key;
  }
  return null;
}

function matchTemplate(text: string): TemplateId | null {
  const explicit = /(?:문서를|을|를)\s*(?:바꿔|바꾸|전환|변경|만들어|생성|작성)/.test(text);
  for (const t of TEMPLATE_WORDS) {
    if (t.words.some((w) => text.includes(w))) {
      if (explicit || /(바꿔|바꾸|전환|만들|생성|작성|보여|열어|해줘|해)/.test(text)) return t.id;
    }
  }
  return null;
}

function matchDates(text: string, state: DocState): PatchOp[] {
  const ops: PatchOp[] = [];
  const map: { words: string[]; path: string }[] = [
    { words: ['시행일', '시행 일자', '적용일'], path: 'org.effectiveDate' },
    { words: ['개정일', '최종 개정', '개정 일자'], path: 'org.lastRevised' },
    { words: ['검토일', '차기 검토', '재검토일'], path: 'org.nextReview' },
  ];

  for (const m of map) {
    const idx = m.words.findIndex((w) => text.includes(w));
    if (idx < 0) continue;
    const keyword = m.words[idx];
    const fallback =
      m.path === 'org.nextReview' ? addMonths(state.org.effectiveDate || toISODate(new Date()), 12) : toISODate(new Date());
    const { value, matched } = parseDate(text, fallback);
    if (matched) {
      ops.push({ op: 'setField', path: m.path, value });
      return ops;
    }
    void keyword;
  }
  return ops;
}

function parseDate(text: string, fallback: string) {
  // Date values must be present near the keyword
  const iso = /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/.exec(text);
  if (iso) return { value: isoDate(iso), matched: true };
  const kr = /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(text);
  if (kr) return { value: isoDate(kr), matched: true };
  const kr2 = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(text);
  if (kr2) return { value: isoDate(['20', String(new Date().getFullYear()), kr2[1], kr2[2]]), matched: true };
  if (/(내일|모레|오늘|지금|현재)/.test(text)) {
    const d = new Date();
    if (/내일/.test(text)) d.setDate(d.getDate() + 1);
    if (/모레/.test(text)) d.setDate(d.getDate() + 2);
    return { value: toISODate(d), matched: true };
  }
  const rel = /(\d+)\s*(년|개월|달|주)\s*(뒤|후|이후)/.exec(text);
  if (rel) {
    const n = Number(rel[1]);
    const base = fallback;
    if (rel[2] === '년') return { value: addMonths(base, n * 12), matched: true };
    if (rel[2] === '주') {
      const d = new Date(base + 'T00:00:00');
      d.setDate(d.getDate() + n * 7);
      return { value: toISODate(d), matched: true };
    }
    return { value: addMonths(base, n), matched: true };
  }
  return { value: fallback, matched: false };
}

function isoDate(parts: string[]): string {
  const y = parts[1];
  const m = parts[2].padStart(2, '0');
  const d = parts[3].padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function matchRetention(text: string): PatchOp | null {
  const hasKeyword = /(보유|보관|유지)\s*(기간|기한)|유지\s*기간|보유기간/.test(text);
  if (!hasKeyword) return null;

  const periodMatch = /(\d+)\s*(년|개월|달|일|주)(?!도)/.exec(text);
  const period = periodMatch ? `${periodMatch[1]}${periodMatch[2]}` : '법정 보관기간 준용';

  const item = valueAfter(text, ['항목은', '항목은 ', '보유 항목', '항목']) ?? '개인정보(전 항목)';

  // 항목이 이미 등록되어 있으면 갱신 대신 안내만
  return {
    op: 'addRetentionRule',
    value: {
      id: 'auto',
      item: trimTo(item, 40),
      period,
      basis: '회사 내부 기준 및 관련 법령에 따름',
    },
  };
}

function matchPartners(text: string): PatchOp[] {
  const ops: PatchOp[] = [];

  // 국외이전
  const overseasTriggers = /(국외|해외| abroad| abroad)/i;
  const country =
    /(미국|usa|us)/i.exec(text)?.[0] ??
    /(일본|japan)/i.exec(text)?.[0] ??
    /(싱가포르|singapore)/i.exec(text)?.[0] ??
    /(유럽|독일|germany)/i.exec(text)?.[0] ??
    /(중국|china)/i.exec(text)?.[0] ??
    /(호주|australia)/i.exec(text)?.[0] ??
    /(캐나다|canada)/i.exec(text)?.[0] ??
    /(인도|india)/i.exec(text)?.[0] ??
    /(브라질|brazil)/i.exec(text)?.[0] ??
    /(인도네시아)/.exec(text)?.[0] ??
    null;

  if (country && (overseasTriggers.test(text) || /(이전|옮겨|보관|처리)/.test(text))) {
    const entity = valueAfter(text, ['수신자는', '수신자', '업체는', '업체']) ?? `${country} 소재 클라우드 사업자`;
    ops.push({
      op: 'addOverseas',
      value: {
        id: 'auto',
        country,
        entity: trimTo(entity, 40),
        items: '회원 식별정보, 서비스 이용기록',
        purpose: '시스템 운영 및 장애 복구',
        method: '암호화된 전송 및 저장 데이터 암호화',
        legalBasis: '정보주체의 별도 동의를 기준으로 국외이전한다.',
        consentProcess:
          '가입 시 국외이전 안내서를 고지하고 별도 동의를 받으며, 동의 거부 시 국내 서버로 처리한다.',
      },
    });
  }

  // 처리위탁
  const entrustTriggers = /(위탁|외주|outsource|대행)/.test(text);
  if (entrustTriggers) {
    const entity =
      valueAfter(text, ['위탁해', '위탁할', '위탁업체', '업체는', '업체에', '업체']) ??
      /(PG사|PG)/i.exec(text)?.[0] ??
      /(클라우드)/.exec(text)?.[0] ??
      /(문자|알림톡|SMS|sms)/i.exec(text)?.[0] ??
      /(CS|상담\s*외주)/i.exec(text)?.[0] ??
      '(기타 수탁 업체)';
    const purpose =
      valueAfter(text, ['목적으로', '용도로', '목적은']) ??
      /(결제|정산)/.test(text)
        ? '결제 승인 및 정산 처리'
        : /(발송|문자|알림)/.test(text)
          ? '알림 메시지 발송'
          : /(호스팅|인프라|서버)/.test(text)
            ? '서버 인프라 운영 및 데이터 보관'
            : '위탁 업무 수행';
    const items =
      valueAfter(text, ['항목은', '항목으로', '정보는']) ??
      /(결제|카드)/.test(text)
        ? '카드번호, 주문 정보, 결제금액'
        : /(발송|문자|알림)/.test(text)
          ? '휴대전화번호'
          : '회원 식별정보, 서비스 이용기록';

    ops.push({
      op: 'addEntrusted',
      value: {
        id: 'auto',
        entity: trimTo(entity, 40),
        purpose: trimTo(purpose, 40),
        items: trimTo(items, 60),
        period: '계약 기간 중',
        legalBasis: '정보주체의 동의를 기준으로 수탁 계약을 체결한다.',
        supervision:
          '수탁자는 월 1회 접근기록을 회사에 제출하고, 회사는 연 1회 수탁자를 대상으로 실태조사를 실시한다.',
      },
    });
  }

  // 제3자 제공
  const thirdPartyTriggers = /(제3자\s*제공|제공 대상|공개 대상)/.test(text);
  if (thirdPartyTriggers && !entrustTriggers) {
    const entity = valueAfter(text, ['제공받는', '대상은', '대상은 ', '업체는', '업체']) ?? '(제3자 제공 대상)';
    const purpose = valueAfter(text, ['목적으로', '용도로']) ?? '합법적인 사유에 따른 제공';
    ops.push({
      op: 'addThirdParty',
      value: {
        id: 'auto',
        entity: trimTo(entity, 40),
        purpose: trimTo(purpose, 40),
        items: '제공 대상과 별도로 동의받은 항목',
        method: '안전한 전송 수단',
        legalBasis: '정보주체의 동의를 기준으로 제공에 동의받는다.',
        valueVerification:
          '제공 대상, 목적 및 항목이 동의서와 계약 내용에 일치하는지 확인하고 계약 외 항목이 포함되지 않도록 관리한다.',
      },
    });
  }

  return ops;
}

function matchOfficer(text: string, who: ('cpo' | 'officer')[]): PatchOp[] {
  const ops: PatchOp[] = [];

  const cpoWords = ['보호책임자', 'CPO', 'cpo', '보안책임자', '최고책임자'];
  const officerWords = ['선정업무 담당자', '선정 담당자', '국외이전 담당자', '부서장'];

  const isCpo = who.includes('cpo') && cpoWords.some((w) => text.includes(w));
  const isOfficer = who.includes('officer') && officerWords.some((w) => text.includes(w));
  if (!isCpo && !isOfficer) return ops;

  const raw = valueAfter(text, [...cpoWords, ...officerWords, '담당자는', '담당자']) ?? '';
  if (!raw) return ops;

  const { name, email, phone } = splitTriplet(raw);
  const prefix = isCpo ? 'org.cpo' : 'org.officer';

  if (name) ops.push({ op: 'setField', path: `${prefix}.name`, value: trimTo(name, 24) });
  if (email) ops.push({ op: 'setField', path: `${prefix}.email`, value: email });
  if (phone) ops.push({ op: 'setField', path: `${prefix}.phone`, value: phone });

  return ops;
}

function matchOrgFields(text: string): PatchOp[] {
  const ops: PatchOp[] = [];
  const simple: { words: string[]; path: string; max?: number }[] = [
    { words: ['회사명', '법인명', '기관명', '회사명은', '법인명은'], path: 'org.name', max: 40 },
    { words: ['사업자등록번호', '사업자 번호'], path: 'org.bizNumber', max: 20 },
    { words: ['대표이사', '대표자'], path: 'org.ceo', max: 20 },
    { words: ['임직원 수', '직원 수', '인원'], path: 'org.employeeCount', max: 20 },
    { words: ['홈페이지', '웹사이트'], path: 'org.homepage', max: 60 },
    { words: ['본사 주소', '회사 주소', '주소'], path: 'org.address', max: 80 },
    { words: ['문서 관리번호', '관리번호', '문서번호'], path: 'org.docNumber', max: 30 },
    { words: ['버전'], path: 'org.version', max: 12 },
    { words: ['승인 기구', '승인기구'], path: 'org.approvalBody', max: 30 },
    { words: ['데이터 보관', '데이터센터', '데이터 보관 위치'], path: 'org.masterDataCenter', max: 60 },
  ];

  for (const m of simple) {
    const hit = m.words.find((w) => text.includes(w));
    if (!hit) continue;
    // 이미 날짜/담당자 처리와 충돌하지 않도록 단순값만 추출
    const v = valueAfter(text, m.words);
    if (v && v.length >= 1) ops.push({ op: 'setField', path: m.path, value: trimTo(v, m.max ?? 60) });
  }

  // URL / 이메일 직접 지정
  if (!ops.some((o) => o.op === 'setField' && o.path === 'org.homepage')) {
    const url = /(https?:\/\/[^\s]+|www\.[^\s]+)/.exec(text)?.[0];
    if (url) ops.push({ op: 'setField', path: 'org.homepage', value: url });
  }

  // 문서 버전 (v2.0 형태)
  if (!ops.some((o) => o.op === 'setField' && o.path === 'org.version')) {
    const v = /\bv?\d+\.\d+(\.\d+)?\b/.exec(text)?.[0];
    if (v && /버전|version/i.test(text)) ops.push({ op: 'setField', path: 'org.version', value: v });
  }

  return ops;
}

/** 접속기록 보관, 정기 점검 주기 등 운영 정책 문구를 자연어에서 추출합니다. */
function matchPolicyFields(text: string, state: DocState): PatchOp[] {
  const ops: PatchOp[] = [];

  const period = /(\d+)\s*(년|개월|달|주|일)/.exec(text);

  const rules: { words: string[]; path: string; build: () => string }[] = [
    {
      words: ['접속기록 보관', '접속기록 보관 기간', '로그 보관', '로그 보관 기간', '접속기록 기간'],
      path: 'processing.logRetention',
      build: () =>
        period
          ? `${period[1]}${period[2]} 이상 (접속·관리 행위 로그, 위·변조 방지)`
          : '1년 이상 (접속·관리 행위 로그, 위·변조 방지)',
    },
    {
      words: ['정기 점검', '점검 주기', '연간 점검', '점검 주기를'],
      path: 'processing.inspectionCycle',
      build: () =>
        period
          ? `${period[1]}${period[2]} 1회 (CPO가 주도로 하는 검토회의)`
          : '연 1회 (매년 12월 정기 점검, CPO가 주도로 하는 검토회의)',
    },
    {
      words: ['실태조사', '수탁자 점검', '수탁자 관리 주기'],
      path: 'processing.entrustedAuditCycle',
      build: () =>
        period ? `${period[1]}${period[2]} 수탁자 실태조사` : '연 1회 수탁자 실태조사',
    },
    {
      words: ['파기 방법', '파기 절차', '파기 방법은'],
      path: 'processing.destructionMethod',
      build: () =>
        valueAfter(text, ['파기 방법은', '파기 방법']) ??
        '전자적 파일은 복구할 수 없는 기술적 방법으로 파기하고, 종이 문서는 분쇄 또는 소각한다.',
    },
    {
      words: ['자동화된 결정', '자동화 결정'],
      path: 'processing.automatedDecision',
      build: () =>
        valueAfter(text, ['자동화된 결정은', '자동화 결정은']) ??
        '당사는 개인정보를 자동으로 분석하여 개인화 콘텐츠나 서비스를 추천할 수 있습니다. 중요한 결정은 정보주체의 동의 및 별도 검토 절차를 거칩니다.',
    },
    {
      words: ['대가 검증', '대가검증'],
      path: 'processing.valueVerificationPolicy',
      build: () =>
        valueAfter(text, ['대가 검증은', '대가검증은']) ??
        '위탁 및 제3자 제공 시 제공 대상, 목적, 항목이 계약과 동의 내용에 일치하는지 내부 검증 후 CPO 승인 절차를 거칩니다.',
    },
  ];

  for (const r of rules) {
    if (!r.words.some((w) => text.includes(w))) continue;
    const next = r.build();
    if (next && next !== state.processing[r.path.split('.')[1] as keyof typeof state.processing]) {
      ops.push({ op: 'setField', path: r.path, value: next });
    }
    break;
  }

  return ops;
}

function matchPurpose(text: string): PatchOp | null {
  if (!/(목적|용도)/.test(text)) return null;
  if (!/(추가|넣|포함|더)/.test(text)) return null;
  const v = valueAfter(text, ['목적에', '목적으로', '용도로', '목적은', '용도는', '목적']);
  if (!v || v.length < 2) return null;
  return { op: 'addPurpose', value: trimTo(v, 60) };
}

function matchPii(text: string, state: DocState): PatchOp[] {
  const hits = matchCatalog(text, PII_KEYWORDS);
  if (hits.length === 0) return [];
  const neg = hasNegative(text);
  const ops: PatchOp[] = [];
  for (const id of hits) {
    ops.push(neg ? { op: 'removePii', id } : { op: 'addPii', id });
  }
  void state;
  return ops;
}

function matchSafeguards(text: string, state: DocState): PatchOp[] {
  const hits = matchCatalog(text, SAFEGUARD_KEYWORDS);
  if (hits.length === 0) return [];
  const neg = hasNegative(text);
  const ops: PatchOp[] = [];
  for (const id of hits) {
    ops.push(neg ? { op: 'removeSafeguard', id } : { op: 'addSafeguard', id });
  }
  void state;
  return ops;
}

/** 자연어 → 라벨 (UI 힌트용) */
export { labelOf, stripTail, valueAfter, extractEmail, extractPhone } from './lexicon';