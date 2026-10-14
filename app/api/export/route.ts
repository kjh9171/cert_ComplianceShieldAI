import { renderDocx } from '@/lib/docx';
import { renderDocument, isTemplateId } from '@/lib/render';
import { createDefaultState } from '@/lib/state';
import type { DocState, TemplateId } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/export
 * DocState + templateId 를 받아 docx / pdf(인쇄용 HTML) / md / txt 로 변환합니다.
 *
 * - docx : 서버에서 실제 .docx 바이너리 생성 (한글 서체 지정)
 * - pdf  : A4 인쇄 최적화 HTML → 브라우저 "PDF로 저장"
 *          (한글 폰트 임베딩 없이도 완전한 한글 PDF를 만들 수 있어
 *           서버 의존성이 없고 텍스트 선택·검색이 가능합니다)
 * - md   : Markdown
 * - txt  : 일반 텍스트
 */
export async function POST(request: Request) {
  let body: { templateId?: string; format?: string; state?: Partial<DocState> };

  try {
    body = await request.json();
  } catch {
    return json({ error: '요청 본문이 올바른 JSON이 아닙니다.' }, 400);
  }

  const format = (body.format ?? 'txt').toLowerCase();
  const templateId = body.templateId;

  if (!isTemplateId(templateId)) {
    return json({ error: `지원하지 않는 문서 종류입니다: ${String(templateId)}` }, 400);
  }

  let state: DocState;
  try {
    state = deepMerge(createDefaultState(), (body.state ?? {}) as Partial<DocState>);
  } catch {
    return json({ error: '문서 상태 형식이 올바르지 않습니다.' }, 400);
  }

  const doc = renderDocument(templateId as TemplateId, state);
  const base = doc.fileSlug;

  switch (format) {
    case 'docx': {
      const buf = await renderDocx(doc);
      return new Response(new Uint8Array(buf), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': contentDisposition(`${base}.docx`),
          'Content-Length': String(buf.byteLength),
          'Cache-Control': 'no-store',
        },
      });
    }

    case 'pdf':
      return new Response(printableHtml(doc), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': contentDisposition(`${base}.html`, 'inline'),
          'Cache-Control': 'no-store',
        },
      });

    case 'md':
      return new Response(doc.markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': contentDisposition(`${base}.md`),
          'Cache-Control': 'no-store',
        },
      });

    case 'txt':
      return new Response(doc.plainText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': contentDisposition(`${base}.txt`),
          'Cache-Control': 'no-store',
        },
      });

    // 한글 문서 프로그램(HWP) 호환용 — 서식 없는 공백 텍스트
    case 'hwp':
      return new Response(doc.plainText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': contentDisposition(`${base}.hwp.txt`),
          'Cache-Control': 'no-store',
        },
      });

    default:
      return json(
        { error: `지원하지 않는 형식입니다: ${format} (docx, pdf, md, txt, hwp 중 선택)` },
        400,
      );
  }
}

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/**
 * Content-Disposition 헤더를 생성합니다.
 * HTTP 헤더는 ByteString(라틴-1)만 허용되므로, 한글 파일명은 반드시
 * ASCII 대체명 + RFC 5987 인코딩 형식(`filename*`)으로 함께 제공해야 합니다.
 */
function contentDisposition(filename: string, disposition: 'attachment' | 'inline' = 'attachment'): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
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

/* ================================================================== */
/*  PDF 출력용 A4 인쇄 HTML                                               */
/*  블록 모델을 그대로 재사용하므로 미리보기와 출력이 항상 동일합니다.      */
/* ================================================================== */

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function printableHtml(doc: ReturnType<typeof renderDocument>): string {
  const body = doc.blocks.map(renderBlock).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(doc.fileSlug)}</title>
<style>
  @page { size: A4; margin: 20mm 18mm 18mm 22mm; }
  :root { --ink:#0f172a; --muted:#64748b; --line:#cbd5e1; --accent:#1f41f5; }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; background:#f1f5f9; }
  body {
    font-family: "Malgun Gothic","맑은 고딕","Apple SD Gothic Neo","Noto Sans KR",serif;
    color: var(--ink); font-size: 10.5pt; line-height: 1.75;
  }
  .sheet {
    width: 210mm; min-height: 297mm; margin: 8mm auto; padding: 20mm 18mm 18mm 22mm;
    background:#fff; box-shadow: 0 2px 18px rgba(15,23,42,.12);
  }
  h1.doc-title { text-align:center; font-size:18pt; margin:0 0 4px; letter-spacing:-.3px; }
  .doc-sub { text-align:center; color:var(--muted); font-size:9pt; margin-bottom:14px; }
  .rule { border:0; border-top:2px solid var(--accent); margin:0 0 16px; }
  h2.ch { font-size:12.5pt; margin:26px 0 10px; padding-bottom:6px; border-bottom:1px solid var(--line); }
  h3.sec { font-size:11pt; margin:18px 0 6px; }
  p { margin:0 0 8px; text-align:justify; word-break:break-word; }
  ul, ol { margin:0 0 10px; padding-left:1.6em; }
  li { margin-bottom:3px; }
  .meta { margin:0 0 16px; }
  .meta div { display:flex; gap:8px; padding:3px 0; border-bottom:1px dotted #e2e8f0; }
  .meta b { flex:0 0 110px; font-weight:600; color:#334155; }
  table { width:100%; border-collapse:collapse; margin:8px 0 14px; font-size:9.5pt; }
  th, td { border:1px solid var(--line); padding:6px 8px; vertical-align:top; text-align:left; }
  th { background:#eef2ff; font-weight:600; }
  .note { margin:10px 0; padding:9px 12px; background:#f5f7ff; border-left:3px solid var(--accent); font-size:9.5pt; }
  .note b { color:#1a2fe1; }
  .sig { margin-top:26px; text-align:right; font-weight:600; }
  .sig div { margin-bottom:10px; }
  .appendix { margin-top:28px; }
  .pb { break-before: page; }
  .toolbar { position:sticky; top:0; z-index:10; display:flex; gap:10px; align-items:center;
    justify-content:center; padding:12px; background:#0f172a; color:#fff; font-size:13px; }
  .toolbar button { background:#3363ff; color:#fff; border:0; border-radius:8px;
    padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; }
  .toolbar button:hover { background:#1f41f5; }
  .toolbar span { color:#94a3b8; }
  @media print {
    html, body { background:#fff; }
    .toolbar { display:none; }
    .sheet { width:auto; min-height:0; margin:0; padding:0; box-shadow:none; }
    h2.ch, h3.sec { break-after: avoid; }
    table, tr, li { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <button onclick="window.print()">PDF로 저장 / 인쇄</button>
  <span>인쇄 대화상자에서 대상을 「PDF로 저장」으로 선택하세요. (A4 · 실제 크기 100%)</span>
</div>
<div class="sheet">${body}</div>
<script>
  document.querySelectorAll('h1,h2,h3,p,li,table,tr').forEach(function (el) {
    if (el.tagName === 'TABLE' || el.tagName === 'TR') return;
  });
</script>
</body>
</html>`;
}

function renderBlock(b: ReturnType<typeof renderDocument>['blocks'][number]): string {
  switch (b.kind) {
    case 'title':
      return `<h1 class="doc-title">${esc(b.text)}</h1>${
        b.subtitle ? `<div class="doc-sub">${esc(b.subtitle)}</div>` : ''
      }<hr class="rule" />`;
    case 'meta':
      return `<div class="meta">${b.rows
        .map(([k, v]) => `<div><b>${esc(k)}</b><span>${esc(v)}</span></div>`)
        .join('')}</div>`;
    case 'heading':
      return b.level === 1
        ? `<h2 class="ch">${esc(`${b.num ? `${b.num} ` : ''}${b.text}`)}</h2>`
        : `<h3 class="sec">${esc(`${b.num ? `${b.num} ` : ''}${b.text}`)}</h3>`;
    case 'paragraph':
      return `<p>${esc(b.text)}</p>`;
    case 'list':
      return `<${b.ordered ? 'ol' : 'ul'}>${b.items
        .map((i) => `<li>${esc(i)}</li>`)
        .join('')}</${b.ordered ? 'ol' : 'ul'}>`;
    case 'table':
      return `<table><thead><tr>${b.head
        .map((h) => `<th>${esc(h)}</th>`)
        .join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;
    case 'note':
      return `<div class="note"><b>참고${b.title ? ` — ${esc(b.title)}` : ''}</b><br />${esc(
        b.text,
      )}</div>`;
    case 'signature':
      return `<div class="sig">${b.roles
        .map((r) => `<div>${r === '' ? '&nbsp;' : esc(r)}</div>`)
        .join('')}</div>`;
    case 'appendix':
      return `<div class="appendix pb"><h2 class="ch">[별첨] ${esc(b.title)}</h2>${b.blocks
        .map(renderBlock)
        .join('')}</div>`;
    case 'divider':
      return '<hr />';
    case 'pagebreak':
      return '<div class="pb"></div>';
    default:
      return '';
  }
}
