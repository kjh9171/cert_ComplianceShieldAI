'use client';

import { useMemo } from 'react';
import { Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { Block } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  블록 렌더러 — 미리보기 / 인쇄 / DOCX가 동일한 블록 모델을 사용합니다.  */
/* ------------------------------------------------------------------ */

function Title({ text, subtitle }: { text: string; subtitle?: string }) {
  return (
    <header className="mb-7 text-center">
      <h1 className="font-serif text-[22px] font-bold leading-snug tracking-tight text-slate-900">
        {text}
      </h1>
      {subtitle && (
        <p className="mt-1.5 font-sans text-[11px] font-medium tracking-wide text-slate-400">
          {subtitle}
        </p>
      )}
      <div className="mx-auto mt-4 h-[2px] w-20 rounded-full bg-brand-500" />
    </header>
  );
}

function MetaTable({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
      {rows.map(([k, v], i) => (
        <div
          key={`${k}-${i}`}
          className={`flex gap-3 px-4 py-2 text-[12.5px] ${
            i !== rows.length - 1 ? 'border-b border-slate-200/70' : ''
          }`}
        >
          <dt className="w-28 shrink-0 font-sans font-semibold text-slate-500">{k}</dt>
          <dd className="flex-1 break-words font-sans text-slate-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function DataTable({
  head,
  rows,
  widths,
}: {
  head: string[];
  rows: string[][];
  widths?: number[];
}) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <colgroup>
          {(widths ?? head.map(() => 100 / head.length)).map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-brand-50/70">
            {head.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 font-sans text-[11.5px] font-bold text-brand-800"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="align-top even:bg-slate-50/40">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`border-b border-slate-100 px-3 py-2.5 text-[12px] leading-relaxed text-slate-700 ${
                    ci === 0 ? 'text-center font-sans font-semibold text-slate-400' : ''
                  }`}
                >
                  {cell || '—'}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="px-3 py-6 text-center text-[12px] text-slate-400">
                해당 항목이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Note({
  tone,
  title,
  text,
}: {
  tone: 'info' | 'warn' | 'danger';
  title?: string;
  text: string;
}) {
  const map = {
    info: {
      wrap: 'border-brand-200 bg-brand-50/60',
      icon: <Info className="h-3.5 w-3.5 shrink-0 text-brand-600" />,
      label: 'text-brand-800',
    },
    warn: {
      wrap: 'border-amber-200 bg-amber-50/70',
      icon: <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-600" />,
      label: 'text-amber-800',
    },
    danger: {
      wrap: 'border-rose-200 bg-rose-50/70',
      icon: <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-rose-600" />,
      label: 'text-rose-800',
    },
  }[tone];

  return (
    <div className={`my-4 flex gap-2.5 rounded-xl border px-4 py-3 ${map.wrap}`}>
      {map.icon}
      <div className="min-w-0">
        {title && (
          <p className={`mb-0.5 font-sans text-[11.5px] font-bold ${map.label}`}>참고 — {title}</p>
        )}
        <p className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-slate-700">
          {text}
        </p>
      </div>
    </div>
  );
}

function Heading({ level, num, text }: { level: 1 | 2 | 3; num?: string; text: string }) {
  const label = `${num ? `${num} ` : ''}${text}`;
  if (level === 1) {
    return (
      <h2 className="mb-3 mt-9 border-b border-slate-200 pb-2 font-sans text-[14.5px] font-extrabold tracking-tight text-slate-900 first:mt-0">
        {label}
      </h2>
    );
  }
  return (
    <h3 className="mb-1.5 mt-5 font-sans text-[13px] font-bold tracking-tight text-slate-800 first:mt-0">
      {label}
    </h3>
  );
}

function ListBlock({ ordered, items }: { ordered?: boolean; items: string[] }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`my-2.5 space-y-1.5 ${ordered ? 'list-none' : 'list-none'}`}>
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-slate-800">
          <span
            className={`mt-[3px] shrink-0 font-sans text-[11px] font-bold ${
              ordered ? 'text-brand-600' : 'text-slate-400'
            }`}
          >
            {ordered ? `${i + 1}.` : '·'}
          </span>
          <span className="flex-1 break-words">{it}</span>
        </li>
      ))}
    </Tag>
  );
}

function Signature({ roles }: { roles: string[] }) {
  return (
    <div className="mt-9 space-y-2.5 border-t border-slate-200 pt-6 font-sans">
      {roles.map((r, i) => (
        <p
          key={i}
          className={`text-[13px] ${
            r.includes('위탁자') || r.includes('수탁자') ? 'font-semibold text-slate-700' : 'text-right font-semibold text-slate-800'
          }`}
        >
          {r === '' ? '\u00A0' : r}
        </p>
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'title':
      return <Title text={block.text} subtitle={block.subtitle} />;
    case 'meta':
      return <MetaTable rows={block.rows} />;
    case 'heading':
      return <Heading level={block.level} num={block.num} text={block.text} />;
    case 'paragraph':
      return (
        <p className="mb-3 break-words text-justify text-[13.5px] leading-[1.9] text-slate-800">
          {block.text}
        </p>
      );
    case 'list':
      return <ListBlock ordered={block.ordered} items={block.items} />;
    case 'table':
      return <DataTable head={block.head} rows={block.rows} widths={block.widths} />;
    case 'note':
      return <Note tone={block.tone} title={block.title} text={block.text} />;
    case 'signature':
      return <Signature roles={block.roles} />;
    case 'appendix':
      return (
        <section className="mt-10 border-t-2 border-dashed border-slate-200 pt-6">
          <h3 className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-sans text-[12px] font-bold text-slate-700">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            [별첨] {block.title}
          </h3>
          <div>
            {block.blocks.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
          </div>
        </section>
      );
    case 'divider':
      return <hr className="my-6 border-slate-200" />;
    case 'pagebreak':
      return <hr className="my-8 border-slate-100" />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  공개 컴포넌트                                                         */
/* ------------------------------------------------------------------ */

export function DocumentPreview({ blocks }: { blocks: Block[] }) {
  const nodes = useMemo(
    () => blocks.map((b, i) => <BlockView key={i} block={b} />),
    [blocks],
  );
  return <article className="cs-doc">{nodes}</article>;
}

export default DocumentPreview;