import type { ReactNode } from 'react';

import { css } from '@linaria/core';
import { useEffect, useMemo, useState } from 'react';

/**
 * Pluggable syntax highlighting. Receives the raw code and language,
 * returns an HTML fragment (`<span>`-wrapped tokens) — synchronously or as a
 * Promise. The library ships no built-in highlighter: consumers wire up
 * shiki, Prism, highlight.js, etc. themselves.
 *
 * The returned HTML is injected via `dangerouslySetInnerHTML` as-is —
 * sanitize it or only pass trusted sources.
 */
type Highlighter = (code: string, language: string) => string | Promise<string>;

type CodeBlockProps = {
  children: ReactNode;
  language?: string;
  /**
   * Optional highlighter for string children. Sync results render in the
   * same commit; async results render plain text first, then swap in once
   * the Promise settles (a rejected Promise falls back to plain text).
   * Non-string children are rendered unhighlighted.
   */
  highlight?: Highlighter;
  className?: string;
};

const block = css`
  position: relative;
  background: var(--haze-color-bg-muted);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  overflow-x: auto;
`;

const pre = css`
  margin: 0;
  padding: var(--haze-space-4);
`;

const lang = css`
  position: absolute;
  top: var(--haze-space-2);
  inset-inline-end: var(--haze-space-3);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  text-transform: uppercase;
  user-select: none;
`;

/** Which Promise a settled HTML string belongs to — stale results are ignored. */
type AsyncHighlight = { pending: Promise<string>; html: string | null };

export default function CodeBlock({ children, language, highlight, className }: CodeBlockProps) {
  // Highlighting operates on text; anything richer renders unhighlighted.
  const code = typeof children === 'string' ? children : undefined;

  // Single highlighter invocation per input change (code / language /
  // highlighter identity). A synchronously throwing highlighter degrades to
  // plain text instead of crashing the render.
  const result = useMemo<string | Promise<string> | undefined>(() => {
    if (highlight === undefined || code === undefined) return undefined;
    try {
      return highlight(code, language ?? '');
    } catch {
      return undefined;
    }
  }, [highlight, code, language]);

  const pending = result instanceof Promise ? result : undefined;

  const [asyncState, setAsyncState] = useState<AsyncHighlight | null>(null);

  useEffect(() => {
    if (pending === undefined) return;
    let active = true;
    pending.then(
      (html) => {
        if (active) setAsyncState({ pending, html });
      },
      () => {
        // Rejected: fall back to plain text, never throw.
        if (active) setAsyncState({ pending, html: null });
      },
    );
    return () => {
      // Unmounted, or superseded by a newer code/language/highlighter —
      // the old Promise's result must be discarded.
      active = false;
    };
  }, [pending]);

  const highlighted =
    typeof result === 'string'
      ? result
      : asyncState !== null && asyncState.pending === pending
        ? asyncState.html
        : null;

  return (
    <div data-slot="code-block" x-class={[block, className]}>
      {language && <span data-slot="language-label" x-class={[lang]}>{language}</span>}
      <pre data-slot="code" x-class={[pre]}>
        {highlighted !== null ? (
          <code data-slot="code-text" dangerouslySetInnerHTML={{ __html: highlighted }} />
        ) : (
          <code data-slot="code-text">{children}</code>
        )}
      </pre>
    </div>
  );
}

export type { CodeBlockProps, Highlighter };
