import { INDUSTRY_PRESETS } from '../catalog';
import { formatKoreanDate, resolvePii, resolveSafeguards } from '../state';
import type { Block, DocState, Officer } from '../types';

export const CO = '주식회사'; // 기본 호칭 (state에서 이름을 받으므로 문자열 접합에만 사용)

/** “주식회사 컴플라이언스실드” → “회사” 축약 표현 치환 */
export function orgFull(state: DocState): string {
  return state.org.name.trim() || '회사';
}

export function orgShort(state: DocState): string {
  const n = orgFull(state);
  // “주식회사OOO”, “(주)OOO” → “OOO”
  return n.replace(/^(주식회사|\(주\))\s*/, '');
}

export function industryLabel(state: DocState): string {
  return INDUSTRY_PRESETS[state.org.industry]?.label ?? '일반 기업';
}

export function industryNote(state: DocState): string {
  return INDUSTRY_PRESETS[state.org.industry]?.note ?? '';
}

export function piiList(state: DocState): string[] {
  return resolvePii(state).map((p) => p.label);
}

export function piiString(state: DocState): string {
  const list = piiList(state);
  if (list.length === 0) return '(해당 없음)';
  return list.join(', ');
}

export function piiByCategory(state: DocState): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const p of resolvePii(state)) {
    (map[p.category] ??= []).push(p.label);
  }
  return map;
}

export function sensitivePii(state: DocState): string[] {
  return resolvePii(state).filter((p) => p.sensitive).map((p) => p.label);
}

export function autoCollectedPii(state: DocState): string[] {
  return resolvePii(state).filter((p) => p.autoCollected).map((p) => p.label);
}

export function safeguardsByCategory(state: DocState): Record<string, string[]> {
  const map: Record<string, string[]> = { '기술적': [], '관리적': [], '물리적': [] };
  for (const s of resolveSafeguards(state)) map[s.category].push(s.label);
  return map;
}

export function safeguardsFlat(state: DocState): string[] {
  return resolveSafeguards(state).map((s) => s.label);
}

export function legalBasisList(state: DocState): string[] {
  return state.processing.legalBasis;
}

export function retentionLines(state: DocState): string[] {
  return state.processing.retentionRules.map(
    (r) => `- ${r.item} : ${r.period} (근거: ${r.basis})`,
  );
}

export function docMetaRows(state: DocState): [string, string][] {
  return [
    ['문서관리번호', state.org.docNumber || '-'],
    ['문서 버전', state.org.version || '-'],
    ['시행일자', formatKoreanDate(state.org.effectiveDate)],
    ['최종 개정일', formatKoreanDate(state.org.lastRevised)],
    ['차기 검토일', formatKoreanDate(state.org.nextReview)],
    ['승인 기구', state.org.approvalBody || '-'],
  ];
}

export function orgMetaRows(state: DocState): [string, string][] {
  return [
    ['법인명', orgFull(state)],
    ['사업자등록번호', state.org.bizNumber || '-'],
    ['대표이사', state.org.ceo || '-'],
    ['업종', `${industryLabel(state)} (${state.org.employeeCount || '규모 미상'})`],
    ['본사 소재지', state.org.address || '-'],
    ['홈페이지', state.org.homepage || '-'],
    ['데이터 보관 위치', state.org.masterDataCenter || '-'],
  ];
}

export function officerRows(o: Officer, label: string): [string, string][] {
  return [
    [`${label} 성명`, o.name || '-'],
    [`${label} 직책`, o.title || '-'],
    [`${label} 소속`, o.dept || '-'],
    [`${label} 연락처`, [o.phone, o.email].filter(Boolean).join(' / ') || '-'],
  ];
}

export function officerText(o: Officer): string {
  const contacts = [o.phone, o.email].filter(Boolean).join(' / ');
  return `${o.title || '담당자'} ${o.name || '(미지정)'}${contacts ? ` (${contacts})` : ''}`;
}

export function countActive(state: DocState): number {
  return state.processing.piiIds.length + state.processing.safeguardIds.length;
}

/** 문서 끝에 붙는 표준 공통 조항 */
export function boilerplateNoteBlocks(state: DocState): Block[] {
  return [
    {
      kind: 'note',
      tone: 'info',
      title: '고지의무',
      text: `본 ${state.org.docNumber ? `문서(${state.org.docNumber}) ` : ''}은 「개인정보 보호법」 제30조 및 동법 시행령 제32조에 따라 반드시 공개하여야 하는 항목을 모두 포함합니다. 본 문서는 ${formatKoreanDate(state.org.effectiveDate)} 부터 시행하며, 법령 개정에 따른 일부가 변경될 경우 변경된 내용을 본 홈페이지 공지사항에 고지합니다.`,
    },
  ];
}