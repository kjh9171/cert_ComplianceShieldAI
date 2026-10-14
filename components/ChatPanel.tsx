'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CheckCheck,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  TriangleAlert,
  User,
  Wand2,
} from 'lucide-react';
import { interpret } from '@/lib/chat/rules';
import { applyIndustryPreset, applyPatches } from '@/lib/state';
import type { ChatMessage, DocState, PatchOp, TemplateId } from '@/lib/types';
import { cn } from '@/lib/utils';

const SUGGESTION_POOL = [
  '회사명은 주식회사 에이비씨로 바꿔줘',
  '보호책임자는 김철수 / cpo@abc.co.kr / 02-000-0000',
  '우리 회사는 병원이야',
  '주민등록번호 추가, 쿠키는 빼줘',
  '유출방지 조치 적용해줘',
  '접속기록 보관 기간은 3년으로 바꿔줘',
  'PG사에 결제 대행을 위탁해줘',
  '시행일은 2027년 1월 1일로',
  '현재 문서를 점검해줘',
];

const WELCOME =
  '안녕하세요. ComplianceShield AI 문서 비서입니다.\n' +
  '왼쪽 입력 항목은 직접 채우실 수 있고, 이곳에 문장으로 말씀해 주셔도 같은 결과가 반영됩니다.\n' +
  '예) "우리 회사는 온라인 쇼핑몰이야", "주민등록번호 추가해줘", "유출방지 조치 적용"';

function uid(): string {
  return `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function ChatPanel({
  state,
  templateId,
  onStateChange,
  onTemplateChange,
  onToast,
  className,
}: {
  state: DocState;
  templateId: TemplateId;
  onStateChange: (next: DocState) => void;
  onTemplateChange: (id: TemplateId) => void;
  onToast: (msg: string, tone?: 'success' | 'error' | 'info') => void;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uid(), role: 'assistant', content: WELCOME, at: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<'rules' | 'anthropic' | 'openai'>('rules');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const applyOps = (ops: PatchOp[], base: DocState): { applied: string[]; skipped: string[] } => {
    const industryOp = ops.find(
      (o): o is Extract<PatchOp, { op: 'setField' }> =>
        o.op === 'setField' && o.path === 'org.industry',
    );
    const rest = ops.filter((o) => o !== industryOp);

    let current = base;
    const applied: string[] = [];

    if (industryOp) {
      current = applyIndustryPreset(current, industryOp.value as DocState['org']['industry']);
      applied.push(`업종 프리셋 적용 · ${industryOp.value}`);
    }

    const result = applyPatches(current, rest);
    onStateChange(result.state);

    const tplOp = ops.find((o) => o.op === 'switchTemplate');
    if (tplOp && tplOp.op === 'switchTemplate') {
      onTemplateChange(tplOp.id);
      applied.push(`대상 문서 전환 · ${tplOp.id}`);
    }

    return { applied: [...applied, ...result.applied], skipped: result.skipped };
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, at: Date.now() };
    const pendingId = uid();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: pendingId, role: 'assistant', content: '', at: Date.now(), pending: true },
    ]);
    setInput('');
    setBusy(true);

    try {
      // 1) LLM 이 설정된 경우 서버 경유 (없으면 즉시 규칙 엔진)
      let res: {
        reply: string;
        ops: PatchOp[];
        applied: string[];
        skipped: string[];
        suggestions: string[];
        engine: string;
        switchTemplate: TemplateId | null;
      } | null = null;

      try {
        const r = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            state,
            templateId,
            history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (r.ok) {
          const data = await r.json();
          if (data?.reply) res = data;
        }
      } catch {
        /* 네트워크 실패 시 로컬 규칙 엔진으로 대체 */
      }

      let reply: string;
      let applied: string[];
      let skipped: string[];

      if (res) {
        reply = res.reply;
        skipped = res.skipped ?? [];
        setEngine((res.engine as typeof engine) ?? 'rules');
        const result = applyOps(res.ops ?? [], state);
        applied = result.applied;
        if (res.switchTemplate) {
          onTemplateChange(res.switchTemplate);
          if (!applied.some((a) => a.includes('전환'))) applied.push(`대상 문서 전환 · ${res.switchTemplate}`);
        }
      } else {
        const rule = interpret(text, state);
        const result = applyOps(rule.ops, state);
        reply = rule.reply;
        applied = result.applied;
        skipped = result.skipped;
        setEngine('rules');
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                content: reply + (skipped.length ? `\n\n⚠️ 반영하지 못한 항목\n${skipped.map((s) => `· ${s}`).join('\n')}` : ''),
                applied,
                skipped,
                pending: false,
              }
            : m,
        ),
      );

      if (applied.length > 0) {
        onToast(`${applied.length}개 항목을 문서에 반영했습니다.`, 'success');
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                content: '요청을 처리하는 중 문제가 발생했습니다. 다시 시도해 주세요.',
                pending: false,
                failed: true,
              }
            : m,
        ),
      );
      onToast(err instanceof Error ? err.message : '요청 처리에 실패했습니다.', 'error');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const clear = () => {
    setMessages([{ id: uid(), role: 'assistant', content: WELCOME, at: Date.now() }]);
  };

  const suggestions = useMemoSuggestions(messages);

  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-sans text-[13px] font-bold leading-tight text-slate-900">
              AI 문서 비서
            </h2>
            <p className="flex items-center gap-1.5 font-sans text-[10.5px] text-slate-500">
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  engine === 'rules' ? 'bg-emerald-500' : 'bg-brand-500',
                )}
              />
              {engine === 'rules' ? '규칙 엔진 (로컬 동작)' : `LLM · ${engine}`}
            </p>
          </div>
        </div>
        <button
          onClick={clear}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          title="대화 초기화"
          aria-label="대화 초기화"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* 메시지 목록 */}
      <div ref={scrollRef} className="cs-scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={cn('flex gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
            <span
              className={cn(
                'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                m.role === 'user'
                  ? 'bg-slate-700 text-white'
                  : 'bg-gradient-to-br from-brand-500 to-brand-700 text-white',
              )}
            >
              {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </span>

            <div className={cn('min-w-0 max-w-[85%]', m.role === 'user' && 'flex flex-col items-end')}>
              <div
                className={cn(
                  'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 font-sans text-[12.5px] leading-relaxed',
                  m.role === 'user'
                    ? 'rounded-tr-sm bg-slate-800 text-white'
                    : cn(
                        'rounded-tl-sm border',
                        m.failed
                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                          : 'border-slate-200 bg-white text-slate-700',
                      ),
                )}
              >
                {m.pending ? (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    문서에 반영 중…
                  </span>
                ) : (
                  m.content
                )}
              </div>

              {m.applied && m.applied.length > 0 && (
                <div className="mt-1.5 w-full rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                  <p className="mb-1 flex items-center gap-1 font-sans text-[10.5px] font-bold text-emerald-800">
                    <CheckCheck className="h-3 w-3" />
                    문서 반영 완료
                  </p>
                  <ul className="space-y-0.5">
                    {m.applied.slice(0, 6).map((a, i) => (
                      <li key={i} className="font-sans text-[11px] leading-snug text-emerald-900/85">
                        · {a}
                      </li>
                    ))}
                    {m.applied.length > 6 && (
                      <li className="font-sans text-[11px] text-emerald-700">
                        외 {m.applied.length - 6}건
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {m.skipped && m.skipped.length > 0 && (
                <div className="mt-1.5 w-full rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
                  <p className="mb-0.5 flex items-center gap-1 font-sans text-[10.5px] font-bold text-amber-800">
                    <TriangleAlert className="h-3 w-3" />
                    반영하지 못함
                  </p>
                  {m.skipped.slice(0, 3).map((s, i) => (
                    <p key={i} className="font-sans text-[11px] text-amber-900/85">
                      · {s}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Bot className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 추천 질문 */}
      <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-3 py-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={busy}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-sans
                       text-[11px] font-medium text-slate-600 transition
                       hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700
                       disabled:opacity-45"
          >
            {s}
          </button>
        ))}
      </div>

      {/* 입력 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-slate-100 bg-white p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="문서에 반영할 내용을 입력하세요… (예: 주민등록번호 추가해줘)"
            className="cs-input max-h-32 min-h-[42px] flex-1 resize-none py-2.5"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="cs-btn-primary h-[42px] w-[42px] shrink-0 px-0"
            aria-label="전송"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 flex items-center gap-1 font-sans text-[10.5px] text-slate-400">
          <Sparkles className="h-3 w-3" />
          Enter 전송 · Shift+Enter 줄바꿈 · 모든 변경은 좌측 미리보기에 즉시 반영됩니다.
        </p>
      </form>
    </div>
  );
}

/* 마지막 메시지 이후에만 추천 질문을 노출합니다. */
function useMemoSuggestions(messages: ChatMessage[]): string[] {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'assistant' || messages.length === 1) return SUGGESTION_POOL.slice(0, 4);

  const applied = last.applied ?? [];
  const next: string[] = [];

  // 직전 답변의 실제 변경 내용에 따라 이어질 질문을 제안합니다.
  if (applied.some((a) => a.includes('업종'))) {
    next.push('이 업종에 맞는 위탁 업체 추가해줘');
  }
  if (applied.some((a) => a.includes('수집 항목'))) {
    next.push('내부관리계획서로 문서를 바꿔줘');
  }
  if (applied.some((a) => a.includes('보유기간'))) {
    next.push('접속기록 보관 기간은 3년으로 바꿔줘');
  }
  if (applied.some((a) => a.includes('보호책임자'))) {
    next.push('선정업무 담당자는 박관리 / pm@company.co.kr');
  }
  if (!applied.length) {
    next.push('현재 문서를 점검해줘');
  }
  next.push('시행일은 2027년 1월 1일로');
  return next.slice(0, 4);
}