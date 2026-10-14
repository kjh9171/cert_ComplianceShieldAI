import type { Block } from '../types';

/** 블록 배열 → 순수 텍스트 (TXT 다운로드 · 클립보드 복사용) */
export function blocksToPlainText(blocks: Block[]): string {
  const out: string[] = [];
  const hr = '='.repeat(64);

  for (const b of blocks) {
    switch (b.kind) {
      case 'title':
        out.push(b.text);
        if (b.subtitle) out.push(b.subtitle);
        out.push(hr);
        break;
      case 'meta':
        for (const [k, v] of b.rows) out.push(`${k.padEnd(16, ' ')} ${v}`);
        out.push('');
        break;
      case 'heading':
        out.push(`${b.num ? b.num + ' ' : ''}${b.text}`);
        out.push('');
        break;
      case 'paragraph':
        out.push(b.text);
        out.push('');
        break;
      case 'list':
        b.items.forEach((it, i) => out.push(`${b.ordered ? `${i + 1}.` : '·'} ${it}`));
        out.push('');
        break;
      case 'table': {
        const cols = b.head.length;
        const widths = b.widths ?? Array.from({ length: cols }, (_, i) => (i === 0 ? 26 : 74 / (cols - 1)));
        const cell = (s: string, w: number) => {
          const clean = (s || '').replace(/\s+/g, ' ');
          // 한글은 두 칸 폭으로 계산
          let len = 0;
          for (const ch of clean) len += /[\u1100-\u115F\uAC00-\uD7A3\u3000-\u303F\uFF00-\uFFEF]/.test(ch) ? 2 : 1;
          return clean + ' '.repeat(Math.max(0, w - len));
        };
        out.push(b.head.map((h, i) => cell(h, widths[i] ?? 12)).join(' '));
        out.push(widths.map((w) => '-'.repeat(w)).join(' '));
        for (const row of b.rows) out.push(row.map((c, i) => cell(c, widths[i] ?? 12)).join(' '));
        out.push('');
        break;
      }
      case 'note':
        out.push(`[참고] ${b.title ? b.title + ' — ' : ''}${b.text}`);
        out.push('');
        break;
      case 'signature':
        for (const r of b.roles) out.push(r);
        out.push('');
        break;
      case 'appendix':
        out.push(hr);
        out.push(`[별첨] ${b.title}`);
        out.push(hr);
        out.push(blocksToPlainText(b.blocks));
        break;
      case 'divider':
        out.push(hr);
        out.push('');
        break;
      case 'pagebreak':
        out.push('');
        break;
    }
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 블록 배열 → Markdown (GitHub, Notion, 위키 paste 용) */
export function blocksToMarkdown(blocks: Block[]): string {
  const out: string[] = [];

  for (const b of blocks) {
    switch (b.kind) {
      case 'title':
        out.push(`# ${b.text}`);
        if (b.subtitle) out.push(`_${b.subtitle}_`);
        out.push('');
        break;
      case 'meta':
        out.push('| 항목 | 내용 |');
        out.push('| --- | --- |');
        for (const [k, v] of b.rows) out.push(`| ${k} | ${v} |`);
        out.push('');
        break;
      case 'heading':
        out.push(`${'#'.repeat(Math.min(6, (b.level ?? 2) + 1))} ${b.num ? b.num + ' ' : ''}${b.text}`);
        out.push('');
        break;
      case 'paragraph':
        out.push(b.text);
        out.push('');
        break;
      case 'list':
        for (const it of b.items) out.push(`${b.ordered ? '1.' : '-'} ${it}`);
        out.push('');
        break;
      case 'table': {
        const esc = (s: string) => (s || '').replace(/\|/g, '\\|').replace(/\n+/g, '<br>');
        out.push(`| ${b.head.map(esc).join(' | ')} |`);
        out.push(`| ${b.head.map(() => '---').join(' | ')} |`);
        for (const row of b.rows) out.push(`| ${row.map(esc).join(' | ')} |`);
        out.push('');
        break;
      }
      case 'note':
        out.push(`> **참고${b.title ? ` — ${b.title}` : ''}**`);
        out.push(`> ${b.text}`);
        out.push('');
        break;
      case 'signature':
        for (const r of b.roles) out.push(r);
        out.push('');
        break;
      case 'appendix':
        out.push('---');
        out.push('');
        out.push(`## [별첨] ${b.title}`);
        out.push('');
        out.push(blocksToMarkdown(b.blocks));
        break;
      case 'divider':
        out.push('---');
        out.push('');
        break;
      case 'pagebreak':
        out.push('');
        break;
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** 한국어 어절 기반 대략적 분량 계산 (글자 수) */
export function countKoreanWords(text: string): number {
  return text.replace(/\s+/g, '').length;
}