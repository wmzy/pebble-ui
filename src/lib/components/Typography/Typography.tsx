import type { CSSProperties, ReactNode, JSX } from 'react';

import { css } from '@linaria/core';

// Title
type TitleProps = {
  level?: 1 | 2 | 3 | 4 | 5;
  className?: string;
  children: ReactNode;
};

const titleBase = css`
  font-family: var(--haze-font-sans);
  font-weight: var(--haze-weight-bold);
  color: var(--haze-color-text);
  margin: 0;
`;

const titleLevels = {
  1: css`font-size: var(--haze-text-3xl); line-height: var(--haze-leading-tight);`,
  2: css`font-size: var(--haze-text-2xl); line-height: var(--haze-leading-tight);`,
  3: css`font-size: var(--haze-text-xl); line-height: var(--haze-leading-tight);`,
  4: css`font-size: var(--haze-text-lg); line-height: var(--haze-leading-normal);`,
  5: css`font-size: var(--haze-text-base); line-height: var(--haze-leading-normal);`,
} as const;

export function Title({ level = 1, className, children }: TitleProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <Tag x-class={[titleBase, titleLevels[level], className]}>
      {children}
    </Tag>
  );
}

// Text
type TextProps = {
  type?: 'default' | 'secondary' | 'muted';
  strong?: boolean;
  code?: boolean;
  mark?: boolean;
  /** Pure-CSS truncation: `true`/single-line → nowrap ellipsis,
   * `{ lines: N }` (N ≥ 2) → line clamp. */
  ellipsis?: TextEllipsis;
  className?: string;
  children: ReactNode;
};

const textBase = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
`;

const textTypes = {
  default: css`color: var(--haze-color-text);`,
  secondary: css`color: var(--haze-color-text-secondary);`,
  muted: css`color: var(--haze-color-text-muted);`,
} as const;

const textStrong = css`
  font-weight: var(--haze-weight-bold);
`;

const textCode = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  padding: var(--haze-space-0) var(--haze-space-1);
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
`;

const textMark = css`
  background: color-mix(in srgb, var(--haze-color-warning) 25%, transparent);
  padding: 0 var(--haze-space-1);
`;

/*
 * Pure-CSS truncation — no hooks, so Typography stays in the RSC-safe
 * set (scripts/rsc-safe.mjs). Single line is a static class; the
 * multi-line `-webkit-line-clamp` box model carries an arbitrary
 * runtime line count, so it ships as an inline style instead of a
 * Linaria class per value. Supported by all three modern engines
 * (Blink / Gecko / WebKit).
 */

/** `ellipsis` prop shape shared by Text and Paragraph. */
type TextEllipsis = boolean | { lines?: number };

const ellipsisSingle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** Resolved line budget; `{}` and `true` both mean a single line. */
function ellipsisLines(ellipsis: TextEllipsis | undefined): number {
  const lines = typeof ellipsis === 'object' ? ellipsis.lines : undefined;
  return Math.max(1, lines ?? 1);
}

/** Inline style for the N-line clamp (N ≥ 2). */
function lineClampStyle(lines: number): CSSProperties {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
  };
}

/** String children get a native `title` fallback so clamped text
 * stays reachable for pointer users and AT that exposes it. */
function ellipsisTitle(
  ellipsis: TextEllipsis | undefined,
  children: ReactNode
): string | undefined {
  return ellipsis && typeof children === 'string' ? children : undefined;
}

export function Text({
  type = 'default',
  strong,
  code,
  mark,
  ellipsis,
  className,
  children,
}: TextProps) {
  let Tag: keyof JSX.IntrinsicElements = 'span';
  if (strong) Tag = 'strong';
  else if (code) Tag = 'code';

  const clamped = Boolean(ellipsis);
  const lines = ellipsisLines(ellipsis);

  return (
    <Tag
      x-class={[
        textBase,
        textTypes[type],
        strong && !code && textStrong,
        code && textCode,
        mark && textMark,
        clamped && lines === 1 && ellipsisSingle,
        className,
      ]}
      style={clamped && lines > 1 ? lineClampStyle(lines) : undefined}
      title={ellipsisTitle(ellipsis, children)}
    >
      {children}
    </Tag>
  );
}

// Paragraph
type ParagraphProps = {
  /** Same truncation contract as `Text.ellipsis`. */
  ellipsis?: TextEllipsis;
  className?: string;
  children: ReactNode;
};

const paragraphBase = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  color: var(--haze-color-text);
  margin: 0 0 var(--haze-space-4);
`;

export function Paragraph({ ellipsis, className, children }: ParagraphProps) {
  const clamped = Boolean(ellipsis);
  const lines = ellipsisLines(ellipsis);

  return (
    <p
      x-class={[
        paragraphBase,
        clamped && lines === 1 && ellipsisSingle,
        className,
      ]}
      style={clamped && lines > 1 ? lineClampStyle(lines) : undefined}
      title={ellipsisTitle(ellipsis, children)}
    >
      {children}
    </p>
  );
}

export type { TitleProps, TextProps, ParagraphProps, TextEllipsis };
