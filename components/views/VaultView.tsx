'use client';

import { useMemo, useState } from 'react';
import {
  Archive,
  Download,
  Eye,
  FileText,
  History,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { TEMPLATE_MAP } from '@/lib/catalog';
import { renderDocument } from '@/lib/render';
import { formatKoreanDateTime } from '@/lib/state';
import type { ComplianceStore } from '@/lib/store';
import type { TemplateId } from '@/lib/types';
import { cn, downloadBlob, timeAgo } from '@/lib/utils';
import { EmptyState } from '@/components/ui/Primitives';

export function VaultView({
  store,
  onToast,
}: {
  store: ComplianceStore;
  onToast: (msg: string, tone?: 'success' | 'error' | 'info') => void;
}) {
  const { vault, ui, setUi, state, deleteFromVault, restoreFromVault, resetDocs } = store;
  const [filter, setFilter] = useState<TemplateId | 'all'>('all');

  const items = useMemo(
    () => (filter === 'all' ? vault : vault.filter((v) => v.templateId === filter)),
    [vault, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof vault>();
    for (const item of items) {
      const g = TEMPLATE_MAP[item.templateId]?.group ?? '기타';
      const arr = map.get(g) ?? [];
      arr.push(item);
      map.set(g, arr);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="cs-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="cs-section-title">
            <Archive className="h-[18px] w-[18px] text-brand-600" />
            법정 문서 보관함
          </h2>
          <p className="mt-1 font-sans text-[12px] text-slate-500">
            저장된 문서의 버전과 이력입니다. 브라우저(localStorage)에 보관되며 기기·브라우저를 변경하면
            이전되지 않습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'rounded-md px-3 py-1.5 font-sans text-[11.5px] font-semibold transition',
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
              )}
            >
              전체
            </button>
            {Object.values(TEMPLATE_MAP).map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 font-sans text-[11.5px] font-semibold transition',
                  filter === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {t.title.replace('개인정보 ', '')}
              </button>
            ))}
          </div>
          {vault.length > 0 && (
            <button
              onClick={() => {
                if (confirm('보관함의 모든 문서를 삭제할까요? 되돌릴 수 없습니다.')) {
                  resetDocs();
                  onToast('보관함을 모두 삭제했습니다.', 'info');
                }
              }}
              className="cs-btn-danger cs-btn-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Archive className="h-6 w-6" />}
          title="보관된 문서가 없습니다"
          description="문서 작성 화면에서 「버전 저장」을 누르면 현재 문서가 여기에 버전 단위로 보관됩니다."
          action={
            <button
              onClick={() => setUi((p) => ({ ...p, view: 'generator' }))}
              className="cs-btn-primary"
            >
              문서 작성하러 가기
            </button>
          }
        />
      ) : (
        grouped.map(([group, list]) => (
          <section key={group} className="cs-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h3 className="font-sans text-[13px] font-bold text-slate-900">{group}</h3>
              <span className="cs-badge border-slate-200 bg-slate-50 text-slate-500">{list.length}건</span>
            </div>

            <div className="divide-y divide-slate-100">
              {list.map((doc) => {
                const meta = TEMPLATE_MAP[doc.templateId];
                return (
                  <div key={doc.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <FileText className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-sans text-[13px] font-bold text-slate-900">{doc.title}</p>
                        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {doc.version}
                        </span>
                      </div>
                      <p className="mt-0.5 font-sans text-[11px] text-slate-500">
                        {doc.state.org.name} · 최종 저장 {timeAgo(doc.updatedAt)} ·{' '}
                        {formatKoreanDateTime(doc.updatedAt)}
                        {doc.author && ` · 승인자 ${doc.author}`}
                      </p>
                      <p className="mt-0.5 font-mono text-[10.5px] text-slate-400">
                        {meta?.legalRef} · 약 {doc.plainText.replace(/\s/g, '').length.toLocaleString()}자
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          restoreFromVault(doc.id);
                          setUi((p) => ({ ...p, templateId: doc.templateId, view: 'generator' }));
                          onToast('저장된 버전으로 복원했습니다.', 'success');
                        }}
                        className="cs-btn-ghost cs-btn-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        불러오기
                      </button>
                      <button
                        onClick={() => {
                          const rendered = renderDocument(doc.templateId, doc.state);
                          downloadBlob(
                            doc.plainText,
                            `${rendered.fileSlug}.txt`,
                            'text/plain;charset=utf-8',
                          );
                          onToast('문서를 내려받았습니다.', 'success');
                        }}
                        className="cs-btn-ghost cs-btn-sm"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          deleteFromVault(doc.id);
                          onToast('보관함에서 삭제했습니다.', 'info');
                        }}
                        className="cs-btn-danger cs-btn-sm"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* 현재 작업 문서 비교 안내 */}
      <div className="cs-card flex flex-wrap items-center justify-between gap-3 border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-sans text-[12.5px] font-bold text-slate-800">
              현재 편집 중인 문서와 보관본이 다를 수 있습니다
            </p>
            <p className="mt-0.5 font-sans text-[11.5px] text-slate-500">
              버전 저장 버튼을 누르면 현재 상태({state.org.version})가 새 버전으로 갱신됩니다.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const doc = renderDocument(ui.templateId, state);
            store.saveToVault(ui.templateId, TEMPLATE_MAP[ui.templateId].title, doc.plainText);
            onToast('현재 버전을 저장했습니다.', 'success');
          }}
          className="cs-btn-primary cs-btn-sm"
        >
          <History className="h-3.5 w-3.5" />
          현재 버전 저장
        </button>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => {
            if (confirm('전체 데이터를 초기화할까요? 문서와 보관함이 모두 삭제됩니다.')) {
              store.resetAll();
              onToast('모든 데이터를 초기화했습니다.', 'info');
            }
          }}
          className="inline-flex items-center gap-1.5 font-sans text-[11.5px] font-semibold text-slate-400 transition hover:text-rose-600"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          전체 데이터 초기화
        </button>
      </div>
    </div>
  );
}