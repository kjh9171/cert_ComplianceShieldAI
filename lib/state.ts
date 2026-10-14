import { INDUSTRY_PRESETS, PII_MAP, SAFEGUARD_MAP } from './catalog';
import type {
  DocState,
  EntrustedProcessing,
  IndustryKey,
  OverseasTransfer,
  PatchOp,
  RetentionRule,
  ThirdPartyDisclosure,
} from './types';

export const uid = (prefix = 'id'): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* ------------------------------------------------------------------ */
/*  날짜 유틸 (서버/클라 공용 — 시간대 의존 없음)                          */
/* ------------------------------------------------------------------ */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

export function formatKoreanDate(iso: string): string {
  if (!iso) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일`;
}

export function formatKoreanDateTime(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ------------------------------------------------------------------ */
/*  기본 상태 생성                                                        */
/* ------------------------------------------------------------------ */

export function createDefaultState(industry: IndustryKey = 'generic'): DocState {
  const preset = INDUSTRY_PRESETS[industry] ?? INDUSTRY_PRESETS.generic;
  const today = toISODate(new Date());
  const nextYear = addMonths(today, 12);

  const entrusted: EntrustedProcessing[] = preset.entrustedSeed.map((e) => ({
    id: uid('en'),
    entity: e.entity,
    purpose: e.purpose,
    items: e.items,
    period: e.period,
    legalBasis: '정보주체의 동의를 기준으로 수탁 계약을 체결한다.',
    supervision: '수탁자는 월 1회 접근기록을 회사에 제출하고, 회사는 연 1회 수탁자를 대상으로 실태조사를 실시한다.',
  }));

  const thirdParties: ThirdPartyDisclosure[] = preset.thirdPartySeed.map((t) => ({
    id: uid('tp'),
    entity: t.entity,
    purpose: t.purpose,
    items: t.items,
    method: t.method,
    legalBasis: '정보주체의 동의를 기준으로 제3자 제공에 동의받는다.',
    valueVerification:
      '제공 대상 · 목적 · 항목이 위탁 계약 또는 제공 동의서와 일치하는지 확인하고, 계약 외 항목이 포함되지 않도록 관리한다.',
  }));

  const overseas: OverseasTransfer[] = (preset.overseasSeed ?? []).map((o) => ({
    id: uid('os'),
    country: o.country,
    entity: o.entity,
    items: o.items,
    purpose: o.purpose,
    method: o.method,
    legalBasis: '정보주체의 별도 동의를 기준으로 국외이전한다.',
    consentProcess:
      '가입·결제 시 「개인정보의 국외이전 안내서」를 고지하고 별도의 동의를 받으며, 동의 거부 시 국내 처리로 대체 운영한다.',
  }));

  const retentionRules: RetentionRule[] = [
    {
      id: uid('rt'),
      item: '회원 식별정보 (성명, 연락처)',
      period: '회원 탈퇴 시 지체 없이 파기',
      basis: '회원탈퇴 일',
    },
    {
      id: uid('rt'),
      item: '계약·거래 내역',
      period: '계약 종료 후 5년',
      basis: '전자상거래법 제10조 (전자문서 및 거래자료 보관)',
    },
    {
      id: uid('rt'),
      item: '접속·이용기록 (로그)',
      period: '수집 후 1년 이상',
      basis: '개인정보의 안전성 확보조치 기준 제3조',
    },
    {
      id: uid('rt'),
      item: '대화형 상담 기록',
      period: '상담 종료 후 3년',
      basis: '소비자보호법상 증빙 확보 목적',
    },
  ];

  return {
    org: {
      name: '주식회사 컴플라이언스실드',
      bizNumber: '120-88-01234',
      ceo: '홍길동',
      industry,
      employeeCount: '51~100명',
      homepage: 'https://www.example.com',
      address: '서울특별시 강남구 테헤란로 000, 00층',
      cpo: {
        name: '김보안',
        title: '최고개인정보보호책임자 (CPO)',
        email: 'privacy@example.com',
        phone: '02-000-0000',
        dept: '정보화안전팀',
      },
      officer: {
        name: '박관리',
        title: '개인정보 취급 업무 담당 부서장',
        email: 'privacy-manager@example.com',
        phone: '02-000-0001',
        dept: '고객경험본부',
      },
      docNumber: 'CO-2026-001',
      version: 'v1.0',
      effectiveDate: today,
      lastRevised: today,
      nextReview: nextYear,
      approvalBody: '대표이사',
      masterDataCenter: '국내 (서울) 데이터센터',
    },
    processing: {
      services: [...preset.services],
      purposes: [...preset.purposes],
      legalBasis: [
        '정보주체의 동의 (법 제22조 제1항 제1호)',
        '계약의 이행 및 계약관리 (법 제22조 제1항 제2호)',
        '법률상 의무이행 (법 제22조 제1항 제3호)',
      ],
      piiIds: [...preset.defaultPiiIds],
      retentionRules,
      thirdParties,
      entrusted,
      overseas,
      safeguardIds: [...preset.defaultSafeguardIds],
      automatedDecision:
        '당사는 개인정보를 자동으로 분석하여 회원에게 개인화 콘텐츠나 상품·서비스를 추천할 수 있습니다. 자동화된 결정에 따라 중요한 결정(이용 제한, 계약 해지 등)을 하는 경우에는 정보주체의 동의 및 별도의 검토 절차를 거칩니다.',
      valueVerificationPolicy:
        '당사는 「개인정보 보호법」 제25조 및 제26조에 따라 제3자 제공 또는 처리 위탁 시 대가를 검증합니다. 제공·위탁 대상, 제공 목적, 제공 항목이 계약서 및 동의 내용과 일치하는지 내부에서 검증한 후 이사회 또는 CPO 승인 절차를 거칩니다.',
      destructionMethod:
        '전자적 파일 형태의 개인정보는 복구할 수 없는 기술적 방법(보안 알고리즘 적용, 논리적 소거 및 물리적 매체 파기)을 사용하여 파기하며, 종이 문서에 출력된 개인정보는 분쇄 또는 소각하여 처리한다.',
      inspectionCycle: '연 1회 (매년 12월 정기 점검, CPO가 주도로 하는 검토회의)',
      logRetention: '1년 이상 (접속·관리 행위 로그, 위·변조 방지)',
      irTeam: '개인정보보호 조직 (CPO, 정보화책임자, 보안관리자, 법무담당자, 총무담당자)',
      entrustedAuditCycle: '연 1회 수탁자 실태조사 및 분기 1회 접근기록 점검',
      trainingPolicy:
        '전 임직원은 입사 시 및 연 1회 이상 개인정보보호 교육을 이수해야 하며, 개인정보 취급자는 추가로 비밀유지 서약서를 서명·제출한다. 교육 이수율은 인사 평가에 반영한다.',
      internalReporting:
        '임직원은 개인정보 유출 의심 사유를 발견한 경우 즉시 CPO에게 보고해야 하며, CPO는 접수 사실을 보고를 받은 즉시 지체 없이 기록하고 비상대책반을 소집한다.',
    },
  };
}

/* ------------------------------------------------------------------ */
/*  업종 프리셋 재적용 (기존 데이터 보존하며 업종 특성 반영)                  */
/* ------------------------------------------------------------------ */

export function applyIndustryPreset(state: DocState, industry: IndustryKey): DocState {
  const preset = INDUSTRY_PRESETS[industry] ?? INDUSTRY_PRESETS.generic;
  const next = structuredClone(state) as DocState;
  next.org.industry = industry;

  // 업종 특화 항목은 추가하되, 이미 선택된 항목은 유지 (사용자 입력 보존)
  next.processing.piiIds = Array.from(new Set([...next.processing.piiIds, ...preset.defaultPiiIds]));
  next.processing.safeguardIds = Array.from(
    new Set([...next.processing.safeguardIds, ...preset.defaultSafeguardIds]),
  );

  // 서비스/목적: 업종 프리셋을 앞에 두고 중복 제거
  next.processing.services = Array.from(new Set([...preset.services, ...next.processing.services]));
  next.processing.purposes = Array.from(new Set([...preset.purposes, ...next.processing.purposes]));

  // 위탁·제공 항목이 비어 있을 때만 시드 데이터를 채운다
  if (next.processing.entrusted.length === 0) {
    next.processing.entrusted = preset.entrustedSeed.map((e) => ({
      id: uid('en'),
      entity: e.entity,
      purpose: e.purpose,
      items: e.items,
      period: e.period,
      legalBasis: '정보주체의 동의를 기준으로 수탁 계약을 체결한다.',
      supervision:
        '수탁자는 월 1회 접근기록을 회사에 제출하고, 회사는 연 1회 수탁자를 대상으로 실태조사를 실시한다.',
    }));
  }
  if (next.processing.thirdParties.length === 0) {
    next.processing.thirdParties = preset.thirdPartySeed.map((t) => ({
      id: uid('tp'),
      entity: t.entity,
      purpose: t.purpose,
      items: t.items,
      method: t.method,
      legalBasis: '정보주체의 동의를 기준으로 제3자 제공에 동의받는다.',
      valueVerification:
        '제공 대상 · 목적 · 항목이 위탁 계약 또는 제공 동의서와 일치하는지 확인하고, 계약 외 항목이 포함되지 않도록 관리한다.',
    }));
  }
  if (next.processing.overseas.length === 0 && preset.overseasSeed) {
    next.processing.overseas = preset.overseasSeed.map((o) => ({
      id: uid('os'),
      country: o.country,
      entity: o.entity,
      items: o.items,
      purpose: o.purpose,
      method: o.method,
      legalBasis: '정보주체의 별도 동의를 기준으로 국외이전한다.',
      consentProcess:
        '가입·결제 시 「개인정보의 국외이전 안내서」를 고지하고 별도의 동의를 받으며, 동의 거부 시 국내 처리로 대체 운영한다.',
    }));
  }

  return next;
}

/* ------------------------------------------------------------------ */
/*  필드 경로 읽기/쓰기                                                   */
/* ------------------------------------------------------------------ */

const WRITEABLE_PATHS = new Set([
  'org.name',
  'org.bizNumber',
  'org.ceo',
  'org.employeeCount',
  'org.homepage',
  'org.address',
  'org.industry',
  'org.docNumber',
  'org.version',
  'org.effectiveDate',
  'org.lastRevised',
  'org.nextReview',
  'org.approvalBody',
  'org.masterDataCenter',
  'org.cpo.name',
  'org.cpo.title',
  'org.cpo.email',
  'org.cpo.phone',
  'org.cpo.dept',
  'org.officer.name',
  'org.officer.title',
  'org.officer.email',
  'org.officer.phone',
  'org.officer.dept',
  'processing.automatedDecision',
  'processing.valueVerificationPolicy',
  'processing.destructionMethod',
  'processing.inspectionCycle',
  'processing.logRetention',
  'processing.irTeam',
  'processing.entrustedAuditCycle',
  'processing.trainingPolicy',
  'processing.internalReporting',
]);

export function getField(state: DocState, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, state);
}

export function isWritablePath(path: string): boolean {
  return WRITEABLE_PATHS.has(path);
}

export function setField(state: DocState, path: string, value: unknown): DocState {
  if (!isWritablePath(path)) return state;
  const next = structuredClone(state) as DocState;
  const keys = path.split('.');
  let cursor = next as unknown as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    cursor = cursor[keys[i]] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
  return next;
}

/* ------------------------------------------------------------------ */
/*  패치 적용기 — 채팅 엔진과 LLM이 동일한 계약을 사용합니다.                 */
/* ------------------------------------------------------------------ */

export interface ApplyResult {
  state: DocState;
  applied: string[];
  skipped: string[];
}

function labelForPii(id: string): string {
  return PII_MAP[id]?.label ?? id;
}
function labelForSafeguard(id: string): string {
  return SAFEGUARD_MAP[id]?.label ?? id;
}

export function applyPatches(state: DocState, ops: PatchOp[]): ApplyResult {
  let next = state;
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const op of ops) {
    switch (op.op) {
      case 'setField': {
        if (!isWritablePath(op.path)) {
          skipped.push(`허용되지 않은 필드입니다: ${op.path}`);
          break;
        }
        next = setField(next, op.path, op.value);
        applied.push(`${op.path} → ${String(op.value)}`);
        break;
      }
      case 'addPii': {
        if (!PII_MAP[op.id]) {
          skipped.push(`알 수 없는 개인정보 항목입니다: ${op.id}`);
          break;
        }
        if (next.processing.piiIds.includes(op.id)) {
          skipped.push(`이미 수집 항목에 포함되어 있습니다: ${labelForPii(op.id)}`);
          break;
        }
        next.processing.piiIds = [...next.processing.piiIds, op.id];
        applied.push(`수집 항목 추가: ${labelForPii(op.id)}`);
        break;
      }
      case 'removePii': {
        if (!next.processing.piiIds.includes(op.id)) {
          skipped.push(`포함되어 있지 않은 항목입니다: ${labelForPii(op.id)}`);
          break;
        }
        next.processing.piiIds = next.processing.piiIds.filter((x) => x !== op.id);
        applied.push(`수집 항목 제외: ${labelForPii(op.id)}`);
        break;
      }
      case 'addPurpose': {
        const v = String(op.value ?? '').trim();
        if (!v) {
          skipped.push('처리 목적이 비어 있습니다.');
          break;
        }
        if (next.processing.purposes.includes(v)) {
          skipped.push('이미 포함된 처리 목적입니다.');
          break;
        }
        next.processing.purposes = [...next.processing.purposes, v];
        applied.push(`처리 목적 추가: ${v}`);
        break;
      }
      case 'addService': {
        const v = String(op.value ?? '').trim();
        if (!v) {
          skipped.push('처리 시스템명이 비어 있습니다.');
          break;
        }
        if (next.processing.services.includes(v)) {
          skipped.push('이미 포함된 처리 시스템입니다.');
          break;
        }
        next.processing.services = [...next.processing.services, v];
        applied.push(`처리 시스템 추가: ${v}`);
        break;
      }
      case 'addSafeguard': {
        if (!SAFEGUARD_MAP[op.id]) {
          skipped.push(`알 수 없는 보호조치입니다: ${op.id}`);
          break;
        }
        if (next.processing.safeguardIds.includes(op.id)) {
          skipped.push(`이미 적용되어 있습니다: ${labelForSafeguard(op.id)}`);
          break;
        }
        next.processing.safeguardIds = [...next.processing.safeguardIds, op.id];
        applied.push(`보호조치 적용: ${labelForSafeguard(op.id)}`);
        break;
      }
      case 'removeSafeguard': {
        if (!next.processing.safeguardIds.includes(op.id)) {
          skipped.push(`적용되어 있지 않은 보호조치입니다: ${labelForSafeguard(op.id)}`);
          break;
        }
        next.processing.safeguardIds = next.processing.safeguardIds.filter((x) => x !== op.id);
        applied.push(`보호조치 해제: ${labelForSafeguard(op.id)}`);
        break;
      }
      case 'addRetentionRule': {
        const v = op.value;
        if (!v?.item || !v?.period) {
          skipped.push('보유 항목과 기간이 모두 필요합니다.');
          break;
        }
        next.processing.retentionRules = [...next.processing.retentionRules, { ...v, id: uid('rt') }];
        applied.push(`보유기간 추가: ${v.item} → ${v.period}`);
        break;
      }
      case 'addThirdParty': {
        const v = op.value as ThirdPartyDisclosure;
        if (!v?.entity || !v?.purpose) {
          skipped.push('제3자 제공 항목은 제공 대상과 목적이 필요합니다.');
          break;
        }
        next.processing.thirdParties = [
          ...next.processing.thirdParties,
          {
            id: uid('tp'),
            entity: v.entity,
            purpose: v.purpose,
            items: v.items ?? '',
            method: v.method || '안전한 전송 수단',
            legalBasis: v.legalBasis || '정보주체의 동의를 기준으로 제공에 동의받는다.',
            valueVerification:
              v.valueVerification ||
              '제공 대상, 목적 및 항목이 동의서와 계약 내용에 일치하는지 확인하고 계약 외 항목이 포함되지 않도록 관리한다.',
          },
        ];
        applied.push(`제3자 제공 추가: ${v.entity} — ${v.purpose}`);
        break;
      }
      case 'addEntrusted': {
        const v = op.value as EntrustedProcessing;
        if (!v?.entity || !v?.purpose) {
          skipped.push('처리위탁 항목은 수탁자와 위탁 목적이 필요합니다.');
          break;
        }
        next.processing.entrusted = [
          ...next.processing.entrusted,
          {
            id: uid('en'),
            entity: v.entity,
            purpose: v.purpose,
            items: v.items ?? '',
            period: v.period || '계약 기간 중',
            legalBasis: v.legalBasis || '정보주체의 동의를 기준으로 수탁 계약을 체결한다.',
            supervision:
              v.supervision ||
              '수탁자는 월 1회 접근기록을 회사에 제출하고, 회사는 연 1회 수탁자를 대상으로 실태조사를 실시한다.',
          },
        ];
        applied.push(`처리위탁 추가: ${v.entity} — ${v.purpose}`);
        break;
      }
      case 'addOverseas': {
        const v = op.value as OverseasTransfer;
        if (!v?.country || !v?.entity) {
          skipped.push('국외이전 항목은 국가와 수신자가 필요합니다.');
          break;
        }
        next.processing.overseas = [
          ...next.processing.overseas,
          {
            id: uid('os'),
            country: v.country,
            entity: v.entity,
            items: v.items ?? '',
            purpose: v.purpose ?? '',
            method: v.method || '암호화된 전송 및 저장 시 암호화',
            legalBasis: v.legalBasis || '정보주체의 별도 동의를 기준으로 국외이전한다.',
            consentProcess:
              v.consentProcess ||
              '「개인정보의 국외이전 안내서」를 고지하고 별도의 동의를 받으며, 동의 거부 시 국내 처리로 대체 운영한다.',
          },
        ];
        applied.push(`국외이전 추가: ${v.country} / ${v.entity}`);
        break;
      }
      case 'switchTemplate':
        // 문서 종류 전환은 UI 레벨에서 처리되므로 상태 변경 없음
        applied.push(`대상 문서 전환: ${op.id}`);
        break;
      default:
        skipped.push('지원하지 않는 작업입니다.');
    }
  }

  return { state: next, applied, skipped };
}

/* ------------------------------------------------------------------ */
/*  편의 헬퍼                                                             */
/* ------------------------------------------------------------------ */

export function resolvePii(state: DocState) {
  return state.processing.piiIds
    .map((id) => PII_MAP[id])
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

export function resolveSafeguards(state: DocState) {
  return state.processing.safeguardIds
    .map((id) => SAFEGUARD_MAP[id])
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

export function missingPiiLabels(state: DocState): string[] {
  return Object.values(PII_MAP)
    .filter((p) => !state.processing.piiIds.includes(p.id))
    .map((p) => p.label);
}

/** 문서 본문에 실제로 반영되는 개인정보 항목 목록 */
export function piiDisplayList(state: DocState): string[] {
  return resolvePii(state).map((p) => p.label);
}