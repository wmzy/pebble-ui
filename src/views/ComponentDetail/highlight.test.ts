import { render } from '@testing-library/react';
import { createElement } from 'react';

// Explicit vitest expect — the second-arg message form collides with the
// jest-axe global-expect pollution otherwise (repo precedent).
import { expect } from 'vitest';

import { highlightTsx, tokenizeTsx } from './highlight';

/** Concatenate all token texts — must rebuild the source byte-for-byte. */
function roundTrip(source: string): string {
  return tokenizeTsx(source)
    .map((t) => t.text)
    .join('');
}

/** All non-plain tokens whose text matches `text` exactly. */
function tokensWith(source: string, text: string) {
  return tokenizeTsx(source).filter((t) => t.text === text);
}

const SNIPPET = `import { Badge } from '@/lib';

// layout demo
const gap = \`var(--haze-space-\${size})\`;
export default function Demo() {
  const n = 42;
  return (
    <div className='box' data-n={n}>
      <p>It doesn't break highlighting</p>
      <Badge variant='success' />
      {items.map((i) => i < items.length && <span key={i}>{i}</span>)}
    </div>
  );
}`;

describe('tokenizeTsx', () => {
  it('rebuilds the source exactly (Copy keeps the raw text)', () => {
    expect(roundTrip(SNIPPET)).toBe(SNIPPET);
  });

  it('classifies keywords, strings, comments, numbers', () => {
    expect(tokensWith(SNIPPET, 'import')).toHaveLength(1);
    expect(tokensWith(SNIPPET, 'import')[0]!.kind).toBe('keyword');
    expect(tokensWith(SNIPPET, "'box'")[0]!.kind).toBe('string');
    expect(tokensWith(SNIPPET, '// layout demo')[0]!.kind).toBe('comment');
    expect(tokensWith(SNIPPET, '42')[0]!.kind).toBe('number');
  });

  it('classifies JSX tag names and attribute names', () => {
    expect(tokensWith(SNIPPET, 'div')[0]!.kind).toBe('tag');
    // `Badge` also appears in the import list (plain) — the JSX usage is a tag.
    expect(tokensWith(SNIPPET, 'Badge').some((t) => t.kind === 'tag')).toBe(true);
    expect(tokensWith(SNIPPET, 'className')[0]!.kind).toBe('attr');
    expect(tokensWith(SNIPPET, 'variant')[0]!.kind).toBe('attr');
  });

  it('tokenizes template literals with interpolation as string + expr', () => {
    const kind = (text: string) => tokensWith(SNIPPET, text)[0]!.kind;
    expect(kind('`var(--haze-space-')).toBe('string');
    expect(kind('size')).toBe('plain');
    expect(kind(')`')).toBe('string');
  });

  it('keeps apostrophes in JSX text plain instead of opening a string', () => {
    // "It doesn't break highlighting" — the apostrophe must not swallow the
    // rest of the file: the closing </p> tag is still recognized as markup.
    const tokens = tokenizeTsx(SNIPPET);
    const pClose = tokens.findIndex((t) => t.text === 'p' && t.kind === 'tag');
    expect(pClose).toBeGreaterThan(-1);
    expect(tokens.some((t) => t.text.includes("doesn't"))).toBe(true);
  });

  it('does not treat `i < items.length` as a JSX tag', () => {
    const items = tokensWith(SNIPPET, 'items');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((t) => t.kind !== 'tag')).toBe(true);
    // And the real JSX later in the same expression still highlights.
    expect(tokensWith(SNIPPET, 'span')[0]!.kind).toBe('tag');
  });

  it('leaves generics after identifiers as punctuation, not tags', () => {
    const source = 'const [v, setV] = useState<boolean>(false);';
    expect(roundTrip(source)).toBe(source);
    expect(tokensWith(source, 'useState')[0]!.kind).toBe('plain');
    expect(tokensWith(source, 'boolean')[0]!.kind).toBe('plain');
  });

  it('handles block comments, escapes and self-closing tags', () => {
    const source = `/* multi
line */ const s = 'it\\'s'; <Flex wrap />`;
    expect(roundTrip(source)).toBe(source);
    expect(tokensWith(source, '/* multi\nline */')[0]!.kind).toBe('comment');
    expect(tokensWith(source, "'it\\'s'")[0]!.kind).toBe('string');
    expect(tokensWith(source, 'Flex')[0]!.kind).toBe('tag');
  });

  it('round-trips every real demo source file', () => {
    const sources = import.meta.glob('./demos/*.tsx', {
      query: '?raw',
      import: 'default',
      eager: true,
    });
    for (const [path, source] of Object.entries(sources)) {
      expect(roundTrip(source), path).toBe(source);
    }
  });

  it('caps highlighting beyond the line threshold without losing text', () => {
    const head = 'const x = 1; // head\n';
    const source = `${head}${'// filler\n'.repeat(500)}`;
    const tokens = tokenizeTsx(source);
    expect(roundTrip(source)).toBe(source);
    // Uncapped scan highlights everything (the cap lives in highlightTsx).
    expect(tokens.filter((t) => t.kind === 'comment').length).toBe(501);
  });
});

describe('highlightTsx', () => {
  it('renders spans whose text content equals the source', () => {
    const { container } = render(
      createElement('pre', null, createElement('code', null, highlightTsx(SNIPPET)))
    );
    expect(container.querySelector('code')!.textContent).toBe(SNIPPET);
    expect(container.querySelectorAll('span').length).toBeGreaterThan(5);
  });

  it('degrades past the line cap: head highlighted, tail plain, text intact', () => {
    const head = 'const x = 1; // head\n';
    // 500 lines then a unique tail marker past the cap boundary.
    const source = `${head}${'// filler tail line\n'.repeat(500)}// past-cap marker\n`;
    const { container } = render(createElement('code', null, highlightTsx(source)));
    expect(container.querySelector('code')!.textContent).toBe(source);
    // The head comment got its span…
    const headSpan = Array.from(container.querySelectorAll('span')).find((s) =>
      s.textContent.includes('// head')
    );
    expect(headSpan).toBeDefined();
    // …while the marker past the 400-line cap renders as a raw text node
    // directly under <code> (no span) — plain degradation, zero text loss.
    const tailSpan = Array.from(container.querySelectorAll('span')).find((s) =>
      s.textContent.includes('past-cap marker')
    );
    expect(tailSpan).toBeUndefined();
  });

  it('colors spans only through token classes', () => {
    const { container } = render(
      createElement('code', null, highlightTsx(SNIPPET))
    );
    for (const span of Array.from(container.querySelectorAll('span'))) {
      expect(span.className).toMatch(/^haze-/);
    }
  });
});
