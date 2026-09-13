// Incremental markdown pipeline shared by MarkdownRenderer.
//
// `parseMarkdown` is the original whole-string regex pipeline (semantics
// unchanged); `splitBlocks` partitions a document into independently
// parseable blocks so a streaming render only re-parses its active tail
// block instead of the whole document on every chunk.

// Observability seam for the structural perf tests: counts entry into
// `parseMarkdown` and the total source length handed to it. The old
// whole-document re-parse per streamed chunk shows up here as `chars`
// growing quadratically with stream length; the incremental renderer
// keeps it linear in the document size.
export const parseStats = { calls: 0, chars: 0 };

export function parseMarkdown(src: string): string {
  parseStats.calls += 1;
  parseStats.chars += src.length;

  let html = src;

  // code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre><code class="lang-${lang}" data-slot="code">${escapeHtml((code as string).trim())}</code></pre>`;
  });

  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6 data-slot="heading">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 data-slot="heading">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 data-slot="heading">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 data-slot="heading">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 data-slot="heading">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 data-slot="heading">$1</h1>');

  // bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // blockquote
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // unordered list
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li data-slot="item">$1</li>');
  html = html.replace(/((?:<li [^>]*>.*<\/li>\n?)+)/g, '<ul data-slot="list">$1</ul>');

  // ordered list
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<oli data-slot="item">$1</oli>');
  html = html.replace(/((?:<oli [^>]*>.*<\/oli>\n?)+)/g, (m) => {
    return '<ol data-slot="list">' + m.replace(/<\/?oli[^>]*>/g, (t) => t.replace('oli', 'li')) + '</ol>';
  });

  // horizontal rule
  html = html.replace(/^---$/gm, '<hr />');

  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

  // paragraphs (lines not already wrapped in block elements)
  html = html.replace(/^(?!<[a-z])((?!<\/).+)$/gm, (line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    return `<p>${trimmed}</p>`;
  });

  // line breaks
  html = html.replace(/\n{2,}/g, '\n');

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Must mirror parseMarkdown's code-block pass exactly: everything inside a
// matched fence is opaque to block splitting.
const FENCE_RE = /```(\w*)\n([\s\S]*?)```/g;

// Split a document into blocks that parse identically standalone as they
// do inside the whole document, so blocks.map(parseMarkdown).join('\n')
// === parseMarkdown(document).
//
// Two rules keep that equivalence bug-for-bug:
// - Never split inside a code fence (the fence regex consumes it atomically
//   in the full-document parse, so its blank lines are not boundaries).
// - Never split where an inline code span would cross the boundary: the
//   inline-code regex pairs backticks left-to-right, so a boundary is only
//   safe when the backtick parity of the text before it is even. Regions
//   with unpaired backticks simply stay fused into one larger block.
export function splitBlocks(src: string): string[] {
  const fences = Array.from(src.matchAll(FENCE_RE), (m) => {
    const start = m.index;
    return {
      start,
      // ``` + lang + newline: the code payload starts right after
      codeStart: start + (m[1] ?? '').length + 4,
      end: start + m[0].length,
    };
  });

  const blocks: string[] = [];
  let parity = 0; // backticks visible to the inline-code pass so far
  let blockStart = 0;
  let runStart = -1; // first '\n' of the current newline run
  let fenceIdx = 0;
  let i = 0;

  while (i < src.length) {
    const fence = fences[fenceIdx];
    if (fence && fence.start <= i) {
      // A newline run ending at the fence is a normal boundary.
      if (runStart >= 0) {
        if (i - runStart >= 2 && parity % 2 === 0) {
          blocks.push(src.slice(blockStart, runStart));
          blockStart = i;
        }
        runStart = -1;
      }
      // Backticks inside the escaped code payload survive the fence
      // replacement, so they still count toward inline-code pairing.
      for (let j = fence.codeStart; j < fence.end - 3; j++) {
        if (src[j] === '`') parity += 1;
      }
      i = fence.end;
      fenceIdx += 1;
      continue;
    }

    const ch = src[i];
    if (ch === '\n') {
      if (runStart < 0) runStart = i;
    } else {
      // A blank-line run (>= 2 newlines) at even parity is a block
      // boundary; the separator is dropped and re-joined as a single
      // newline, matching parseMarkdown's final `\n{2,}` collapse.
      if (runStart >= 0 && i - runStart >= 2 && parity % 2 === 0) {
        blocks.push(src.slice(blockStart, runStart));
        blockStart = i;
      }
      runStart = -1;
      if (ch === '`') parity += 1;
    }
    i += 1;
  }

  if (runStart >= 0 && src.length - runStart >= 2 && parity % 2 === 0) {
    blocks.push(src.slice(blockStart, runStart));
    blockStart = src.length;
  }
  return [...blocks, src.slice(blockStart)];
}
