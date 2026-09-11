import { render, screen } from '@testing-library/react';

import MarkdownRenderer from './MarkdownRenderer';
import { parseMarkdown, parseStats, splitBlocks } from './markdown-blocks';

describe('MarkdownRenderer', () => {
  it('renders plain text', () => {
    render(<MarkdownRenderer content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<MarkdownRenderer content="text" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders headings', () => {
    const { container } = render(<MarkdownRenderer content="# Title" />);
    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    const { container } = render(<MarkdownRenderer content="**bold**" />);
    expect(container.querySelector('strong')).toBeInTheDocument();
  });

  it('renders italic text', () => {
    const { container } = render(<MarkdownRenderer content="*italic*" />);
    expect(container.querySelector('em')).toBeInTheDocument();
  });

  it('renders inline code', () => {
    const { container } = render(<MarkdownRenderer content="`code`" />);
    expect(container.querySelector('code')).toBeInTheDocument();
  });

  it('renders code blocks', () => {
    const { container } = render(<MarkdownRenderer content={'```js\nconst x = 1;\n```'} />);
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('renders links', () => {
    const { container } = render(<MarkdownRenderer content="[link](https://example.com)" />);
    const a = container.querySelector('a');
    expect(a).toBeInTheDocument();
    expect(a).toHaveAttribute('href', 'https://example.com');
  });

  it('renders unordered lists', () => {
    const { container } = render(<MarkdownRenderer content="- item 1\n- item 2" />);
    expect(container.querySelector('ul')).toBeInTheDocument();
  });

  it('renders blockquote', () => {
    const { container } = render(<MarkdownRenderer content="> quote" />);
    expect(container.querySelector('blockquote')).toBeInTheDocument();
  });

  it('renders horizontal rule', () => {
    const { container } = render(<MarkdownRenderer content="---" />);
    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <MarkdownRenderer
        content={'# Title\n\nSome **bold** text and a [link](https://example.com).\n\n- item 1\n- item 2'}
      />
    );
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

// ≥20KB of mixed headings / lists / code blocks, streamed as 200 chunks
// cut at fixed width — deliberately NOT aligned with block boundaries,
// so chunks routinely land mid-paragraph and mid-fence.
function buildCorpus() {
  const sections = Array.from({ length: 40 }, (_, s) =>
    [
      `## Section ${s}\n\n`,
      `Intro paragraph for section ${s} with **bold**, *italic* and a [link](https://example.com/s${s}).\n\n`,
      `- item A${s}\n- item B${s}\n- item C${s}\n\n`,
      '```ts\n' +
        `// section ${s} sample code\n` +
        Array.from(
          { length: 8 },
          (_, k) => `const value${s}_${k} = compute(${s}, ${k});`,
        ).join('\n') +
        '\n```\n\n',
      `1. first step ${s}\n2. second step ${s}\n3. third step ${s}\n\n`,
      `Closing paragraph ${s}. `.repeat(6).trim() + '\n\n',
    ].join(''),
  );
  const full = sections.join('');
  const chunkCount = 200;
  const size = Math.ceil(full.length / chunkCount);
  const prefixes = Array.from(
    { length: chunkCount },
    (_, i) => full.slice(0, size * (i + 1)),
  );
  return { full, prefixes, chunkCount };
}

// The two corpus-driven streaming tests rerender a 20KB document 200
// times through jsdom's innerHTML pipeline (~2s on a dev machine, 2-3x
// that on a shared CI runner) — well over the 5s default test timeout.
// The assertions are structural counters, not wall-clock, so a generous
// timeout only absorbs runner speed, never a perf regression.
describe('MarkdownRenderer incremental streaming', () => {
  it('re-parses only the active tail block per chunk, not the whole document', () => {
    const { full, prefixes, chunkCount } = buildCorpus();
    const blockCount = splitBlocks(full).length;
    expect(full.length).toBeGreaterThanOrEqual(20_000);
    expect(chunkCount).toBe(200);
    expect(blockCount).toBeGreaterThan(100);

    // Pre-incremental baseline: the old `useMemo(() => parseMarkdown(content),
    // [content])` ran one FULL-document parse per chunk — quadratic work.
    parseStats.calls = 0;
    parseStats.chars = 0;
    for (const prefix of prefixes) parseMarkdown(prefix);
    const oldCalls = parseStats.calls;
    const oldChars = parseStats.chars;

    parseStats.calls = 0;
    parseStats.chars = 0;
    const { container, rerender } = render(<MarkdownRenderer content='' />);
    for (const prefix of prefixes) {
      rerender(<MarkdownRenderer content={prefix} />);
    }
    const newCalls = parseStats.calls;
    const newChars = parseStats.chars;

    // Structural bounds — counters, no wall-clock timing. Each chunk may
    // re-parse only the tail block (plus first parses of newly completed
    // blocks): linear in blocks + chunks, never chunk×document.
    expect(newCalls).toBeLessThanOrEqual(blockCount + chunkCount + 4);
    expect(newChars).toBeLessThanOrEqual(full.length * 3);

    // The corpus genuinely exercises the quadratic path…
    expect(oldChars).toBeGreaterThan(full.length * 50);
    // …and the incremental renderer avoids it by an order of magnitude.
    expect(newChars * 10).toBeLessThan(oldChars);

    // Completion: the streamed final render contains the whole document.
    rerender(<MarkdownRenderer content={full} />);
    expect(container.querySelectorAll('h2')).toHaveLength(40);
    expect(container.textContent).toContain('value39_7');
    expect(container.textContent).toContain('Closing paragraph 39');
  }, 30_000);

  it('streamed final output is identical to a one-shot render', () => {
    const { full, prefixes } = buildCorpus();
    const { container, rerender } = render(<MarkdownRenderer content='' />);
    for (const prefix of prefixes) {
      rerender(<MarkdownRenderer content={prefix} />);
    }
    const oneShot = render(<MarkdownRenderer content={full} />);
    expect(container.innerHTML).toBe(oneShot.container.innerHTML);
  }, 30_000);

  it('keeps unpaired-backtick regions fused (bug-for-bug parity while streaming)', () => {
    // An inline code span crossing a blank line must not become a block
    // boundary mid-stream: splitBlocks holds the region together until
    // parity returns to even, so streaming matches one-shot parsing at
    // every prefix.
    const full = 'before `tick\n\nafter` end\n\n- item 1\n- item 2';
    const { container, rerender } = render(<MarkdownRenderer content='' />);
    for (let i = 1; i <= full.length; i++) {
      rerender(<MarkdownRenderer content={full.slice(0, i)} />);
    }
    const oneShot = render(<MarkdownRenderer content={full} />);
    expect(container.innerHTML).toBe(oneShot.container.innerHTML);
    expect(container.querySelector('code')).toBeInTheDocument();
  });
});
