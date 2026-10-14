'use client';

import { useState } from 'react';
import {
  Archive,
  BookOpen,
  ChevronDown,
  Gauge,
  Globe,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { TEMPLATE_META, TEMPLATE_MAP } from '@/lib/catalog';
import type { UiPrefs } from '@/lib/store';
import type { DocState, TemplateId } from '@/lib/types';
import { cn } from '@/lib/utils';

const NAV: { id: UiPrefs['view']; label: string; short: string; icon: typeof Archive }[] = [
  { id: 'dashboard', label: '대시보드', short: '대시보드', icon: Gauge },
  { id: 'generator', label: 'AI 문서 작성', short: '문서 작성', icon: Sparkles },
  { id: 'vault', label: '문서 보관함', short: '보관함', icon: Archive },
  { id: 'audit', label: '컴플라이언스 점검', short: '점검', icon: BookOpen },
  { id: 'deploy', label: '배포 · API', short: '배포 · API', icon: Rocket },
];

export function AppHeader({
  state,
  ui,
  onViewChange,
  onTemplateChange,
  onNewDoc,
}: {
  state: DocState;
  ui: UiPrefs;
  onViewChange: (v: UiPrefs['view']) => void;
  onTemplateChange: (id: TemplateId) => void;
  onNewDoc: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const current = TEMPLATE_MAP[ui.templateId];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* 브랜드 */}
        <button
          onClick={() => onViewChange('dashboard')}
          className="group flex min-w-0 items-center gap-3 text-left"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/25 transition-transform group-hover:scale-105">
            <ShieldCheck className="h-[22px] w-[22px]" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-[16px] font-extrabold tracking-tight text-slate-900 sm:text-[17px]">
                ComplianceShield AI
              </span>
              <span className="hidden rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 sm:inline">
                B2B SaaS
              </span>
            </span>
            <span className="hidden truncate text-[11.5px] text-slate-500 sm:block">
              법정 개인정보 컴플라이언스 문서 자동 생성 · 관리
            </span>
          </span>
        </button>

        {/* 우측 액션 */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative hidden md:block">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex max-w-[260px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50"
              aria-expanded={menuOpen}
              aria-haspopup="listbox"
            >
              <span className="min-w-0">
                <span className="block truncate font-sans text-[10.5px] font-medium text-slate-400">
                  작업 중인 문서
                </span>
                <span className="block truncate font-sans text-[12.5px] font-bold text-slate-800">
                  {current?.title}
                </span>
              </span>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 text-slate-400 transition', menuOpen && 'rotate-180')}
              />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <ul
                  role="listbox"
                  className="absolute right-0 z-20 mt-2 w-[300px] animate-fade-up overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift"
                >
                  {TEMPLATE_META.map((t) => (
                    <li key={t.id}>
                      <button
                        role="option"
                        aria-selected={ui.templateId === t.id}
                        onClick={() => {
                          onTemplateChange(t.id);
                          setMenuOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition',
                          ui.templateId === t.id
                            ? 'bg-brand-50 text-brand-900'
                            : 'hover:bg-slate-50',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-sans text-[12.5px] font-bold">
                            {t.title}
                          </span>
                          <span className="block truncate font-sans text-[10.5px] text-slate-500">
                            {t.legalRef}
                          </span>
                        </span>
                        {t.required && (
                          <span className="shrink-0 rounded border border-rose-200 bg-rose-50 px-1.5 text-[9.5px] font-bold text-rose-700">
                            필수
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <button onClick={onNewDoc} className="cs-btn-primary">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">새 문서 생성</span>
          </button>
        </div>
      </div>

      {/* 내비게이션 */}
      <nav className="border-t border-slate-100 bg-white" aria-label="주요 메뉴">
        <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-3 sm:px-5">
          {NAV.map((item) => {
            const active = ui.view === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 font-sans text-[13px] font-semibold transition-colors',
                  active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.short}</span>
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-[2.5px] rounded-full bg-brand-600" />
                )}
              </button>
            );
          })}

          <div className="ml-auto hidden items-center gap-2 pl-4 text-[11px] text-slate-400 lg:flex">
            <Globe className="h-3.5 w-3.5" />
            <span>{state.org.masterDataCenter}</span>
          </div>
        </div>
      </nav>
    </header>
  );
}

export { NAV };