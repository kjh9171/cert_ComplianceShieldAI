'use client';

import { cn } from '@/lib/utils';

export function Toast({
  message,
  tone = 'success',
  onClose,
}: {
  message: string;
  tone?: 'success' | 'error' | 'info';
  onClose?: () => void;
}) {
  const tones = {
    success: 'border-emerald-200 bg-emerald-600 text-white',
    error: 'border-rose-200 bg-rose-600 text-white',
    info: 'border-brand-200 bg-brand-700 text-white',
  }[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto fixed bottom-6 left-1/2 z-[60] flex max-w-[92vw] -translate-x-1/2 items-center gap-2.5',
        'animate-fade-up rounded-xl border px-4 py-3 shadow-lift',
        tones,
      )}
    >
      <span className="text-[13px] font-semibold">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-1 rounded px-1 text-lg leading-none opacity-70 transition hover:opacity-100"
          aria-label="알림 닫기"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function ScoreRing({
  value,
  size = 76,
  stroke = 7,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const tone =
    pct >= 90 ? '#059669' : pct >= 70 ? '#d97706' : '#e11d48';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`점수 ${pct}점`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-[17px] font-bold leading-none"
          style={{ color: tone }}
        >
          {pct}
        </span>
        {label && <span className="mt-0.5 text-[9px] font-semibold text-slate-400">{label}</span>}
      </div>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = 'brand',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'brand' | 'emerald' | 'amber' | 'sky' | 'rose';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  }[tone];

  return (
    <div className="cs-card flex items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate font-sans text-[11.5px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 font-mono text-[19px] font-bold leading-tight tracking-tight text-slate-900">
          {value}
        </p>
        {sub && <p className="mt-1 truncate font-sans text-[11px] text-slate-400">{sub}</p>}
      </div>
      <div className={cn('shrink-0 rounded-xl p-2.5 ring-1 ring-inset', tones)}>{icon}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <div className="mb-3.5 rounded-2xl bg-slate-100 p-3.5 text-slate-400">{icon}</div>
      <p className="font-sans text-[14px] font-bold text-slate-800">{title}</p>
      <p className="mt-1.5 max-w-sm font-sans text-[12.5px] leading-relaxed text-slate-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:500px_100%] animate-shimmer',
        className,
      )}
    />
  );
}