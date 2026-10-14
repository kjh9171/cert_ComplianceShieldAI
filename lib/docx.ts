import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { Block, RenderedDoc } from './types';

/* 한국어 문서 기본 서체 — 한글 Word에서 안전하게 대체됩니다. */
const FONT = '맑은 고딕';
const SIZE = 21; // half-points → 10.5pt (법정 문서 일반적 크기)
const SIZE_SMALL = 18; // 9pt

const run = (text: string, opts: { bold?: boolean; size?: number; color?: string; font?: string } = {}) =>
  new TextRun({
    text,
    bold: opts.bold,
    size: opts.size ?? SIZE,
    color: opts.color,
    font: opts.font ?? FONT,
  });

const p = (
  text: string,
  opts: {
    bold?: boolean;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacing?: number;
    indent?: number;
    color?: string;
    font?: string;
  } = {},
) =>
  new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacing ?? 120, line: 300 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    children: [run(text, opts)],
  });

const cellPara = (text: string, bold = false) =>
  new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [run(text || ' ', { bold, size: SIZE_SMALL })],
  });

function buildTable(head: string[], rows: string[][], widths?: number[]): Table {
  const cols = head.length;
  const w = widths ?? Array.from({ length: cols }, () => Math.round(100 / cols));

  const headerRow = new TableRow({
    tableHeader: true,
    children: head.map(
      (h, i) =>
        new TableCell({
          width: { size: w[i] ?? 20, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'EEF2FF', color: 'auto' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [cellPara(h, true)],
        }),
    ),
  });

  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: r.map(
          (c, i) =>
            new TableCell({
              width: { size: w[i] ?? 20, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [cellPara(c)],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    },
    rows: [headerRow, ...bodyRows],
  });
}

/** 블록 모델 → docx 요소 */
function blocksToDocx(blocks: Block[], docTitle: string): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  for (const b of blocks) {
    switch (b.kind) {
      case 'title':
        out.push(p(b.text, { bold: true, size: 36, align: AlignmentType.CENTER, spacing: 80 }));
        if (b.subtitle) {
          out.push(p(b.subtitle, { size: SIZE_SMALL, align: AlignmentType.CENTER, color: '64748B' }));
        }
        out.push(
          new Paragraph({
            spacing: { after: 240 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '1F41F5' } },
            children: [],
          }),
        );
        break;

      case 'meta':
        for (const [k, v] of b.rows) {
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [run(`${k}: `, { bold: true, size: SIZE_SMALL }), run(v, { size: SIZE_SMALL })],
            }),
          );
        }
        out.push(p('', { spacing: 120 }));
        break;

      case 'heading':
        out.push(
          new Paragraph({
            heading:
              b.level === 1
                ? HeadingLevel.HEADING_1
                : b.level === 2
                  ? HeadingLevel.HEADING_2
                  : HeadingLevel.HEADING_3,
            spacing: { before: b.level === 1 ? 360 : 220, after: 120 },
            children: [
              new TextRun({
                text: `${b.num ? `${b.num} ` : ''}${b.text}`,
                bold: true,
                size: b.level === 1 ? 26 : 23,
                font: FONT,
              }),
            ],
          }),
        );
        break;

      case 'paragraph':
        out.push(p(b.text));
        break;

      case 'list':
        b.items.forEach((it, i) => {
          out.push(
            new Paragraph({
              spacing: { after: 60, line: 300 },
              indent: { left: 420, hanging: 240 },
              children: [run(b.ordered ? `${i + 1}. ${it}` : `· ${it}`)],
            }),
          );
        });
        out.push(p('', { spacing: 80 }));
        break;

      case 'table':
        out.push(buildTable(b.head, b.rows, b.widths));
        out.push(p('', { spacing: 140 }));
        break;

      case 'note':
        out.push(
          new Paragraph({
            spacing: { before: 120, after: 120 },
            indent: { left: 200 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: '3363FF' } },
            shading: { type: ShadingType.CLEAR, fill: 'F5F7FF', color: 'auto' },
            children: [
              run(`참고${b.title ? ` — ${b.title}` : ''}: `, { bold: true, size: SIZE_SMALL, color: '1A2FE1' }),
              run(b.text, { size: SIZE_SMALL }),
            ],
          }),
        );
        break;

      case 'signature':
        for (const r of b.roles) {
          out.push(
            new Paragraph({
              spacing: { before: r === '' ? 160 : 0, after: 60 },
              alignment:
                r.includes('위탁자') || r.includes('수탁자')
                  ? AlignmentType.LEFT
                  : AlignmentType.RIGHT,
              children: [run(r === '' ? ' ' : r, { bold: r.includes('대표이사') })],
            }),
          );
        }
        break;

      case 'appendix':
        out.push(new Paragraph({ children: [new PageBreak()] }));
        out.push(p(`[별첨] ${b.title}`, { bold: true, size: 26, spacing: 200 }));
        out.push(...blocksToDocx(b.blocks, docTitle));
        break;

      case 'divider':
        out.push(
          new Paragraph({
            spacing: { before: 160, after: 160 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' } },
            children: [],
          }),
        );
        break;

      case 'pagebreak':
        out.push(new Paragraph({ children: [new PageBreak()] }));
        break;
    }
  }

  return out;
}

/** RenderedDoc → .docx Buffer */
export async function renderDocx(doc: RenderedDoc): Promise<Buffer> {
  const children = blocksToDocx(doc.blocks, doc.fileSlug);

  const document = new Document({
    creator: 'ComplianceShield AI',
    title: doc.fileSlug,
    description: '개인정보보호법 기준 법정 컴플라이언스 문서',
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE } },
        heading1: { run: { font: FONT, size: 26, bold: true, color: '1A2FE1' } },
        heading2: { run: { font: FONT, size: 23, bold: true } },
        heading3: { run: { font: FONT, size: 22, bold: true } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1418, right: 1134 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${doc.fileSlug}  ·  `,
                    size: 16,
                    color: '94A3B8',
                    font: FONT,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '94A3B8',
                    font: FONT,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}