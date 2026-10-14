'use client';

import { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ClipboardCopy,
  Download,
  FileText,
  History,
  Layers,
  Lock,
  Plus,
  Scale,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { INDUSTRY_PRESETS, PII_CATALOG, SAFEGUARD_CATALOG, TEMPLATE_MAP } from '@/lib/catalog';
import { renderDocument } from '@/lib/render';
import { formatKoreanDate, toISODate } from '@/lib/state';
import type { DocState, IndustryKey, RenderedDoc, TemplateId } from '@/lib/types';
import { cn, copyToClipboard, downloadBlob } from '@/lib/utils';
import DocumentPreview from '@/components/DocumentPreview';
import { ChatPanel } from '@/components/ChatPanel';
import type { ComplianceStore } from '@/lib/store';

type Section = 'org' | 'pii' | 'safeguard' | 'partners' | 'policy';

const SECTIONS: { id: Section; label: string; icon: typeof Building2 }[] = [
  { id: 'org', label: '기업 · CPO', icon: Building2 },
  { id: 'pii', label: '수집 항목', icon: FileText },
  { id: 'safeguard', label: '보호조치', icon: Lock },
  { id: 'partners', label: '위탁 · 제공 · 국외이전', icon: Layers },
  { id: 'policy', label: '운영 정책', icon: Scale },
];

export function GeneratorView({
  store,
  onToast,
}: {
  store: ComplianceStore;
  onToast: (msg: string, tone?: 'success' | 'error' | 'info') => void;
}) {
  const { state, ui, setUi, setState, setField, setCpo, setOfficer, setIndustry } = store;
  const [section, setSection] = useState<Section>('org');
  const [exporting, setExporting] = useState<string | null>(null);

  const doc: RenderedDoc = useMemo(
    () => renderDocument(ui.templateId, state),
    [ui.templateId, state],
  );
  const meta = TEMPLATE_MAP[ui.templateId];

  const setTemplate = (id: TemplateId) => setUi((prev) => ({ ...prev, templateId: id, view: 'generator' }));

  /* ── 내보내기 ───────────────────────────────────────────── */
  const doExport = async (format: 'docx' | 'pdf' | 'md' | 'txt' | 'hwp') => {
    setExporting(format);
    try {
      if (format === 'pdf') {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: ui.templateId, format, state }),
        });
        const html = await res.text();
        if (!res.ok) throw new Error('PDF 준비에 실패했습니다.');
        const win = window.open('', '_blank', 'width=900,height=1100');
        if (!win) {
          onToast('팝업이 차단되었습니다. 팝업을 허용해 주세요.', 'error');
          return;
        }
        win.document.write(html);
        win.document.close();
        return;
      }

      if (format === 'docx') {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: ui.templateId, format, state }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error ?? 'DOCX 생성에 실패했습니다.');
        }
        const blob = await res.blob();
        downloadBlob(blob, `${doc.fileSlug}.docx`, blob.type);
      } else {
        const text = format === 'md' ? doc.markdown : doc.plainText;
        const ext = format === 'hwp' ? 'hwp.txt' : format;
        downloadBlob(
          text,
          `${doc.fileSlug}.${ext}`,
          format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
        );
      }
      onToast(`${format.toUpperCase()} 파일을 내려받았습니다.`, 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : '내보내기에 실패했습니다.', 'error');
    } finally {
      setExporting(null);
    }
  };

  const doCopy = async () => {
    const ok = await copyToClipboard(doc.plainText);
    onToast(ok ? '문서 전체를 클립보드에 복사했습니다.' : '복사에 실패했습니다.', ok ? 'success' : 'error');
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      {/* ── 좌: 설정 패널 ─────────────────────────────────── */}
      <div className="space-y-4 xl:col-span-4 2xl:col-span-3">
        {/* 문서 종류 */}
        <div className="cs-card p-4">
          <label className="cs-label" htmlFor="tpl">
            생성할 문서 종류
          </label>
          <div className="relative">
            <select
              id="tpl"
              value={ui.templateId}
              onChange={(e) => setTemplate(e.target.value as TemplateId)}
              className="cs-input cursor-pointer appearance-none pr-9 font-semibold"
            >
              {Object.values(TEMPLATE_MAP).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <p className="mt-2 font-sans text-[11px] leading-relaxed text-slate-500">{meta.description}</p>
          <p className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
            {meta.legalRef}
          </p>
        </div>

        {/* 섹션 탭 */}
        <div className="cs-card overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-100">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 font-sans text-[11.5px] font-semibold transition',
                    active
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>

          <div className="max-h-[620px] overflow-y-auto p-4 cs-scroll-thin">
            {section === 'org' && (
              <OrgSection
                state={state}
                onField={setField}
                onCpo={setCpo}
                onOfficer={setOfficer}
                onIndustry={setIndustry}
              />
            )}
            {section === 'pii' && <PiiSection store={store} />}
            {section === 'safeguard' && <SafeguardSection store={store} />}
            {section === 'partners' && <PartnersSection store={store} />}
            {section === 'policy' && <PolicySection store={store} />}
          </div>
        </div>
      </div>

      {/* ── 우: 미리보기 + 내보내기 ───────────────────────── */}
      <div className="space-y-4 xl:col-span-8 2xl:col-span-9">
        <div className="cs-card overflow-hidden">
          {/* 툴바 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-brand-600" />
              <div className="min-w-0">
                <p className="truncate font-sans text-[13px] font-bold text-slate-900">실시간 문서 미리보기</p>
                <p className="truncate font-sans text-[10.5px] text-slate-500">
                  {state.org.name} · {meta.title} · 약 {doc.wordCount.toLocaleString()}자
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {(
                  [
                    ['rendered', '서식'],
                    ['text', '텍스트'],
                    ['markdown', 'Markdown'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setUi((p) => ({ ...p, previewMode: key }))}
                    className={cn(
                      'rounded-md px-2.5 py-1 font-sans text-[11px] font-semibold transition',
                      ui.previewMode === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 미리보기 본문 */}
          <div className="max-h-[calc(100vh-340px)] min-h-[520px] overflow-y-auto bg-slate-50 p-4 cs-scroll-thin sm:p-6">
            <div className="mx-auto max-w-[860px] rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10">
              {ui.previewMode === 'rendered' && <DocumentPreview blocks={doc.blocks} />}
              {ui.previewMode === 'text' && (
                <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-slate-700">
                  {doc.plainText}
                </pre>
              )}
              {ui.previewMode === 'markdown' && (
                <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-slate-700">
                  {doc.markdown}
                </pre>
              )}
            </div>
          </div>

          {/* 내보내기 바 */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white px-4 py-3">
            <button
              onClick={() => doExport('docx')}
              disabled={exporting !== null}
              className="cs-btn-primary cs-btn-sm"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting === 'docx' ? '생성 중…' : 'DOCX'}
            </button>
            <button
              onClick={() => doExport('pdf')}
              disabled={exporting !== null}
              className="cs-btn-ghost cs-btn-sm"
              title="A4 인쇄 최적화 화면이 열립니다. 인쇄 대화상자에서 'PDF로 저장'을 선택하세요."
            >
              <FileText className="h-3.5 w-3.5 text-rose-600" />
              PDF
            </button>
            <button onClick={() => doExport('md')} className="cs-btn-ghost cs-btn-sm">
              Markdown
            </button>
            <button onClick={() => doExport('txt')} className="cs-btn-ghost cs-btn-sm">
              텍스트
            </button>
            <button
              onClick={() => doExport('hwp')}
              className="cs-btn-ghost cs-btn-sm"
              title="HWP 한글 프로그램에 붙여넣을 수 있는 공백 서식 텍스트"
            >
              HWP 호환
            </button>
            <button onClick={doCopy} className="cs-btn-ghost cs-btn-sm">
              <ClipboardCopy className="h-3.5 w-3.5 text-brand-600" />
              전체 복사
            </button>
            <button
              onClick={() => {
                store.saveToVault(ui.templateId, meta.title, doc.plainText);
                onToast('보관함에 저장했습니다.', 'success');
              }}
              className="cs-btn-subtle cs-btn-sm ml-auto"
            >
              <History className="h-3.5 w-3.5" />
              버전 저장
            </button>
          </div>
        </div>

        {/* AI 채팅 */}
        <div className="cs-card h-[520px] overflow-hidden">
          <ChatPanel
            state={state}
            templateId={ui.templateId}
            onStateChange={setState}
            onTemplateChange={setTemplate}
            onToast={onToast}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  섹션 컴포넌트                                                        */
/* ================================================================== */

function OrgSection({
  state,
  onField,
  onCpo,
  onOfficer,
  onIndustry,
}: {
  state: DocState;
  onField: <K extends keyof DocState['org']>(k: K, v: DocState['org'][K]) => void;
  onCpo: (k: keyof DocState['org']['cpo'], v: string) => void;
  onOfficer: (k: keyof DocState['org']['officer'], v: string) => void;
  onIndustry: (k: IndustryKey) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="회사 / 기관명" required>
        <input
          className="cs-input"
          value={state.org.name}
          onChange={(e) => onField('name', e.target.value)}
          placeholder="주식회사 ○○"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="사업자등록번호">
          <input
            className="cs-input font-mono"
            value={state.org.bizNumber}
            onChange={(e) => onField('bizNumber', e.target.value)}
            placeholder="123-45-67890"
          />
        </Field>
        <Field label="대표이사">
          <input
            className="cs-input"
            value={state.org.ceo}
            onChange={(e) => onField('ceo', e.target.value)}
          />
        </Field>
      </div>

      <Field label="업종" hint="선택하면 업종 특화 항목이 자동 구성됩니다.">
        <select
          className="cs-input cursor-pointer"
          value={state.org.industry}
          onChange={(e) => onIndustry(e.target.value as IndustryKey)}
        >
          {Object.values(INDUSTRY_PRESETS).map((i) => (
            <option key={i.key} value={i.key}>
              {i.emoji} {i.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="임직원 규모">
        <input
          className="cs-input"
          value={state.org.employeeCount}
          onChange={(e) => onField('employeeCount', e.target.value)}
          placeholder="예: 51~100명"
        />
      </Field>

      <Field label="본사 소재지">
        <input
          className="cs-input"
          value={state.org.address}
          onChange={(e) => onField('address', e.target.value)}
        />
      </Field>

      <Field label="데이터 보관 위치" hint="국외 서버 사용 시 국외이전 조항이 필요합니다.">
        <input
          className="cs-input"
          value={state.org.masterDataCenter}
          onChange={(e) => onField('masterDataCenter', e.target.value)}
        />
      </Field>

      <hr className="border-slate-100" />

      <p className="font-sans text-[12px] font-bold text-slate-800">
        개인정보 보호책임자 <span className="text-rose-500">*</span>
      </p>
      <p className="-mt-2 font-sans text-[10.5px] leading-relaxed text-slate-500">
        법 제39조에 따라 반드시 공개해야 하는 정보입니다.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="성명">
          <input className="cs-input" value={state.org.cpo.name} onChange={(e) => onCpo('name', e.target.value)} />
        </Field>
        <Field label="직책">
          <input className="cs-input" value={state.org.cpo.title} onChange={(e) => onCpo('title', e.target.value)} />
        </Field>
        <Field label="이메일">
          <input
            className="cs-input font-mono"
            value={state.org.cpo.email}
            onChange={(e) => onCpo('email', e.target.value)}
            placeholder="privacy@company.co.kr"
          />
        </Field>
        <Field label="직통 전화">
          <input
            className="cs-input font-mono"
            value={state.org.cpo.phone}
            onChange={(e) => onCpo('phone', e.target.value)}
            placeholder="02-000-0000"
          />
        </Field>
      </div>
      <Field label="소속 부서">
        <input className="cs-input" value={state.org.cpo.dept ?? ''} onChange={(e) => onCpo('dept', e.target.value)} />
      </Field>

      <hr className="border-slate-100" />

      <p className="font-sans text-[12px] font-bold text-slate-800">선정업무 담당자 (법 제39조 제2항)</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="성명">
          <input
            className="cs-input"
            value={state.org.officer.name}
            onChange={(e) => onOfficer('name', e.target.value)}
          />
        </Field>
        <Field label="직책">
          <input
            className="cs-input"
            value={state.org.officer.title}
            onChange={(e) => onOfficer('title', e.target.value)}
          />
        </Field>
        <Field label="이메일">
          <input
            className="cs-input font-mono"
            value={state.org.officer.email}
            onChange={(e) => onOfficer('email', e.target.value)}
          />
        </Field>
        <Field label="전화">
          <input
            className="cs-input font-mono"
            value={state.org.officer.phone}
            onChange={(e) => onOfficer('phone', e.target.value)}
          />
        </Field>
      </div>

      <hr className="border-slate-100" />

      <p className="font-sans text-[12px] font-bold text-slate-800">문서 관리 정보</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="문서 관리번호">
          <input
            className="cs-input font-mono"
            value={state.org.docNumber}
            onChange={(e) => onField('docNumber', e.target.value)}
          />
        </Field>
        <Field label="버전">
          <input
            className="cs-input font-mono"
            value={state.org.version}
            onChange={(e) => onField('version', e.target.value)}
          />
        </Field>
        <Field label="시행일자">
          <input
            type="date"
            className="cs-input"
            value={state.org.effectiveDate}
            onChange={(e) => onField('effectiveDate', e.target.value)}
          />
        </Field>
        <Field label="차기 검토일">
          <input
            type="date"
            className="cs-input"
            value={state.org.nextReview}
            onChange={(e) => onField('nextReview', e.target.value)}
          />
        </Field>
      </div>
      <Field label="승인 기구">
        <input
          className="cs-input"
          value={state.org.approvalBody}
          onChange={(e) => onField('approvalBody', e.target.value)}
          placeholder="대표이사"
        />
      </Field>
    </div>
  );
}

function PiiSection({ store }: { store: ComplianceStore }) {
  const { state, togglePii, removeRetention, setState } = store;
  const categories = useMemo(() => {
    const map = new Map<string, typeof PII_CATALOG>();
    for (const item of PII_CATALOG) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[12px] font-semibold text-slate-700">
          선택 항목 <span className="text-brand-600">{state.processing.piiIds.length}</span>개
        </p>
        <button
          onClick={() =>
            setState((prev) => ({
              ...prev,
              processing: { ...prev.processing, piiIds: PII_CATALOG.map((p) => p.id) },
            }))
          }
          className="font-sans text-[11px] font-semibold text-brand-700 hover:underline"
        >
          전체 선택
        </button>
      </div>

      {categories.map(([cat, items]) => (
        <div key={cat}>
          <p className="mb-1.5 font-sans text-[11px] font-bold text-slate-500">{cat}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => {
              const on = state.processing.piiIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => togglePii(item.id)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 font-sans text-[11.5px] font-medium transition',
                    on
                      ? item.sensitive
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-brand-300 bg-brand-50 text-brand-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {item.label}
                  {item.sensitive && <span className="ml-1 text-[9px] font-bold">민감</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <hr className="border-slate-100" />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-sans text-[12px] font-bold text-slate-800">보유 · 이용 기간</p>
        </div>
        <div className="space-y-1.5">
          {state.processing.retentionRules.map((r) => (
            <div
              key={r.id}
              className="group flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-sans text-[11.5px] font-semibold text-slate-800">{r.item}</p>
                <p className="truncate font-sans text-[10.5px] text-slate-500">
                  {r.period} · {r.basis}
                </p>
              </div>
              <button
                onClick={() => removeRetention(r.id)}
                className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-rose-600"
                aria-label="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                processing: {
                  ...prev.processing,
                  retentionRules: [
                    ...prev.processing.retentionRules,
                    { id: `rt_${Date.now()}`, item: '새 항목', period: '1년', basis: '회사 내부 기준' },
                  ],
                },
              }))
            }
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 font-sans text-[11.5px] font-semibold text-slate-500 transition hover:border-brand-400 hover:text-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            보유 항목 추가
          </button>
        </div>
      </div>

    </div>
  );
}

function SafeguardSection({ store }: { store: ComplianceStore }) {
  const { state, toggleSafeguard } = store;
  const categories = useMemo(() => {
    const map = new Map<string, typeof SAFEGUARD_CATALOG>();
    for (const item of SAFEGUARD_CATALOG) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return [...map.entries()];
  }, []);

  const tone = {
    기술적: 'border-sky-200 bg-sky-50 text-sky-800',
    관리적: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    물리적: 'border-amber-200 bg-amber-50 text-amber-800',
  } as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[12px] font-semibold text-slate-700">
          적용 항목 <span className="text-emerald-600">{state.processing.safeguardIds.length}</span>개
        </p>
        <button
          onClick={() =>
            store.setState((prev) => ({
              ...prev,
              processing: {
                ...prev.processing,
                safeguardIds: SAFEGUARD_CATALOG.map((s) => s.id),
              },
            }))
          }
          className="font-sans text-[11px] font-semibold text-brand-700 hover:underline"
        >
          전부 적용
        </button>
      </div>

      {categories.map(([cat, items]) => (
        <div key={cat}>
          <p
            className={cn(
              'mb-1.5 inline-block rounded-md border px-2 py-0.5 font-sans text-[10.5px] font-bold',
              tone[cat as keyof typeof tone],
            )}
          >
            {cat}적 보호조치
          </p>
          <div className="space-y-1">
            {items.map((item) => {
              const on = state.processing.safeguardIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleSafeguard(item.id)}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition',
                    on ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border',
                      on ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white',
                    )}
                  >
                    {on && <span className="text-[10px] leading-none">✓</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-[11.5px] font-medium leading-snug text-slate-800">
                      {item.label}
                    </span>
                    <span className="block font-mono text-[9.5px] text-slate-400">{item.legalRef}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function PartnersSection({ store }: { store: ComplianceStore }) {
  const { state, removeEntrusted, removeThirdParty, removeOverseas } = store;
  const p = state.processing;

  const Row = ({
    title,
    items,
    onRemove,
    empty,
  }: {
    title: string;
    items: { id: string; lines: [string, string][] }[];
    onRemove: (id: string) => void;
    empty: string;
  }) => (
    <div>
      <p className="mb-1.5 font-sans text-[12px] font-bold text-slate-800">{title}</p>
      <div className="space-y-1.5">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-center font-sans text-[11px] text-slate-400">
            {empty}
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="group rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate font-sans text-[11.5px] font-bold text-slate-800">
                {item.lines[0][1]}
              </p>
              <button
                onClick={() => onRemove(item.id)}
                className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-rose-600"
                aria-label="삭제"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {item.lines.slice(1).map(([k, v], i) => (
              <p key={i} className="truncate font-sans text-[10.5px] text-slate-500">
                {k}: {v}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <Row
        title={`처리위탁 (${p.entrusted.length})`}
        empty="위탁 업체가 없습니다. AI 채팅에서 추가할 수 있습니다."
        onRemove={removeEntrusted}
        items={p.entrusted.map((e) => ({
          id: e.id,
          lines: [
            ['수탁자', e.entity],
            ['위탁 목적', e.purpose],
            ['처리 항목', e.items],
            ['위탁 기간', e.period],
          ] as [string, string][],
        }))}
      />
      <Row
        title={`제3자 제공 (${p.thirdParties.length})`}
        empty="제3자 제공 대상이 없습니다."
        onRemove={removeThirdParty}
        items={p.thirdParties.map((t) => ({
          id: t.id,
          lines: [
            ['제공 대상', t.entity],
            ['제공 목적', t.purpose],
            ['제공 항목', t.items],
            ['제공 방법', t.method],
          ] as [string, string][],
        }))}
      />
      <Row
        title={`국외이전 (${p.overseas.length})`}
        empty="국외이전이 없습니다. 해외 서버를 사용한다면 반드시 추가하세요."
        onRemove={removeOverseas}
        items={p.overseas.map((o) => ({
          id: o.id,
          lines: [
            ['국가 · 수신자', `${o.country} · ${o.entity}`],
            ['이전 항목', o.items],
            ['이전 방법', o.method],
          ] as [string, string][],
        }))}
      />
      <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 font-sans text-[11px] leading-relaxed text-brand-900">
        항목 추가·수정은 좌측 AI 채팅에서 자연어로 요청하시면 됩니다.
        예) &ldquo;아마존웹서비스에 서버 운영을 위탁해줘&rdquo;
      </p>
    </div>
  );
}

function PolicySection({ store }: { store: ComplianceStore }) {
  const { state, setState } = store;
  const p = state.processing;

  const set = (key: keyof typeof p, value: string) =>
    setState((prev) => ({ ...prev, processing: { ...prev.processing, [key]: value } }));

  const fields: { key: keyof typeof p; label: string; rows: number }[] = [
    { key: 'logRetention', label: '접속기록 보관 기간', rows: 2 },
    { key: 'inspectionCycle', label: '정기 점검 주기', rows: 2 },
    { key: 'entrustedAuditCycle', label: '수탁자 실태조사 주기', rows: 2 },
    { key: 'trainingPolicy', label: '교육 및 비밀유지 정책', rows: 4 },
    { key: 'internalReporting', label: '내부 사고 신고 절차', rows: 4 },
    { key: 'destructionMethod', label: '개인정보 파기 절차 및 방법', rows: 4 },
    { key: 'valueVerificationPolicy', label: '위탁 · 제3자 제공 대가 검증', rows: 4 },
    { key: 'automatedDecision', label: '자동화된 결정 관련 문구', rows: 4 },
    { key: 'irTeam', label: '비상대책반 구성', rows: 3 },
  ];

  return (
    <div className="space-y-3.5">
      {fields.map((f) => (
        <Field key={String(f.key)} label={f.label}>
          <textarea
            rows={f.rows}
            className="cs-input resize-y leading-relaxed"
            value={String(p[f.key] ?? '')}
            onChange={(e) => set(f.key, e.target.value)}
          />
        </Field>
      ))}

      <div>
        <p className="cs-label">처리 목적</p>
        <div className="space-y-1">
          {p.purposes.map((x, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
              <span className="mt-0.5 font-mono text-[10px] font-bold text-slate-400">{i + 1}</span>
              <p className="flex-1 font-sans text-[11.5px] leading-snug text-slate-700">{x}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="cs-label">개인정보처리시스템</p>
        <div className="flex flex-wrap gap-1.5">
          {p.services.map((s, i) => (
            <span
              key={i}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-sans text-[11px] text-slate-600"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-sans text-[11px] leading-relaxed text-slate-600">
        최종 정리 기준일 {formatKoreanDate(state.org.lastRevised)} · 다음 정기 검토{' '}
        {formatKoreanDate(state.org.nextReview)} ({toISODate(new Date())} 기준 계산)
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="cs-label">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 font-sans text-[10.5px] leading-snug text-slate-400">{hint}</p>}
    </div>
  );
}
