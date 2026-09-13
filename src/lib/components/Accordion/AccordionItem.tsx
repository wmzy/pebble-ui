import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type AccordionItemProps = {
  title: ReactNode;
  className?: string;
  children: ReactNode;
};

const item = css`
  border-bottom: 1px solid var(--haze-color-border);

  &:first-of-type {
    border-top: 1px solid var(--haze-color-border);
  }

  /* Height animation via CSS progressive enhancement — same DOM (native
     details/summary), no JS. Chromium wraps collapsible content in the
     ::details-content pseudo box (131+) and interpolate-size
     (129+) lets the closed height 0 interpolate against the open
     height auto; the block only applies where BOTH exist, so engines
     lacking either keep today's instant open/close. End states are
     identical in every engine: closed → zero-height clipped box (same
     pixels as the UA's hidden content), open → auto height with nothing
     clipped. content-visibility transitions with allow-discrete so
     the UA's closed-state hiding lingers until the collapse finishes;
     under prefers-reduced-motion the motion tokens collapse both
     durations to 0ms and the flips become instant. */
  @supports selector(::details-content) and (interpolate-size: allow-keywords) {
    &::details-content {
      height: 0;
      overflow: clip;
      interpolate-size: allow-keywords;
      transition:
        height var(--haze-duration-normal) var(--haze-ease-in-out),
        content-visibility var(--haze-duration-normal) allow-discrete;
    }

    &[open]::details-content {
      height: auto;
    }
  }
`;

const summary = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--haze-space-3) var(--haze-space-4);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text);
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 3px var(--haze-color-focus-ring);
  }

  &::marker,
  &::-webkit-details-marker {
    display: none;
  }

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    /* physical: the chevron is a rotated glyph drawn from physical
       borders — swapping them for logical ones would corrupt the shape
       (rotation itself stays physical either way). */
    border-right: 2px solid var(--haze-color-text-muted);
    border-bottom: 2px solid var(--haze-color-text-muted);
    transform: rotate(-45deg);
    transition: transform var(--haze-duration-normal);
    flex-shrink: 0;
  }

  details[open] > &::after {
    transform: rotate(45deg);
  }
`;

const content = css`
  padding: 0 var(--haze-space-4) var(--haze-space-4);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  line-height: var(--haze-leading-normal);
`;

export default function AccordionItem({
  title,
  className,
  children,
}: AccordionItemProps) {
  return (
    <details x-class={[item, className]} name='accordion'>
      <summary className={summary}>{title}</summary>
      <div className={content}>{children}</div>
    </details>
  );
}

export type { AccordionItemProps };
