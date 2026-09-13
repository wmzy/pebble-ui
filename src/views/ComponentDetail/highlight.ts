import type { ReactNode } from 'react';

import { Fragment, createElement } from 'react';

import { css } from '@linaria/core';

/*
 * Mini TSX syntax highlighter for the demo-source viewer.
 *
 * Zero dependencies: a single-pass character scanner with an explicit mode
 * stack (code / template literal / JSX tag), so strings, template
 * interpolations, comments, JSX tags/attrs, keywords and numbers each get
 * their own span while the source text stays byte-identical — Copy still
 * gets the raw string. Colors come exclusively from --haze-* tokens, so
 * the dark scope in DemoPreview re-derives them for free.
 */

export type TokenKind =
  | 'plain'
  | 'string'
  | 'comment'
  | 'keyword'
  | 'tag'
  | 'attr'
  | 'number'
  | 'punct';

export type HighlightToken = { kind: TokenKind; text: string };

const KEYWORDS: ReadonlySet<string> = new Set([
  'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export',
  'extends', 'false', 'finally', 'for', 'from', 'function', 'if',
  'implements', 'import', 'in', 'infer', 'instanceof', 'interface', 'is',
  'keyof', 'let', 'namespace', 'new', 'null', 'of', 'override', 'private',
  'protected', 'public', 'readonly', 'return', 'satisfies', 'static',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof',
  'undefined', 'var', 'void', 'while', 'yield',
]);

/** Modes the scanner can be in; a stack nests them (template → expr → …). */
type Frame =
  | { mode: 'code'; depth: number; popOnClose: boolean }
  | { mode: 'template' }
  | { mode: 'children' }
  | { mode: 'tag'; readName: boolean; closing: boolean; selfClose: boolean };

function isNameStart(c: string | undefined): boolean {
  return c !== undefined && /[A-Za-z_$]/.test(c);
}

function isNameChar(c: string | undefined): boolean {
  return c !== undefined && /[A-Za-z0-9_$]/.test(c);
}

/** Tag head after `<` (and after `/` for closing tags): a name or fragment. */
function startsTag(source: string, j: number): boolean {
  if (source[j] === '/') j += 1;
  return source[j] === '>' || isNameStart(source[j]);
}

/**
 * `<` opens a JSX tag when a tag name (or fragment `>`/`/>`) follows AND the
 * character before `<` cannot end a less-than operand — that keeps
 * generics (`useControl<T>`) and comparisons (`i < items.length`,
 * detected by the lowercase name + `.` lookahead below) out.
 */
function opensTag(source: string, i: number): boolean {
  const prev = i > 0 ? source[i - 1] : undefined;
  if (isNameChar(prev) || prev === ')' || prev === ']' || prev === '.') {
    return false;
  }
  if (!startsTag(source, i + 1)) return false;
  let j = i + 1;
  if (source[j] === '/') j += 1; // closing tag: </Foo
  if (source[j] === '>') return true; // fragment <> or </>
  const lowerName = !/[A-Z_$]/.test(source[j]!);
  j += 1;
  while (isNameChar(source[j])) j += 1;
  const after = source[j];
  // `i < items.length` — lowercase identifier + member access is a
  // comparison; uppercase (`Foo.Bar`) is a namespaced component tag.
  if (after === '.') return !lowerName;
  // `<my-element>` custom-element name.
  if (after === '-' && isNameStart(source[j + 1])) return true;
  // Skip inline whitespace (incl. newlines — Prettier wraps long tags)
  // before deciding what the tag continues with.
  let k = j;
  while (source[k] === ' ' || source[k] === '\t' || source[k] === '\n' || source[k] === '\r') {
    k += 1;
  }
  const next = source[k];
  return (
    next === undefined ||
    next === '>' ||
    next === '/' ||
    next === '=' ||
    next === '{' ||
    isNameStart(next)
  );
}

/** Scan TSX source into colored tokens. Single pass, O(n). */
export function tokenizeTsx(source: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const stack: Frame[] = [{ mode: 'code', depth: 0, popOnClose: false }];
  let i = 0;
  let plain = '';

  const push = (kind: TokenKind, text: string): void => {
    if (text === '') return;
    if (kind === 'plain') {
      plain += text;
      return;
    }
    flush();
    const last = tokens[tokens.length - 1];
    if (last?.kind === kind) last.text += text;
    else tokens.push({ kind, text });
  };
  const flush = (): void => {
    if (plain !== '') {
      tokens.push({ kind: 'plain', text: plain });
      plain = '';
    }
  };

  while (i < source.length) {
    const frame = stack[stack.length - 1]!;
    const ch = source.charAt(i);

    if (frame.mode === 'template') {
      if (ch === '\\') {
        push('string', source.slice(i, i + 2));
        i += 2;
      } else if (ch === '`') {
        push('string', '`');
        i += 1;
        stack.pop();
      } else if (ch === '$' && source[i + 1] === '{') {
        push('punct', '${');
        i += 2;
        stack.push({ mode: 'code', depth: 0, popOnClose: true });
      } else {
        push('string', ch);
        i += 1;
      }
      continue;
    }

    if (frame.mode === 'children') {
      // JSX text between tags: plain by definition — no string or comment
      // scanning, so apostrophes in prose (`don't`) and `//` in URLs stay
      // text. Only `{` (expression) and `<` (next tag) are markup.
      if (ch === '{') {
        push('punct', '{');
        i += 1;
        stack.push({ mode: 'code', depth: 0, popOnClose: true });
      } else if (ch === '<' && startsTag(source, i + 1)) {
        push('punct', '<');
        i += 1;
        const closing = source[i] === '/';
        if (closing) {
          push('punct', '/');
          i += 1;
        }
        stack.push({ mode: 'tag', readName: false, closing, selfClose: false });
      } else {
        push('plain', ch);
        i += 1;
      }
      continue;
    }

    if (frame.mode === 'tag') {
      if (ch === '/') {
        push('punct', '/');
        i += 1;
        frame.selfClose = true; // `/>` — the only `/` legal at tag level
      } else if (ch === '>') {
        push('punct', '>');
        i += 1;
        stack.pop();
        if (frame.closing) {
          // `</Foo>` ends a children region: hand control back to whatever
          // surrounded the matching opening tag.
          const top = stack[stack.length - 1];
          if (top?.mode === 'children') stack.pop();
        } else if (!frame.selfClose) {
          stack.push({ mode: 'children' });
        }
      } else if (ch === '{') {
        push('punct', '{');
        i += 1;
        stack.push({ mode: 'code', depth: 0, popOnClose: true });
      } else if (ch === '"' || ch === "'") {
        i = scanString(source, i, push);
      } else if (isNameStart(ch)) {
        let j = i + 1;
        while (isNameChar(source[j])) j += 1;
        if (source[j] === '-' && isNameStart(source[j + 1])) {
          // custom-element names (my-element)
          j += 1;
          while (isNameChar(source[j]) || source[j] === '-') j += 1;
        }
        push(frame.readName ? 'attr' : 'tag', source.slice(i, j));
        frame.readName = true;
        i = j;
      } else {
        push('punct', ch);
        i += 1;
      }
      continue;
    }

    // code mode
    if (ch === '/' && source[i + 1] === '/') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? source.length : end;
      push('comment', source.slice(i, stop));
      i = stop;
    } else if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      push('comment', source.slice(i, stop));
      i = stop;
    } else if (ch === '"' || ch === "'") {
      i = scanString(source, i, push);
    } else if (ch === '`') {
      push('string', '`');
      i += 1;
      stack.push({ mode: 'template' });
    } else if (ch === '<' && opensTag(source, i)) {
      push('punct', '<');
      i += 1;
      const closing = source[i] === '/';
      if (closing) {
        push('punct', '/');
        i += 1;
      }
      stack.push({ mode: 'tag', readName: false, closing, selfClose: false });
    } else if (ch === '{') {
      frame.depth += 1;
      push('punct', '{');
      i += 1;
    } else if (ch === '}') {
      push('punct', '}');
      i += 1;
      if (frame.depth > 0) frame.depth -= 1;
      else if (frame.popOnClose) stack.pop();
    } else if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(source[i + 1] ?? ''))) {
      const match = /^(?:0[xX][0-9a-fA-F_]+|[0-9][0-9_]*(?:\.[0-9_]+)?(?:[eE][+-]?[0-9]+)?)/.exec(
        source.slice(i)
      );
      const text = match?.[0] ?? ch;
      push('number', text);
      i += text.length;
    } else if (isNameStart(ch)) {
      let j = i + 1;
      while (isNameChar(source[j])) j += 1;
      const word = source.slice(i, j);
      push(KEYWORDS.has(word) ? 'keyword' : 'plain', word);
      i = j;
    } else {
      push('punct', ch);
      i += 1;
    }
  }
  flush();
  return tokens;
}

/** Scan a quoted string starting at source[start]; returns index after it. */
function scanString(
  source: string,
  start: number,
  push: (kind: TokenKind, text: string) => void
): number {
  const quote = source[start]!;
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') i += 2;
    else if (source[i] === quote) {
      i += 1;
      break;
    } else i += 1;
  }
  push('string', source.slice(start, i));
  return i;
}

const tokenClass: Record<Exclude<TokenKind, 'plain'>, string> = {
  keyword: css`
    color: var(--haze-color-primary);
  `,
  string: css`
    color: var(--haze-color-success);
  `,
  comment: css`
    color: var(--haze-color-text-muted);
    font-style: italic;
  `,
  tag: css`
    color: var(--haze-color-danger);
  `,
  attr: css`
    color: var(--haze-color-warning);
  `,
  number: css`
    color: var(--haze-color-warning);
  `,
  punct: css`
    color: var(--haze-color-text-secondary);
  `,
};

/** Files longer than this render plain text past the cap (perf guard). */
const MAX_HIGHLIGHTED_LINES = 400;

/** Index just past the nth line boundary, or source.length. */
function lineCapIndex(source: string, lines: number): number {
  let i = 0;
  for (let n = 0; n < lines && i < source.length; n += 1) {
    const next = source.indexOf('\n', i);
    if (next === -1) return source.length;
    i = next + 1;
  }
  return i;
}

/** Tokenize only when the file is within the perf cap. */
function tokensFor(source: string): HighlightToken[] {
  const cut = lineCapIndex(source, MAX_HIGHLIGHTED_LINES);
  if (cut === source.length) return tokenizeTsx(source);
  const head = tokenizeTsx(source.slice(0, cut));
  return [...head, { kind: 'plain', text: source.slice(cut) }];
}

/**
 * Render demo source as syntax-highlighted React nodes. Plain runs stay raw
 * text nodes (no span); colored runs become keyed spans. Text content is
 * identical to the input, so copy/selection sees the original source.
 */
export function highlightTsx(source: string): ReactNode {
  const nodes: ReactNode[] = tokensFor(source).map((token, index) =>
    token.kind === 'plain'
      ? createElement(Fragment, { key: index }, token.text)
      : createElement(
          'span',
          { key: index, className: tokenClass[token.kind] },
          token.text
        )
  );
  return createElement(Fragment, null, nodes);
}
