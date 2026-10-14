import { TEMPLATE_MAP } from '../catalog';
import { toISODate } from '../state';
import type { Block, DocState, RenderedDoc, TemplateId } from '../types';
import { buildBreachManual } from './breachManual';
import { buildInternalPlan } from './internalPlan';
import { buildOutsourceAgreement } from './outsourceAgreement';
import { buildPrivacyPolicy } from './privacyPolicy';
import { blocksToMarkdown, blocksToPlainText, countKoreanWords } from './serialize';
import { buildSecurityGuideline } from './securityGuideline';

export const TEMPLATE_IDS: TemplateId[] = [
  'privacy-policy',
  'internal-plan',
  'security-guideline',
  'outsource-agreement',
  'breach-manual',
];

export function isTemplateId(v: unknown): v is TemplateId {
  return typeof v === 'string' && (TEMPLATE_IDS as string[]).includes(v);
}

/** 블록 모델 생성 */
export function buildBlocks(templateId: TemplateId, state: DocState): Block[] {
  switch (templateId) {
    case 'privacy-policy':
      return buildPrivacyPolicy(state);
    case 'internal-plan':
      return buildInternalPlan(state);
    case 'security-guideline':
      return buildSecurityGuideline(state);
    case 'outsource-agreement':
      return buildOutsourceAgreement(state);
    case 'breach-manual':
      return buildBreachManual(state);
    default:
      return buildPrivacyPolicy(state);
  }
}

function slugify(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

/**
 * 완전한 문서 렌더링 결과 생성.
 * 미리보기 / DOCX / Markdown / TXT / 인쇄가 모두 이 결과를 공유합니다.
 */
export function renderDocument(templateId: TemplateId, state: DocState): RenderedDoc {
  const blocks = buildBlocks(templateId, state);
  const plainText = blocksToPlainText(blocks);
  const meta = TEMPLATE_MAP[templateId];
  const safeName = slugify(state.org.name || '회사');
  const safeTitle = slugify(meta?.title ?? '문서');
  const date = state.org.effectiveDate || toISODate(new Date());

  return {
    templateId,
    blocks,
    plainText,
    markdown: blocksToMarkdown(blocks),
    fileSlug: `${safeName}_${safeTitle}_${date}`,
    wordCount: countKoreanWords(plainText),
  };
}

/** 문서 개정 이력 표 (버전 이력 블록) */
export function revisionHistoryRows(
  history: { version: string; date: string; author: string; note: string }[],
): string[][] {
  return history.map((h, i) => [
    `${i + 1}`,
    h.version,
    h.date,
    h.author || '-',
    h.note || '-',
  ]);
}