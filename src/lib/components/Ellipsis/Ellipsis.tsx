import type { ComponentPropsWithoutRef } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useEffect, useRef, useState } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';
import { Tooltip } from '../Tooltip';

type EllipsisProps = {
  /** Full text to clamp; the tooltip and expand affordances reuse it. */
  children: string;
  /** Visible line budget before the ellipsis kicks in (default 1). */
  lines?: number;
  /** Reveal the full text in a library Tooltip while clamped. */
  tooltip?: boolean;
  /** Render an expand/collapse toggle once truncation is detected. */
  expandable?: boolean;
  /** Clamped/revealed state — pass a `useControl` triple to own it. */
  expanded?: ControlOrValue<boolean>;
  /** Fires with the next value on toggle-button activation. */
  onExpandChange?: (expanded: boolean) => void;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'span'>, 'children'>;

const root = css`
  display: block;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  color: var(--haze-color-text);
`;

/* Always the -webkit-box clamp (even for one line, unlike Typography's
   pure-CSS split): the box model makes overflow vertical, so the same
   scrollHeight > clientHeight probe detects truncation for every line
   budget. The inline style carries the runtime `lines` value; when
   expanded the style drops entirely and the text flows unclamped. */
const clampBase = css`
  display: block;
  overflow: hidden;
`;

const expandBtn = css`
  display: inline-flex;
  align-items: center;
  margin-top: var(--haze-space-1);
  padding: 0;
  border: none;
  background: none;
  color: var(--haze-color-primary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  cursor: pointer;

  &:hover {
    color: var(--haze-color-primary-hover);
  }
`;

export default function Ellipsis({
  children,
  lines = 1,
  tooltip = false,
  expandable = false,
  expanded: expandedControl,
  onExpandChange,
  className,
  ...rest
}: EllipsisProps) {
  const strings = useStrings('ellipsis');
  const [isTruncated, setIsTruncated] = useState(false);
  const [expanded, setExpanded] = useControl(expandedControl, false);
  const textRef = useRef<HTMLSpanElement>(null);

  /* Truncation probe: the clamp turns overflow vertical, so
     scrollHeight > clientHeight on the clamped element. Re-measured on
     content and line-budget changes. Skipped while expanded — an
     unclamped element never measures as truncated, and losing the flag
     would strand the user in the expanded state with no way back. */
  useEffect(() => {
    if (expanded) return;
    const el = textRef.current;
    if (!el) return;
    setIsTruncated(el.scrollHeight > el.clientHeight);
  }, [children, lines, expanded]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onExpandChange?.(next);
  };

  const clamped = isTruncated && !expanded;

  const text = (
    <span
      data-slot="content"
      ref={textRef}
      style={
        clamped
          ? {
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: lines,
              overflow: 'hidden',
            }
          : undefined
      }
      x-class={[clampBase]}
    >
      {children}
    </span>
  );

  return (
    <span data-slot="ellipsis" x-class={[root, className]} {...rest}>
      {tooltip && clamped ? <Tooltip content={children}>{text}</Tooltip> : text}
      {expandable && isTruncated && (
        <button
          type='button'
          data-slot="expand-button"
          aria-expanded={expanded}
          onClick={toggle}
          x-class={[expandBtn]}
        >
          {expanded ? strings.collapse : strings.expand}
        </button>
      )}
    </span>
  );
}

export type { EllipsisProps };
