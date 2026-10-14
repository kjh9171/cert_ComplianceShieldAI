'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Download,
  Info,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { runAudit } from '@/lib/compliance';
import { formatKoreanDate, resolvePii, resolveSafeguards } from '@/lib/state';
import type { ComplianceStore } from '@/lib/store';
import { cn, downloadBlob } from '@/lib/utils';
import { ScoreRing } from '@/components/ui/Primitives';

const CATEGORY_LABEL = {
  법정기재: '법정 기재 항목',
  보호조치: '안전성 확보조치',
  운영: '내부 운영',
} as const;

const SEVERITY = {
  high: { label: '권고', chip: 'border-rose-200 bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  medium: { label: '권장', chip: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  low: { label: '참고', chip: 'border-sky-200 bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
} as const;

export function AuditView({
  store,
  onToast,
}: {
  store: ComplianceStore;
  onToast: (msg: string, tone?: 'success' | 'error' | 'info') => void;
}) {
  const { state, setUi } = store;
  const [showPassed, setShowPassed] = useState(true);

  const pii = useMemo(() => resolvePii(state), [state]);
  const safeguards = useMemo(() => resolveSafeguards(state), [state]);
  const audit = useMemo(() => runAudit(state, pii, safeguards), [state, pii, safeguards]);

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof audit.results>();
    for (const r of audit.results) {
      const arr = map.get(r.category) ?? [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return [...map.entries()];
  }, [audit]);

  const exportReport = () => {
    const now = new Date();
    const lines = [
      '개인정보 컴플라이언스 점검 리포트',
      '='.repeat(52),
      `점검 대상 : ${state.org.name}`,
      `문서 기준 : ${state.org.docNumber} ${state.org.version}`,
      `점검 일자 : ${formatKoreanDate(now.toISOString().slice(0, 10))}`,
      `종합 점수 : ${audit.score}점 (${audit.grade}등급)`,
      `충족      : ${audit.passed} / ${audit.total}`,
      '',
      '■ 항목별 점검 결과',
      ...audit.results.map(
        (r, i) => `${String(i + 1).padStart(2)}. [${r.passed ? '충족' : '미충족'}] ${r.label} (${r.ref})`,
      ),
      '',
      '■ 미충족 항목 보완 권고',
      ...(audit.gaps.length
        ? audit.gaps.map((g, i) => `${i + 1}. ${g.title}\n     ${g.detail}`)
        : ['- 없음']),
      '',
      '※ 본 리포트는 입력된 정보를 기반으로 자동 생성되었으며, 법정 감사의 근거로 사용하기 전에',
      '   담당자 검토 및 최신 법령 반영 여부를 반드시 확인하시기 바랍니다.',
    ];

    downloadBlob(lines.join('\n'), `컴플라이언스_점검리포트_${state.org.name}_${now.toISOString().slice(0, 10)}.txt`, 'text/plain;charset=utf-8');
    onToast('점검 리포트를 내려받았습니다.', 'success');
  };

  return (
    <div className="space-y-5">
      {/* 요약 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="cs-card flex flex-col items-center justify-center p-6 text-center">
          <ScoreRing value={audit.score} size={116} stroke={9} />
          <p className="mt-3 font-sans text-[13px] font-bold text-slate-900">
            {audit.grade}등급 · {audit.passed}/{audit.total}개 충족
          </p>
          <p className="mt-1 font-sans text-[11.5px] leading-relaxed text-slate-500">
            점수는 현재 입력된 정보의 완성도를 기준으로 산정됩니다.
          </p>
          <button onClick={exportReport} className="cs-btn-primary cs-btn-sm mt-4">
            <Download className="h-3.5 w-3.5" />
            리포트 다운로드
          </button>
        </section>

        <section className="cs-card p-5 lg:col-span-2">
          <h2 className="cs-section-title">
            <TriangleAlert className="h-[18px] w-[18px] text-amber-600" />
            보완이 필요한 항목 ({audit.gaps.length}건)
          </h2>
          {audit.gaps.length === 0 ? (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
              <p className="font-sans text-[12.5px] font-semibold text-emerald-900">
                모든 점검 항목을 충족하고 있습니다.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {audit.gaps.map((g, i) => {
                const sev = SEVERITY[g.severity];
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
                  >
                    <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', sev.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[12px] font-semibold leading-snug text-slate-800">
                        {g.title}
                      </p>
                      <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-slate-500">{g.detail}</p>
                    </div>
                    <span className={cn('cs-badge shrink-0', sev.chip)}>{sev.label}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            onClick={() => setUi((p) => ({ ...p, view: 'generator' }))}
            className="cs-btn-subtle cs-btn-sm mt-4"
          >
            문서 편집 화면에서 보완하기
          </button>
        </section>
      </div>

      {/* 항목별 결과 */}
      <section className="cs-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="cs-section-title">
            <ShieldCheck className="h-[18px] w-[18px] text-brand-600" />
            항목별 점검 결과
          </h2>
          <label className="flex cursor-pointer select-none items-center gap-2 font-sans text-[11.5px] font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={showPassed}
              onChange={(e) => setShowPassed(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-brand-600"
            />
            충족 항목도 표시
          </label>
        </div>

        <div className="divide-y divide-slate-100">
          {byCategory.map(([category, results]) => {
            const visible = showPassed ? results : results.filter((r) => !r.passed);
            if (visible.length === 0) return null;
            const passed = results.filter((r) => r.passed).length;
            return (
              <div key={category} className="px-5 py-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="font-sans text-[12.5px] font-bold text-slate-800">
                    {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL] ?? category}
                  </h3>
                  <span className="font-mono text-[11px] font-semibold text-slate-400">
                    {passed} / {results.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {visible.map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5',
                        r.passed ? 'border-slate-200 bg-slate-50/50' : 'border-rose-200 bg-rose-50/50',
                      )}
                    >
                      {r.passed ? (
                        <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <CircleDashed className="mt-px h-4 w-4 shrink-0 text-rose-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-[12px] font-medium leading-snug text-slate-800">{r.label}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{r.ref}</p>
                        {!r.passed && r.hint && (
                          <p className="mt-1 flex items-start gap-1 font-sans text-[10.5px] leading-relaxed text-rose-700">
                            <Info className="mt-px h-3 w-3 shrink-0" />
                            {r.hint}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 법적 근거 안내 */}
      <section className="cs-card border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-slate-400" />
          <div>
            <p className="font-sans text-[12.5px] font-bold text-slate-800">점검 기준 안내</p>
            <p className="mt-1 font-sans text-[11.5px] leading-relaxed text-slate-600">
              본 점검은 「개인정보 보호법」 제29조, 제30조, 제34조, 제39조 및 같은 법 시행령,
              「개인정보의 안전성 확보조치 기준」을 기준으로 구성되었습니다. 자동 점수는 참고용이며,
              실제 법정 감사를 위해서는 반드시 담당 법무 담당자의 검토를 거치시기 바랍니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}