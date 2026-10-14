import { PII_CATALOG, SAFEGUARD_CATALOG, INDUSTRY_PRESETS } from './catalog';
import { EDITABLE_FIELD_LABELS } from './compliance';
import type { DocState, PatchOp } from './types';

/**
 * 선택적 LLM 연동 계층.
 *
 * ANTHROPIC_API_KEY 또는 OPENAI_API_KEY 가 설정된 경우에만 동작하고,
 * 없으면 규칙 기반 엔진이 그대로 사용됩니다. (기본값 = 완전 로컬 동작)
 */

export type LlmProvider = 'anthropic' | 'openai' | null;

export function detectProvider(): LlmProvider {
  if (process.env.LLM_ENABLED === 'false') return null;
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
}

export interface LlmChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmResult {
  reply: string;
  ops: PatchOp[];
  suggestions: string[];
}

const piiIds = PII_CATALOG.map((p) => `${p.id}=${p.label}`).join(', ');
const sgIds = SAFEGUARD_CATALOG.map((s) => `${s.id}=${s.label}`).join(', ');
const fieldLabels = EDITABLE_FIELD_LABELS.map((f) => `${f.path}(${f.label})`).join(', ');

function systemPrompt(state: DocState): string {
  const industries = Object.values(INDUSTRY_PRESETS)
    .map((i) => `${i.key}: ${i.label}`)
    .join(', ');

  return [
    '당신은 대한민국 개인정보보호법 기준 법정 컴플라이언스 문서 작성 보조 엔진입니다.',
    '사용자가 입력한 정보를 바탕으로 처리방침 · 내부관리계획서 · 보호지침 등을 구성합니다.',
    '',
    '## 응답 형식 (순수 JSON, 코드펜스 금지)',
    '{',
    '  "reply": "사용자에게 보여줄 한국어 안내 (1~3문장)",',
    '  "ops": [ PatchOp... ],',
    '  "suggestions": ["다음에 물어볼 만한 질문"]',
    '}',
    '',
    '## 사용 가능한 PatchOp',
    '{ "op":"setField","path":"<경로>","value":"<값>" }',
    '{ "op":"addPii","id":"<pii id>" }',
    '{ "op":"removePii","id":"<pii id>" }',
    '{ "op":"addSafeguard","id":"<safeguard id>" }',
    '{ "op":"removeSafeguard","id":"<safeguard id>" }',
    '{ "op":"addPurpose","value":"<처리 목적>" }',
    '{ "op":"addService","value":"<처리 시스템>" }',
    '{ "op":"addRetentionRule","value":{"item":"...","period":"...","basis":"..."} }',
    '{ "op":"addThirdParty","value":{"entity":"...","purpose":"...","items":"...","method":"...","legalBasis":"...","valueVerification":"..."} }',
    '{ "op":"addEntrusted","value":{"entity":"...","purpose":"...","items":"...","period":"...","legalBasis":"...","supervision":"..."} }',
    '{ "op":"addOverseas","value":{"country":"...","entity":"...","items":"...","purpose":"...","method":"...","legalBasis":"...","consentProcess":"..."} }',
    '{ "op":"switchTemplate","id":"privacy-policy|internal-plan|security-guideline|outsource-agreement|breach-manual" }',
    '',
    '## setField 허용 경로 (이 외 경로는 무시됩니다)',
    fieldLabels,
    '',
    '## 개인정보 항목 id',
    piiIds,
    '',
    '## 안전성 확보조치 id',
    sgIds,
    '',
    '## 업종 id',
    industries,
    '',
    '## 규칙',
    '1. 사용자의 의도에 맞는 변경 작업만 생성하세요. 추측으로 값을 채우지 마세요.',
    '2. 사용자가 제공하지 않은 정보는 임의로 만들어 넣지 말고, reply에서 물어보세요.',
    '3. 민감정보(법 제23조), 국외이전, 제3자 제공은 관련 항목이 반드시 함께 생성되어야 합니다.',
    '4. 한국어 문장을 정확히 작성하고, 어색한 번역투는 쓰지 마세요.',
    '',
    '## 현재 상태 요약',
    `법인명: ${state.org.name}`,
    `업종: ${state.org.industry}`,
    `수집 항목(${state.processing.piiIds.length}): ${state.processing.piiIds.join(', ')}`,
    `보호조치(${state.processing.safeguardIds.length}): ${state.processing.safeguardIds.join(', ')}`,
    `처리 목적: ${state.processing.purposes.join(' / ')}`,
    `처리 시스템: ${state.processing.services.join(' / ')}`,
    `위탁: ${state.processing.entrusted.map((e) => e.entity).join(', ') || '없음'}`,
    `제3자 제공: ${state.processing.thirdParties.map((t) => t.entity).join(', ') || '없음'}`,
    `국외이전: ${state.processing.overseas.map((o) => `${o.country}/${o.entity}`).join(', ') || '없음'}`,
  ].join('\n');
}

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('JSON 블록을 찾을 수 없습니다.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const VALID_OPS = new Set([
  'setField', 'addPii', 'removePii', 'addPurpose', 'addService',
  'addSafeguard', 'removeSafeguard', 'addRetentionRule',
  'addThirdParty', 'addEntrusted', 'addOverseas', 'switchTemplate',
]);

function sanitizeOps(raw: unknown): PatchOp[] {
  if (!Array.isArray(raw)) return [];
  const out: PatchOp[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const op = (item as Record<string, unknown>).op;
    if (typeof op !== 'string' || !VALID_OPS.has(op)) continue;
    out.push(item as PatchOp);
  }
  // setField 는 서버에서 한 번 더 검증합니다 (허용 경로 체크는 applyPatches 가 수행)
  return out;
}

async function callAnthropic(system: string, messages: LlmChatTurn[], model: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const content: string = (json.content ?? [])
    .map((c: { text?: string }) => c.text ?? '')
    .join('');
  return content;
}

async function callOpenAI(system: string, messages: LlmChatTurn[], model: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

export async function runLlm(
  messages: LlmChatTurn[],
  state: DocState,
): Promise<LlmResult | null> {
  const provider = detectProvider();
  if (!provider) return null;

  const model =
    process.env.LLM_MODEL ??
    (provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini');

  try {
    const raw =
      provider === 'anthropic'
        ? await callAnthropic(systemPrompt(state), messages, model)
        : await callOpenAI(systemPrompt(state), messages, model);

    const parsed = extractJson(raw) as { reply?: string; ops?: unknown; suggestions?: unknown };
    return {
      reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : '요청을 반영했습니다.',
      ops: sanitizeOps(parsed.ops),
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter((s): s is string => typeof s === 'string').slice(0, 4)
        : [],
    };
  } catch (err) {
    console.error('[llm] 호출 실패, 규칙 엔진으로 대체합니다.', err);
    return null;
  }
}