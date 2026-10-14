import { NextResponse } from 'next/server';
import { renderDocument } from '@/lib/render';
import { createDefaultState } from '@/lib/state';
import type { DocState, TemplateId } from '@/lib/types';
import { isTemplateId } from '@/lib/render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/generate
 * DocState + templateId 를 받아 완성된 법정 컴플라이언스 문서를 생성합니다.
 *
 * 응답: { templateId, blocks, plainText, markdown, fileSlug, wordCount }
 */
export async function POST(request: Request) {
  let body: {
    templateId?: string;
    state?: Partial<DocState>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '요청 본문이 올바른 JSON이 아닙니다.' },
      { status: 400 },
    );
  }

  const templateId = body.templateId;
  if (!isTemplateId(templateId)) {
    return NextResponse.json(
      { error: `지원하지 않는 문서 종류입니다: ${String(templateId)}` },
      { status: 400 },
    );
  }

  // 부분 상태를 받으면 기본 상태 위에 병합합니다.
  let state: DocState;
  try {
    const base = createDefaultState();
    state = deepMerge(base, (body.state ?? {}) as Partial<DocState>);
  } catch {
    return NextResponse.json({ error: '문서 상태 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const doc = renderDocument(templateId as TemplateId, state);

  return NextResponse.json({
    templateId: doc.templateId,
    blocks: doc.blocks,
    plainText: doc.plainText,
    markdown: doc.markdown,
    fileSlug: doc.fileSlug,
    wordCount: doc.wordCount,
  });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 배열은 통째로 교체하고 객체는 재귀 병합합니다. */
function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(patch)) return (patch === undefined ? base : (patch as T));
  if (!isPlainObject(base)) return patch as T;

  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in out)) continue; // 허용되지 않은 필드는 무시
    if (Array.isArray(value)) {
      out[key] = value;
    } else if (isPlainObject(value)) {
      out[key] = deepMerge(out[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}