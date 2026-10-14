import { PII_MAP, SAFEGUARD_MAP } from './catalog';
import { isWritablePath } from './state';
import type {
  AuditReport,
  ChecklistItem,
  ChecklistResult,
  DocState,
  PiiItem,
  Safeguard,
} from './types';

/* ================================================================== */
/*  컴플라이언스 점검 항목                                                 */
/*  개인정보 처리방침 14가지 법정 기재 항목 + 안전성 확보조치 + 운영 항목      */
/* ================================================================== */

const has = (state: DocState, path: string) => {
  const v = path.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
    return undefined;
  }, state);
  return typeof v === 'string' ? v.trim().length > 0 : Boolean(v);
};

const sgIncluded = (state: DocState, ...ids: string[]) =>
  ids.every((id) => state.processing.safeguardIds.includes(id));

const sensitiveInUse = (state: DocState) =>
  state.processing.piiIds.some((id) => PII_MAP[id]?.sensitive);

export const CHECKLIST: ChecklistItem[] = [
  /* ── 법정 기재 항목 (법 제30조 기준) ───────────────────────── */
  {
    id: 'policy_org',
    label: '처리자 정보(법인명, 사업자번호, 주소, 연락처)가 기재되어 있다',
    ref: '법 제30조 제1항',
    category: '법정기재',
    auto: (s) => has(s, 'org.name') && has(s, 'org.address') && has(s, 'org.cpo.email'),
    hint: '대시보드 > 법인 정보에서 회사명, 주소, CPO 이메일을 입력하세요.',
  },
  {
    id: 'policy_purpose',
    label: '개인정보 처리 목적이 구체적으로 기재되어 있다',
    ref: '법 제30조 제1항 제1호',
    category: '법정기재',
    auto: (s) => s.processing.purposes.length >= 2,
  },
  {
    id: 'policy_items',
    label: '처리하는 개인정보의 항목이 1개 이상 기재되어 있다',
    ref: '법 제30조 제1항 제2호',
    category: '법정기재',
    auto: (s) => s.processing.piiIds.length >= 1,
  },
  {
    id: 'policy_basis',
    label: '수집 및 이용의 법적 근거가 기재되어 있다',
    ref: '법 제22조',
    category: '법정기재',
    auto: (s) => s.processing.legalBasis.length >= 1,
  },
  {
    id: 'policy_period',
    label: '보유 및 이용 기간이 항목별로 기재되어 있다',
    ref: '법 제30조 제1항 제3호',
    category: '법정기재',
    auto: (s) => s.processing.retentionRules.length >= 2 && s.processing.retentionRules.every((r) => r.period.trim()),
  },
  {
    id: 'policy_destruction',
    label: '개인정보 파기 절차 및 방법이 기재되어 있다',
    ref: '법 제30조 제1항 제4호',
    category: '법정기재',
    auto: (s) => s.processing.destructionMethod.trim().length >= 20,
  },
  {
    id: 'policy_thirdparty',
    label: '제3자 제공 대상, 목적, 항목, 방법 및 동의 근거가 기재되어 있다',
    ref: '법 제30조 제1항 제5호',
    category: '법정기재',
    auto: (s) =>
      s.processing.thirdParties.length === 0 ||
      s.processing.thirdParties.every((t) => t.entity && t.purpose && t.items && t.method && t.legalBasis),
  },
  {
    id: 'policy_entrusted',
    label: '처리 위탁 대상, 목적, 항목, 기간 및 수탁자 관리 조치가 기재되어 있다',
    ref: '법 제30조 제1항 제5호',
    category: '법정기재',
    auto: (s) =>
      s.processing.entrusted.length === 0 ||
      s.processing.entrusted.every((e) => e.entity && e.purpose && e.items && e.period),
  },
  {
    id: 'policy_overseas',
    label: '국외이전 국가, 수신자, 항목, 방법 및 동의 절차가 기재되어 있다',
    ref: '법 제30조 제1항 제6호',
    category: '법정기재',
    auto: (s) =>
      s.processing.overseas.length === 0 ||
      s.processing.overseas.every((o) => o.country && o.entity && o.items && o.method && o.consentProcess),
  },
  {
    id: 'policy_sensitive',
    label: '민감정보 처리 시 별도 동의 및 안전성 확보방안 대응이 되어 있다',
    ref: '법 제23조',
    category: '법정기재',
    auto: (s) => !sensitiveInUse(s) || s.processing.safeguardIds.includes('access_control'),
    hint: '민감정보를 수집하는 경우 접근권한 통제와 암호화가 반드시 필요합니다.',
  },
  {
    id: 'policy_automated',
    label: '자동화된 결정 및 프로파일링 관련 내용이 기재되어 있다',
    ref: '법 제34조',
    category: '법정기재',
    auto: (s) => s.processing.automatedDecision.trim().length >= 20,
  },
  {
    id: 'policy_cpo',
    label: '개인정보 보호책임자의 성명, 직책, 연락처가 기재되어 있다',
    ref: '법 제39조',
    category: '법정기재',
    auto: (s) => has(s, 'org.cpo.name') && has(s, 'org.cpo.title') && has(s, 'org.cpo.phone'),
  },
  {
    id: 'policy_designated',
    label: '선정업무 담당자(국외이전 담당)가 지정되어 있다',
    ref: '법 제39조 제2항',
    category: '법정기재',
    auto: (s) => has(s, 'org.officer.name') && has(s, 'org.officer.email'),
  },
  {
    id: 'policy_value',
    label: '위탁 및 제3자 제공 시 대가 검증 절차가 정의되어 있다',
    ref: '법 제25조 · 제26조',
    category: '법정기재',
    auto: (s) => s.processing.valueVerificationPolicy.trim().length >= 20,
  },

  /* ── 기술적 보호조치 ────────────────────────────────────────── */
  {
    id: 'tech_access',
    label: '접근권한 최소화 및 차등 부여가 적용되어 있다',
    ref: '안전성확보조치기준 제3조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'access_control'),
  },
  {
    id: 'tech_enc',
    label: '고유식별정보 암호화(AES-256 이상) 및 TLS 전송이 적용되어 있다',
    ref: '안전성확보조치기준 제3조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'enc_db') && sgIncluded(s, 'enc_transit'),
  },
  {
    id: 'tech_log',
    label: '접속기록 1년 이상 보관 및 위변표 방지가 적용되어 있다',
    ref: '안전성확보조치기준 제3조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'log_retention'),
  },
  {
    id: 'tech_backup',
    label: '백업 및 복구 절차가 수립되어 있다',
    ref: '안전성확보조치기준 제3조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'backup'),
  },
  {
    id: 'tech_dlp',
    label: '개인정보 반출 통제 또는 유출방지 조치가 적용되어 있다',
    ref: '안전성확보조치기준 제3조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'dlp') || sgIncluded(s, 'monitoring'),
  },

  /* ── 관리적 보호조치 ────────────────────────────────────────── */
  {
    id: 'admin_plan',
    label: '내부관리계획서가 수립되고 CPO 승인이 되어 있다',
    ref: '법 제29조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'policy') && sgIncluded(s, 'cpo'),
  },
  {
    id: 'admin_training',
    label: '임직원 개인정보보호 교육 및 비밀유지 서약이 정의되어 있다',
    ref: '안전성확보조치기준 제5조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'training') && s.processing.trainingPolicy.trim().length >= 10,
  },
  {
    id: 'admin_contract',
    label: '처리위탁 계약 및 제3자 제공 계약이 체결되고 있다',
    ref: '법 제22조 · 제26조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'contract'),
  },
  {
    id: 'admin_inspection',
    label: '정기 점검 주기와 점검 항목이 정의되어 있다',
    ref: '안전성확보조치기준 제6조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'regular_check') && s.processing.inspectionCycle.trim().length >= 5,
  },
  {
    id: 'admin_consent',
    label: '동의 관리 및 철회 절차가 운영되고 있다',
    ref: '법 제15조 · 제22조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'consent_mgmt'),
  },

  /* ── 물리적 보호조치 ────────────────────────────────────────── */
  {
    id: 'phys_server',
    label: '전산실 출입통제 및 잠금장치가 적용되어 있다',
    ref: '안전성확보조치기준 제7조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'server_room'),
  },
  {
    id: 'phys_doc',
    label: '서류보관실 및 폐기물 관리 절차가 수립되어 있다',
    ref: '안전성확보조치기준 제7조',
    category: '보호조치',
    auto: (s) => sgIncluded(s, 'doc_cabinet') || sgIncluded(s, 'disposal_bin'),
  },

  /* ── 운영 ──────────────────────────────────────────────────── */
  {
    id: 'ops_incident',
    label: '유출 사고 대응 계획 및 신고 절차가 수립되어 있다',
    ref: '법 제34조',
    category: '운영',
    auto: (s) => sgIncluded(s, 'incident_plan') && s.processing.internalReporting.trim().length >= 10,
  },
  {
    id: 'ops_review',
    label: '차기 점검일 및 문서 버전 관리가 설정되어 있다',
    ref: '법 제29조',
    category: '운영',
    auto: (s) => has(s, 'org.nextReview') && has(s, 'org.version'),
  },
  {
    id: 'ops_review_due',
    label: '차기 검토일이 12개월 이내로 설정되어 있다',
    ref: '내부관리계획 수립 기준',
    category: '운영',
    auto: (s) => {
      if (!has(s, 'org.nextReview')) return false;
      const next = new Date(s.org.nextReview + 'T00:00:00');
      if (Number.isNaN(next.getTime())) return false;
      const diffDays = (next.getTime() - Date.now()) / 86_400_000;
      return diffDays > -1 && diffDays <= 400;
    },
    hint: '법 제29장에 따라 최소 연 1회 계획을 재검토해야 합니다.',
  },
];

/* ================================================================== */
/*  감사 리포트 산정                                                      */
/* ================================================================== */

export function runAudit(state: DocState, pii: PiiItem[], safeguards: Safeguard[]): AuditReport {
  const results: ChecklistResult[] = CHECKLIST.map((item) => ({
    ...item,
    autoChecked: true,
    passed: item.auto ? item.auto(state, pii, safeguards) : true,
  }));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  const gaps: AuditReport['gaps'] = results
    .filter((r) => !r.passed)
    .map((r) => ({
      severity: r.category === '법정기재' ? 'high' : r.category === '보호조치' ? 'medium' : 'low',
      title: r.label,
      detail: `${r.ref}${r.hint ? ` — ${r.hint}` : ''}`,
    }));

  return {
    score,
    grade: score >= 95 ? 'S' : score >= 85 ? 'A' : score >= 70 ? 'B' : 'C',
    passed,
    total,
    results,
    gaps,
  };
}

/* ================================================================== */
/*  편집 가능 필드 목록 (채팅 엔진 프롬프트에서 사용)                        */
/* ================================================================== */

export const EDITABLE_FIELD_LABELS: { path: string; label: string }[] = [
  { path: 'org.name', label: '법인명' },
  { path: 'org.bizNumber', label: '사업자등록번호' },
  { path: 'org.ceo', label: '대표이사' },
  { path: 'org.employeeCount', label: '임직원 수' },
  { path: 'org.homepage', label: '홈페이지' },
  { path: 'org.address', label: '본사 소재지' },
  { path: 'org.docNumber', label: '문서 관리번호' },
  { path: 'org.version', label: '문서 버전' },
  { path: 'org.effectiveDate', label: '시행일자' },
  { path: 'org.lastRevised', label: '최종 개정일' },
  { path: 'org.nextReview', label: '차기 검토일' },
  { path: 'org.approvalBody', label: '승인 기구' },
  { path: 'org.masterDataCenter', label: '데이터 보관 위치' },
  { path: 'org.cpo.name', label: '보호책임자 성명' },
  { path: 'org.cpo.title', label: '보호책임자 직책' },
  { path: 'org.cpo.email', label: '보호책임자 이메일' },
  { path: 'org.cpo.phone', label: '보호책임자 전화' },
  { path: 'org.cpo.dept', label: '보호책임자 소속' },
  { path: 'org.officer.name', label: '선정업무 담당자 성명' },
  { path: 'org.officer.title', label: '선정업무 담당자 직책' },
  { path: 'org.officer.email', label: '선정업무 담당자 이메일' },
  { path: 'org.officer.phone', label: '선정업무 담당자 전화' },
  { path: 'processing.automatedDecision', label: '자동화된 결정 관련 문구' },
  { path: 'processing.valueVerificationPolicy', label: '위탁·제공 대가 검증 절차' },
  { path: 'processing.destructionMethod', label: '개인정보 파기 방법' },
  { path: 'processing.inspectionCycle', label: '정기 점검 주기' },
  { path: 'processing.logRetention', label: '접속기록 보관 기간' },
  { path: 'processing.irTeam', label: '비상대책반 구성' },
  { path: 'processing.entrustedAuditCycle', label: '수탁자 실태조사 주기' },
  { path: 'processing.trainingPolicy', label: '교육 및 서약 정책' },
  { path: 'processing.internalReporting', label: '내부 신고 절차' },
];

export function editablePaths(): string[] {
  return EDITABLE_FIELD_LABELS.map((f) => f.path).filter(isWritablePath);
}

export function labelsForPiiIds(ids: string[]): string[] {
  return ids.map((id) => PII_MAP[id]?.label ?? id);
}

export function labelsForSafeguardIds(ids: string[]): string[] {
  return ids.map((id) => SAFEGUARD_MAP[id]?.label ?? id);
}