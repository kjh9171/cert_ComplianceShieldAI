import { interpret } from '@/lib/chat/rules';
import { detectProvider, runLlm } from '@/lib/llm';
import { applyPatches, applyIndustryPreset, createDefaultState } from '@/lib/state';
import type { DocState, PatchOp, TemplateId } from '@/lib/types';
import type { LlmChatTurn } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 * 자연어 요청을 문서 상태 변경(PatchOp)으로 변환합니다.
 *
 * 1) LLM 이 설정되어 있으면 LLM 사용
 * 2) 없거나 실패하면 규칙 기반 엔진 사용 (기본값, 100% 로컬 동작)
 */
export async function POST(request: Request) {
  let body: {
    message?: string;
    history?: LlmChatTurn[];
    state?: Partial<DocState>;
    templateId?: TemplateId;
  };

  try {
    body = await request.json();
  } catch {
    return json({ error: '요청 본문이 올바른 JSON이 아닙니다.' }, 400);
  }

  const message = (body.message ?? '').toString().trim();
  if (!message) {
    return json({ error: '메시지가 비어 있습니다.' }, 400);
  }
  if (message.length > 4000) {
    return json({ error: '메시지가 너무 깁니다. (최대 4000자)' }, 400);
  }

  let state: DocState;
  try {
    state = deepMerge(createDefaultState(), (body.state ?? {}) as Partial<DocState>);
  } catch {
    return json({ error: '문서 상태 형식이 올바르지 않습니다.' }, 400);
  }

  /* ── 1순위: LLM ─────────────────────────────────────────── */
  const llm = await runLlm(
    [
      ...(body.history ?? []).slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ],
    state,
  );

  if (llm) {
    const result = applyPatchList(state, llm.ops);
    return json({
      reply: llm.reply,
      ops: llm.ops,
      applied: result.applied,
      skipped: result.skipped,
      suggestions: llm.suggestions,
      engine: detectProvider(),
      state: result.state,
      switchTemplate: llm.ops.find((o) => o.op === 'switchTemplate')
        ? (llm.ops.find((o) => o.op === 'switchTemplate') as { id: TemplateId }).id
        : null,
    });
  }

  /* ── 2순위: 규칙 엔진 ───────────────────────────────────── */
  const rule = interpret(message, state);
  const result = applyPatchList(state, rule.ops);

  return json({
    reply: rule.reply,
    ops: rule.ops,
    applied: result.applied,
    skipped: result.skipped,
    suggestions: rule.suggestions ?? [],
    engine: 'rules',
    state: result.state,
    switchTemplate:
      rule.matched === 'template' && rule.ops.length > 0 && rule.ops[0].op === 'switchTemplate'
        ? (rule.ops[0] as { id: TemplateId }).id
        : null,
  });
}

function applyPatchList(state: DocState, ops: PatchOp[]) {
  // 업종 변경은 특수 처리 (프리셋 자동 반영)
  const industryOp = ops.find(
    (o): o is Extract<PatchOp, { op: 'setField' }> =>
      o.op === 'setField' && o.path === 'org.industry',
  );
  const rest = ops.filter((o) => o !== industryOp);

  let base = state;
  if (industryOp && industryOp.op === 'setField') {
    base = applyIndustryPreset(state, industryOp.value as DocState['org']['industry']);
  }

  const result = applyPatches(base, rest);

  const applied = [
    ...(industryOp
      ? [`업종 프리셋 적용: ${industryOp.value} (수집 항목 · 보호조치 · 위탁 항목 자동 구성)`]
      : []),
    ...result.applied,
  ];

  return { state: result.state, applied, skipped: result.skipped };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(patch)) return (patch === undefined ? base : (patch as T));
  if (!isPlainObject(base)) return patch as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in out)) continue;
    if (Array.isArray(value)) out[key] = value;
    else if (isPlainObject(value)) out[key] = deepMerge(out[key], value);
    else if (value !== undefined) out[key] = value;
  }
  return out as T;
}