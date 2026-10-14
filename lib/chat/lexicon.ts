import { PII_CATALOG, SAFEGUARD_CATALOG } from '../catalog';
import { addMonths, toISODate } from '../state';
import type { PatchOp, TemplateId } from '../types';

export interface RuleResult {
  reply: string;
  ops: PatchOp[];
  /** 규칙 식별자 (디버깅/테스트용) */
  matched: string;
  suggestions?: string[];
}

/* ================================================================== */
/*  텍스트 유틸                                                          */
/* ================================================================== */

export const stripTail = (s: string): string =>
  s
    .replace(
      /(으로|로)?\s*(바꾸|바꿔|바꿔줘|바꿔주세요|설정|설정해|설정해줘|설정해주세요|해|해줘|해주세요|변경|변경해|변경해줘|추가|추가해|추가해줘|지우|지워|삭제|삭제해|삭제해줘|적용|적용해|수정|수정해|넣|넣어|넣어줘|빼|빼줘|빼주세요|제외|제외해|완료|해줘요)\s*$/,
      '',
    )
    .trim();

export const clean = (s: string): string =>
  s
    .replace(/^[\s"'“”‘’\-+*·:：,，.。\n]+/, '')
    .replace(/[\s"'“”‘’.,，。\n]+$/, '')
    .trim();

const NEGATIVE =
  /(?:제외|빼|뺄|뺀다|삭제|지워|안\s*함|안함|안\s*할|안\s*해|않함|않을|않아|않는|않\s*한다|없애|그만|사용\s*안|안\s*사용|안\s*수집|수집\s*안|안\s*등록|수집하지|하지\s*않|제거|말\s*고)/;

export function hasNegative(s: string) {
  return NEGATIVE.test(s);
}

/* ================================================================== */
/*  날짜 파싱                                                            */
/* ================================================================== */


export function parseKoreanDate(input: string, fallback: string): { value: string; matched: boolean } {
  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD
  const iso = /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/.exec(input);
  if (iso) {
    const [, y, m, d] = iso;
    return {
      value: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      matched: true,
    };
  }
  // YYYY년 M월 D일
  const kr = /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(input);
  if (kr) {
    const [, y, m, d] = kr;
    return {
      value: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      matched: true,
    };
  }
  // M월 D일 (현재 연도)
  const kr2 = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(input);
  if (kr2) {
    const y = new Date().getFullYear();
    return {
      value: `${y}-${kr2[1].padStart(2, '0')}-${kr2[2].padStart(2, '0')}`,
      matched: true,
    };
  }
  // 상대 표현
  const today = new Date();
  if (/(내일|모레)/.test(input)) {
    today.setDate(today.getDate() + (/내일/.test(input) ? 1 : 2));
    return { value: toISODate(today), matched: true };
  }
  if (/(오늘|지금|현재)/.test(input)) {
    return { value: toISODate(today), matched: true };
  }
  const rel = /(\d+)\s*(년|개월|달|주)\s*(뒤|후|이후|뒤에)/.exec(input);
  if (rel) {
    const n = Number(rel[1]);
    if (rel[2] === '년') return { value: addMonths(fallback, n * 12), matched: true };
    if (rel[2] === '주') {
      const d = new Date(fallback + 'T00:00:00');
      d.setDate(d.getDate() + n * 7);
      return { value: toISODate(d), matched: true };
    }
    return { value: addMonths(fallback, n), matched: true };
  }
  return { value: fallback, matched: false };
}

/* ================================================================== */
/*  값 추출                                                              */
/* ================================================================== */

export function valueAfter(input: string, synonyms: string[]): string | null {
  for (const s of synonyms) {
    const i = input.indexOf(s);
    if (i < 0) continue;
    let rest = input.slice(i + s.length);
    rest = rest.replace(/^[\s"'“”‘’]*/, '');
    rest = rest.replace(/^[:：=\-–—]+/, '');
    rest = rest.replace(/^(은|는|이|가|을|를|의|로|에게|에서|으로|라고)\s*/, '');
    rest = clean(stripTail(clean(rest)));
    if (rest.length >= 1 && rest.length <= 120) return rest;
  }
  return null;
}

export function extractEmail(input: string): string | null {
  const m = /[\w.+-]+@[\w-]+\.[\w.]+/.exec(input);
  return m ? m[0] : null;
}

export function extractPhone(input: string): string | null {
  const m = /0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4}/.exec(input);
  return m ? m[0].trim() : null;
}

/** "김보안 / a@b.com / 02-123" → { name, email, phone } */
export function splitTriplet(value: string) {
  const parts = value
    .split(/\s*\/\s*|\s*[,·]\s*/)
    .map((p) => clean(p))
    .filter(Boolean);
  const name = parts.find((p) => !extractEmail(p) && !extractPhone(p)) ?? null;
  const email = parts.map(extractEmail).find(Boolean) ?? null;
  const phone = parts.map(extractPhone).find(Boolean) ?? null;
  return { name, email, phone, parts };
}

/* ================================================================== */
/*  개인정보 항목 매칭                                                     */
/* ================================================================== */

/** 사용자 표현(구어) → PII catalog id */
export const PII_KEYWORDS: { id: string; words: string[] }[] = [
  { id: 'name', words: ['성명', '이름', '이름'] },
  { id: 'rrn', words: ['주민등록번호', '주민번호', '생년월일'] },
  { id: 'passport', words: ['여권'] },
  { id: 'alien_no', words: ['외국인등록번호'] },
  { id: 'driver_license', words: ['운전면허'] },
  { id: 'ci', words: ['본인확인값', 'CI', 'ci'] },
  { id: 'di', words: ['DI', 'di'] },
  { id: 'mobile', words: ['휴대전화', '휴대폰', '전화번호', '핸드폰', '휴대전화번호', 'hp'] },
  { id: 'tel', words: ['집 전화', '집전화'] },
  { id: 'email', words: ['이메일', '메일 주소', '메일'] },
  { id: 'fax', words: ['팩스'] },
  { id: 'card', words: ['카드', '신용카드', '체크카드'] },
  { id: 'bank_account', words: ['계좌', '은행계좌'] },
  { id: 'address', words: ['주소', '배송지', '상세주소'] },
  { id: 'office_address', words: ['사업장 주소', '회사 주소', '본사 주소'] },
  { id: 'birth', words: ['생일', '생년'] },
  { id: 'gender', words: ['성별'] },
  { id: 'job', words: ['직업', '소속'] },
  { id: 'education', words: ['학력', '학교'] },
  { id: 'health', words: ['건강', '질병', '병력'] },
  { id: 'medical_history', words: ['진료 이력', '처치 내역'] },
  { id: 'biometric', words: ['생체', '지문', '얼굴 인식', '홍채'] },
  { id: 'belief', words: ['종교', '신앙'] },
  { id: 'political', words: ['정치적', '정당'] },
  { id: 'location', words: ['위치정보', '위치 정보', 'GPS', 'gps', 'LBS'] },
  { id: 'ip', words: ['IP 주소', 'IP주소', 'ip 주소'] },
  { id: 'cookie', words: ['쿠키'] },
  { id: 'device', words: ['기기 정보', '단말 정보'] },
  { id: 'ad_id', words: ['광고 식별자', 'ADID', 'adid'] },
  { id: 'usage_log', words: ['이용기록', '접속 기록', '로그', '사용 이력'] },
  { id: 'marketing_consent', words: ['마케팅 수신', '광고 수신', '수신동의'] },
  { id: 'company', words: ['회사명 정보', '부서명'] },
  { id: 'business_no', words: ['사업자등록번호', '사업자 번호'] },
  { id: 'contract', words: ['계약 내역', '거래 내역'] },
  { id: 'cs_record', words: ['상담 기록', '문의 기록'] },
  { id: 'employment', words: ['재직 정보', '고용 정보'] },
  { id: 'salary', words: ['임금', '급여'] },
  { id: 'attendance', words: ['근태', '출결'] },
  { id: 'insurance', words: ['건강보험'] },
  { id: 'upload_content', words: ['게시물', '업로드'] },
  { id: 'request_history', words: ['장바구니', '주문 이력'] },
  { id: 'parent_contact', words: ['보호자 연락처', '법정대리인'] },
];

export const SAFEGUARD_KEYWORDS: { id: string; words: string[] }[] = [
  { id: 'access_control', words: ['접근권한', '권한 관리', '최소권한'] },
  { id: 'auth_strong', words: ['다중요소', 'MFA', 'mfa', '2단계 인증'] },
  { id: 'enc_db', words: ['암호화', 'AES', 'aes'] },
  { id: 'enc_transit', words: ['TLS', 'tls', 'SSL', '전송 구간'] },
  { id: 'masking', words: ['마스킹', '비노출'] },
  { id: 'log_retention', words: ['접속기록 보관', '로그 보관'] },
  { id: 'antivirus', words: ['백신', '바이러스'] },
  { id: 'patch', words: ['패치', '취약점'] },
  { id: 'ips_waf', words: ['방화벽', 'WAF', 'waf', 'IPS'] },
  { id: 'dlp', words: ['유출방지', 'DLP', 'dlp'] },
  { id: 'backup', words: ['백업'] },
  { id: 'monitoring', words: ['모니터링', '이상 접근'] },
  { id: 'pi_impact', words: ['영향평가', 'PIA'] },
  { id: 'policy', words: ['내부관리계획', '보호방침 수립'] },
  { id: 'cpo', words: ['보호책임자 지정', 'CPO 지정'] },
  { id: 'contract', words: ['처리위탁 계약', '위탁 계약'] },
  { id: 'supervisor', words: ['수시 감독'] },
  { id: 'training', words: ['교육'] },
  { id: 'pledge', words: ['서약서', '비밀유지 서약'] },
  { id: 'list_management', words: ['처리대장', '현황 관리'] },
  { id: 'consent_mgmt', words: ['동의 관리', '동의 철회'] },
  { id: 'regular_check', words: ['정기 점검', '연간 점검'] },
  { id: 'incident_plan', words: ['사고 대응 계획', '유출 대응 계획'] },
  { id: 'server_room', words: ['전산실', '출입통제'] },
  { id: 'doc_cabinet', words: ['서류보관실'] },
  { id: 'disposal_bin', words: ['폐기물', '파쇄'] },
  { id: 'workstation', words: ['단말기 보안', '도난 방지'] },
];

export function matchCatalog(input: string, table: { id: string; words: string[] }[]): string[] {
  const hits: string[] = [];
  for (const entry of table) {
    if (entry.words.some((w) => input.includes(w)) && !hits.includes(entry.id)) {
      hits.push(entry.id);
    }
  }
  // 카탈로그 라벨 자체도 매칭
  for (const item of [...PII_CATALOG, ...SAFEGUARD_CATALOG]) {
    const label = item.label.replace(/[·()/]/g, '').replace(/\s+/g, '');
    if (label.length >= 3 && input.replace(/[·()/]/g, '').replace(/\s+/g, '').includes(label)) {
      if (!hits.includes(item.id)) hits.push(item.id);
    }
  }
  return hits;
}

export function labelOf(id: string): string {
  return (
    PII_CATALOG.find((p) => p.id === id)?.label ??
    SAFEGUARD_CATALOG.find((s) => s.id === id)?.label ??
    id
  );
}

/* ================================================================== */
/*  템플릿 전환                                                           */
/* ================================================================== */

const TEMPLATE_WORDS: { id: TemplateId; words: string[]; title: string }[] = [
  { id: 'privacy-policy', words: ['처리방침', '개인정보 처리방침', 'privacy'], title: '개인정보 처리방침' },
  { id: 'internal-plan', words: ['내부관리계획서', '내부관리계획', '내부 계획'], title: '개인정보 내부관리계획서' },
  { id: 'security-guideline', words: ['보호지침', '임직원 지침', '사내 지침', '보안 지침'], title: '임직원 개인정보 보호지침' },
  { id: 'outsource-agreement', words: ['위탁 계약서', '처리위탁 계약', '계약서'], title: '개인정보 처리위탁 계약서' },
  { id: 'breach-manual', words: ['유출 매뉴얼', '사고 대응', '대응 매뉴얼', '유출 사고'], title: '개인정보 유출 사고 대응 매뉴얼' },
];

export { TEMPLATE_WORDS };