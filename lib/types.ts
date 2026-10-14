/**
 * ComplianceShield AI — 도메인 타입 정의
 * 개인정보보호법(법 제30조/제29조/제28조/제26조/제34조) 및
 * 「개인정보의 안전성 확보조치 기준」에 근거한 데이터 모델입니다.
 */

export type TemplateId =
  | 'privacy-policy'
  | 'internal-plan'
  | 'security-guideline'
  | 'outsource-agreement'
  | 'breach-manual';

export type IndustryKey =
  | 'generic'
  | 'ecommerce'
  | 'it-saas'
  | 'healthcare'
  | 'education'
  | 'finance'
  | 'logistics'
  | 'manufacturing'
  | 'marketing'
  | 'media';

/* ------------------------------------------------------------------ */
/*  조직 / 기안 정보                                                     */
/* ------------------------------------------------------------------ */

export interface Officer {
  name: string;
  title: string;
  email: string;
  phone: string;
  dept?: string;
}

export interface OrgInfo {
  /** 법인명 / 기관명 */
  name: string;
  bizNumber: string;
  ceo: string;
  industry: IndustryKey;
  employeeCount: string;
  homepage: string;
  address: string;
  /** 개인정보 보호책임자 (법 제39조) */
  cpo: Officer;
  /** 개인정보 취급자 담당 부서장 (권장 지정) */
  officer: Officer;
  /** 문서 관리번호 */
  docNumber: string;
  version: string;
  effectiveDate: string;
  lastRevised: string;
  nextReview: string;
  approvalBody: string;
  masterDataCenter: string;
}

/* ------------------------------------------------------------------ */
/*  개인정보 처리 현황                                                    */
/* ------------------------------------------------------------------ */

export interface PiiItem {
  id: string;
  label: string;
  /** 법 제22조상 민감정보(민감 개인정보) 여부 */
  sensitive?: boolean;
  /** 자동수집(쿠키/로그) 여부 */
  autoCollected?: boolean;
  category: string;
}

export interface RetentionRule {
  id: string;
  item: string;
  period: string;
  basis: string;
}

export interface ThirdPartyDisclosure {
  id: string;
  entity: string;
  purpose: string;
  items: string;
  method: string;
  legalBasis: string;
  /** 대가 검증 절차(법 제25조·제26조) 서술 */
  valueVerification: string;
}

export interface EntrustedProcessing {
  id: string;
  entity: string;
  purpose: string;
  items: string;
  period: string;
  legalBasis: string;
  supervision: string;
}

export interface OverseasTransfer {
  id: string;
  country: string;
  entity: string;
  items: string;
  purpose: string;
  method: string;
  legalBasis: string;
  /** 정보주체의 동의 절차 및 「个人信息 국외이전 안내서」 배포 여부 */
  consentProcess: string;
}

export interface Safeguard {
  id: string;
  label: string;
  category: '기술적' | '관리적' | '물리적';
  legalRef: string;
}

export interface ProcessingInfo {
  services: string[];
  purposes: string[];
  legalBasis: string[];
  piiIds: string[];
  retentionRules: RetentionRule[];
  thirdParties: ThirdPartyDisclosure[];
  entrusted: EntrustedProcessing[];
  overseas: OverseasTransfer[];
  safeguardIds: string[];
  /** 자동화된 결정(제34조) 적용 여부 및 내용 */
  automatedDecision: string;
  /** 위탁·제3자 제공 대가 검증 절차 총괄 문언 */
  valueVerificationPolicy: string;
  /** 파기 방법 상세 */
  destructionMethod: string;
  /** 내부관리계획/보호지침용: 정기 점검 주기 */
  inspectionCycle: string;
  /** 내부관리계획용: 접속기록 보관 기간 */
  logRetention: string;
  /** 사고 대응 조직 */
  irTeam: string;
  /** 위탁자 교육/감사 주기 */
  entrustedAuditCycle: string;
  /** 임직원 보안 서약 및 교육 체계 */
  trainingPolicy: string;
  /** 내부신고/제기制度 */
  internalReporting: string;
}

/* ------------------------------------------------------------------ */
/*  문서 전체 상태 (단일 source of truth)                                  */
/* ------------------------------------------------------------------ */

export interface DocState {
  org: OrgInfo;
  processing: ProcessingInfo;
}

/* ------------------------------------------------------------------ */
/*  렌더링 블록 모델 — 미리보기 / DOCX / Markdown / 인쇄가 모두 공유       */
/* ------------------------------------------------------------------ */

export type Block =
  | { kind: 'title'; text: string; subtitle?: string }
  | { kind: 'meta'; rows: [string, string][] }
  | { kind: 'heading'; level: 1 | 2 | 3; num?: string; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered?: boolean; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][]; widths?: number[] }
  | { kind: 'note'; tone: 'info' | 'warn' | 'danger'; title?: string; text: string }
  | { kind: 'signature'; roles: string[] }
  | { kind: 'appendix'; title: string; blocks: Block[] }
  | { kind: 'divider' }
  | { kind: 'pagebreak' };

export interface RenderedDoc {
  templateId: TemplateId;
  blocks: Block[];
  plainText: string;
  markdown: string;
  /** 임시저장용 파일명 (확장자 제외) */
  fileSlug: string;
  /** 화면 미리보기용 한 줄 요약 */
  wordCount: number;
}

/* ------------------------------------------------------------------ */
/*  대화형 편집                                                          */
/* ------------------------------------------------------------------ */

export type PatchOp =
  | { op: 'setField'; path: string; value: unknown }
  | { op: 'addPii'; id: string }
  | { op: 'removePii'; id: string }
  | { op: 'addPurpose'; value: string }
  | { op: 'addSafeguard'; id: string }
  | { op: 'removeSafeguard'; id: string }
  | { op: 'addService'; value: string }
  | { op: 'addRetentionRule'; value: RetentionRule }
  | { op: 'addThirdParty'; value: ThirdPartyDisclosure }
  | { op: 'addEntrusted'; value: EntrustedProcessing }
  | { op: 'addOverseas'; value: OverseasTransfer }
  | { op: 'switchTemplate'; id: TemplateId };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  at: number;
  /** 이 메시지로 실제 적용된 변경 요약 (assistant 메시지용) */
  applied?: string[];
  /** 적용 실패/무시된 조작 */
  skipped?: string[];
  pending?: boolean;
  failed?: boolean;
}

/* ------------------------------------------------------------------ */
/*  보관함 / 버전 이력                                                   */
/* ------------------------------------------------------------------ */

export interface SavedDoc {
  id: string;
  templateId: TemplateId;
  title: string;
  version: string;
  updatedAt: number;
  createdAt: number;
  state: DocState;
  plainText: string;
  /** 자동 저장 스냅샷인지, 사용자가 명시적으로 저장했는지 */
  pinned: boolean;
  author?: string;
}

/* ------------------------------------------------------------------ */
/*  감사 / 점검                                                          */
/* ------------------------------------------------------------------ */

export interface ChecklistItem {
  id: string;
  label: string;
  ref: string;
  category: '법정기재' | '보호조치' | '운영';
  /** 자동 판정 가능 여부 */
  auto?: (state: DocState, pii: PiiItem[], safeguards: Safeguard[]) => boolean;
  hint?: string;
}

export interface ChecklistResult extends ChecklistItem {
  autoChecked: boolean;
  passed: boolean;
}

export interface AuditReport {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C';
  passed: number;
  total: number;
  results: ChecklistResult[];
  gaps: { severity: 'high' | 'medium' | 'low'; title: string; detail: string }[];
}