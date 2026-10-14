'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FileCheck2,
  KeyRound,
  Lock,
  ScrollText,
  ShieldCheck,
  Siren,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { INDUSTRY_PRESETS, TEMPLATE_META } from '@/lib/catalog';
import { runAudit } from '@/lib/compliance';
import { resolvePii, resolveSafeguards } from '@/lib/state';
import type { DocState, TemplateId } from '@/lib/types';
import { cn, formatNumber } from '@/lib/utils';
import { ScoreRing, StatCard } from '@/components/ui/Primitives';

const TEMPLATE_ICONS: Record<TemplateId, typeof ScrollText> = {
  'privacy-policy': ScrollText,
  'internal-plan': ShieldCheck,
  'security-guideline': UserCheck,
  'outsource-agreement': FileCheck2,
  'breach-manual': Siren,
};

const COLOR_TONE: Record<string, { chip: string; btn: string; ring: string }> = {
  indigo: {
    chip: 'border-brand-200 bg-brand-50 text-brand-700',
    btn: 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20',
    ring: 'hover:border-brand-300 hover:shadow-lift',
  },
  emerald: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
    ring: 'hover:border-emerald-300 hover:shadow-lift',
  },
  amber: {
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
    ring: 'hover:border-amber-300 hover:shadow-lift',
  },
  sky: {
    chip: 'border-sky-200 bg-sky-50 text-sky-700',
    btn: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20',
    ring: 'hover:border-sky-300 hover:shadow-lift',
  },
  rose: {
    chip: 'border-rose-200 bg-rose-50 text-rose-700',
    btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
    ring: 'hover:border-rose-300 hover:shadow-lift',
  },
};

export function DashboardView({
  state,
  onSelectTemplate,
  onGoAudit,
  onGoGenerator,
}: {
  state: DocState;
  onSelectTemplate: (id: TemplateId) => void;
  onGoAudit: () => void;
  onGoGenerator: () => void;
}) {
  const pii = useMemo(() => resolvePii(state), [state]);
  const safeguards = useMemo(() => resolveSafeguards(state), [state]);
  const audit = useMemo(() => runAudit(state, pii, safeguards), [state, pii, safeguards]);

  const sensitiveCount = pii.filter((p) => p.sensitive).length;
  const autoCount = pii.filter((p) => p.autoCollected).length;
  const highGaps = audit.gaps.filter((g) => g.severity === 'high').length;

  const technical = safeguards.filter((s) => s.category === '기술적').length;
  const managerial = safeguards.filter((s) => s.category === '관리적').length;
  const physical = safeguards.filter((s) => s.category === '물리적').length;

  const preset = INDUSTRY_PRESETS[state.org.industry];

  return (
    <div className="space-y-5">
      {/* ── 상단 KPI ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="cs-card flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-sans text-[11.5px] font-medium text-slate-500">컴플라이언스 종합 점수</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={cn(
                  'font-mono text-[22px] font-bold leading-none',
                  audit.score >= 90 ? 'text-emerald-600' : audit.score >= 70 ? 'text-amber-600' : 'text-rose-600',
                )}
              >
                {audit.score}
              </span>
              <span className="font-sans text-[11px] text-slate-400">/ 100</span>
              <span className="cs-badge border-slate-200 bg-slate-50 text-slate-600">{audit.grade}등급</span>
            </div>
            <button
              onClick={onGoAudit}
              className="mt-1.5 inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-brand-700 hover:underline"
            >
              미충족 {audit.total - audit.passed}건 확인
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <ScoreRing value={audit.score} size={68} />
        </div>

        <StatCard
          icon={<KeyRound className="h-5 w-5" />}
          label="수집 개인정보 항목"
          value={`${formatNumber(state.processing.piiIds.length)}개`}
          sub={`민감정보 ${sensitiveCount} · 자동수집 ${autoCount}`}
          tone="amber"
        />
        <StatCard
          icon={<Lock className="h-5 w-5" />}
          label="적용 중인 보호조치"
          value={`${safeguards.length}개`}
          sub={`기술 ${technical} · 관리 ${managerial} · 물리 ${physical}`}
          tone="emerald"
        />
        <StatCard
          icon={<FileCheck2 className="h-5 w-5" />}
          label="위탁 · 제공 · 국외이전"
          value={`${state.processing.entrusted.length + state.processing.thirdParties.length + state.processing.overseas.length}건`}
          sub={`위탁 ${state.processing.entrusted.length} · 제공 ${state.processing.thirdParties.length} · 국외 ${state.processing.overseas.length}`}
          tone="sky"
        />
      </section>

      {/* ── 법적 기한 알림 ───────────────────────────────────── */}
      <LegalNotice state={state} auditScore={audit.score} highGaps={highGaps} onGoAudit={onGoAudit} />

      {/* ── 문서 목록 ───────────────────────────────────────── */}
      <section className="cs-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="cs-section-title">
              <ScrollText className="h-[18px] w-[18px] text-brand-600" />
              필수 법정 컴플라이언스 문서
            </h2>
            <p className="mt-1 font-sans text-[11.5px] text-slate-500">
              개인정보보호법 기준 최신 양식 · 입력 정보에 맞춰 자동으로 작성됩니다
            </p>
          </div>
          <span className="cs-badge border-emerald-200 bg-emerald-50 text-emerald-700">
            <BadgeCheck className="h-3 w-3" />
            법령 개정 자동 반영
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 p-5 md:grid-cols-2 xl:grid-cols-3">
          {TEMPLATE_META.map((t) => {
            const Icon = TEMPLATE_ICONS[t.id];
            const tone = COLOR_TONE[t.color];
            return (
              <article
                key={t.id}
                className={cn(
                  'group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-all',
                  tone.ring,
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
                      tone.chip,
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="cs-badge border-slate-200 bg-slate-50 text-slate-500">
                      {t.category}
                    </span>
                    {t.required && (
                      <span className="cs-badge border-rose-200 bg-rose-50 text-rose-700">법적 필수</span>
                    )}
                  </div>
                </div>

                <h3 className="font-sans text-[13.5px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-700">
                  {t.title}
                </h3>
                <p className="mt-0.5 font-mono text-[10.5px] text-slate-400">{t.legalRef}</p>
                <p className="mt-2 flex-1 font-sans text-[12px] leading-relaxed text-slate-600">
                  {t.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-sans text-[10.5px] font-medium text-slate-400">
                    대상 · {t.audience}
                  </span>
                  <button
                    onClick={() => onSelectTemplate(t.id)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-sans text-[12px] font-bold text-white shadow-sm transition active:scale-[.98]',
                      tone.btn,
                    )}
                  >
                    작성하기
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}

          <button
            onClick={onGoGenerator}
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl
                       border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 transition
                       hover:border-brand-400 hover:bg-brand-50/40"
          >
            <Sparkles className="h-6 w-6 text-brand-500" />
            <span className="font-sans text-[13px] font-bold text-slate-700">
              자연어로 문서 만들기
            </span>
            <span className="px-4 text-center font-sans text-[11.5px] leading-relaxed text-slate-500">
              &ldquo;회사는 병원이야&rdquo;, &ldquo;주민번호 추가해줘&rdquo;처럼
              대화하듯 입력하면 문서가 즉시 갱신됩니다.
            </span>
          </button>
        </div>
      </section>

      {/* ── 업종 정보 + 주요 기재 항목 ──────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="cs-card p-5 lg:col-span-1">
          <h2 className="cs-section-title">
            <Sparkles className="h-[18px] w-[18px] text-brand-600" />
            적용된 업종 프리셋
          </h2>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[20px] shadow-sm">
              {preset?.emoji}
            </span>
            <div className="min-w-0">
              <p className="truncate font-sans text-[13px] font-bold text-slate-900">{preset?.label}</p>
              <p className="truncate font-sans text-[11px] text-slate-500">
                {state.org.employeeCount} · {state.org.name}
              </p>
            </div>
          </div>
          <p className="mt-3 font-sans text-[12px] leading-relaxed text-slate-600">{preset?.description}</p>
          <p className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-sans text-[11.5px] leading-relaxed text-amber-900">
            {preset?.note}
          </p>
        </section>

        <section className="cs-card p-5 lg:col-span-2">
          <h2 className="cs-section-title">
            <CheckCircle2 className="h-[18px] w-[18px] text-emerald-600" />
            처리방침 14가지 법정 기재 항목 현황
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {audit.results.slice(0, 14).map((r) => (
              <div
                key={r.id}
                className={cn(
                  'flex items-start gap-2 rounded-xl border px-3 py-2.5',
                  r.passed ? 'border-slate-200 bg-slate-50/60' : 'border-rose-200 bg-rose-50/60',
                )}
              >
                {r.passed ? (
                  <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <CircleDashed className="mt-px h-4 w-4 shrink-0 text-rose-500" />
                )}
                <div className="min-w-0">
                  <p className="font-sans text-[12px] font-semibold leading-snug text-slate-800">{r.label}</p>
                  <p className="font-mono text-[10px] text-slate-400">{r.ref}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onGoAudit} className="cs-btn-subtle cs-btn-sm mt-3.5">
            전체 {audit.total}개 항목 점검 결과 보기
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LegalNotice({
  state,
  auditScore,
  highGaps,
  onGoAudit,
}: {
  state: DocState;
  auditScore: number;
  highGaps: number;
  onGoAudit: () => void;
}) {
  const now = new Date();
  const review = state.org.nextReview ? new Date(state.org.nextReview + 'T00:00:00') : null;
  const daysLeft = review ? Math.round((review.getTime() - now.getTime()) / 86_400_000) : null;

  const urgent = daysLeft !== null && daysLeft <= 90;
  const warning = highGaps > 0;

  if (!urgent && !warning && auditScore >= 95) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-sans text-[13px] font-bold text-emerald-900">
              법정 컴플라이언스 준비 상태가 양호합니다
            </p>
            <p className="mt-0.5 font-sans text-[11.5px] text-emerald-800/80">
              필수 기재 항목이 모두 충족되었습니다. 차기 검토일
              {state.org.nextReview || '미설정'}까지 정기 검토를 권장합니다.
            </p>
          </div>
        </div>
        <button onClick={onGoAudit} className="cs-btn-ghost cs-btn-sm">
          점검 리포트 확인
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-sans text-[13px] font-bold text-amber-900">확인이 필요한 사항이 있습니다</p>
          <ul className="mt-1 space-y-0.5 font-sans text-[11.5px] text-amber-900/80">
            {highGaps > 0 && <li>· 법정 기재 항목 {highGaps}건이 미충족 상태입니다.</li>}
            {urgent && (
              <li>
                · 차기 검토일({state.org.nextReview})까지 {daysLeft}일 남았습니다. 법 제29장에 따라
                최소 연 1회 재검토가 필요합니다.
              </li>
            )}
          </ul>
        </div>
      </div>
      <button onClick={onGoAudit} className="cs-btn-primary cs-btn-sm">
        미충족 항목 바로 보기
      </button>
    </div>
  );
}