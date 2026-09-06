import { useMemo, useRef } from 'react';
import { css } from '@linaria/core';

import { parseMarkdown, splitBlocks } from './markdown-blocks';

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

const wrapper = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  color: var(--haze-color-text);
  word-break: break-word;

  & h1, & h2, & h3, & h4, & h5, & h6 {
    font-weight: var(--haze-weight-semibold);
    margin-top: var(--haze-space-4);
    margin-bottom: var(--haze-space-2);
    line-height: var(--haze-leading-tight);
  }

  & h1 { font-size: var(--haze-text-2xl); }
  & h2 { font-size: var(--haze-text-xl); }
  & h3 { font-size: var(--haze-text-lg); }
  & h4 { font-size: var(--haze-text-base); }

  & p {
    margin-bottom: var(--haze-space-3);
  }

  & ul, & ol {
    margin-bottom: var(--haze-space-3);
    padding-inline-start: var(--haze-space-6);
  }

  & li {
    margin-bottom: var(--haze-space-1);
  }

  & code {
    font-family: var(--haze-font-mono);
    font-size: 0.875em;
    background: var(--haze-color-bg-muted);
    padding: 0.125em 0.375em;
    border-radius: var(--haze-radius-sm);
  }

  & pre {
    margin-bottom: var(--haze-space-3);
    padding: var(--haze-space-4);
    background: var(--haze-color-bg-muted);
    border-radius: var(--haze-radius-md);
    overflow-x: auto;

    & code {
      background: none;
      padding: 0;
    }
  }

  & blockquote {
    margin-bottom: var(--haze-space-3);
    padding-inline-start: var(--haze-space-4);
    border-inline-start: 3px solid var(--haze-color-border);
    color: var(--haze-color-text-muted);
  }

  & a {
    color: var(--haze-color-primary);
    text-decoration: underline;
  }

  & table {
    width: 100%;
    margin-bottom: var(--haze-space-3);
    border-collapse: collapse;
  }

  & th, & td {
    padding: var(--haze-space-2) var(--haze-space-3);
    border: 1px solid var(--haze-color-border);
    text-align: start;
  }

  & th {
    background: var(--haze-color-bg-muted);
    font-weight: var(--haze-weight-medium);
  }

  & hr {
    margin: var(--haze-space-4) 0;
    border: none;
    border-top: 1px solid var(--haze-color-border);
  }

  & img {
    max-width: 100%;
    border-radius: var(--haze-radius-md);
  }
`;

type BlockCache = { source: readonly string[]; parsed: string[] };

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Partition at blank-line boundaries (outside code fences, at even
  // backtick parity — see markdown-blocks.ts). While content streams in,
  // only the active tail block changes; every earlier block is stable.
  const blocks = useMemo(() => splitBlocks(content), [content]);

  // Sliding per-block memo: value-compare each block against the previous
  // content's block list (`===` compares string values), so stable prefix
  // blocks reuse their parse and only changed blocks run the pipeline.
  // parseMarkdown is pure, so caching across renders is safe even for
  // discarded concurrent renders.
  const cacheRef = useRef<BlockCache>({ source: [], parsed: [] });
  const html = useMemo(() => {
    const prev = cacheRef.current;
    const parsed = blocks.map((block, i) =>
      // source/parsed are same-length; a matching source slot always has
      // its parsed counterpart.
      prev.source[i] === block ? prev.parsed[i]! : parseMarkdown(block),
    );
    cacheRef.current = { source: blocks, parsed };
    // Single newline between blocks — exactly what parseMarkdown's final
    // `\n{2,}` collapse produces for the blank-line separators.
    return parsed.join('\n');
  }, [blocks]);

  return (
    <div
      x-class={[wrapper, className]}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export type { MarkdownRendererProps };
