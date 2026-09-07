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
