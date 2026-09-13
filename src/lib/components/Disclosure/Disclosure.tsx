import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useEffect, useRef } from 'react';
import { useControl } from 'react-use-control';

type DisclosureProps = {
  open?: ControlOrValue<boolean>;
  summary: ReactNode;
  className?: string;
  children: ReactNode;
};

const details = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  overflow: hidden;
`;

const summaryStyle = css`
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
  padding: var(--haze-space-3) var(--haze-space-4);
  border-top: 1px solid var(--haze-color-border);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  line-height: var(--haze-leading-normal);
`;

export default function Disclosure({
  open: openControl,
  summary,
  className,
  children,
}: DisclosureProps) {
  const [open] = useControl(openControl, false);
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.open = open;
  }, [open]);

  return (
    <details ref={ref} data-slot='disclosure' x-class={[details, className]}>
      <summary data-slot='trigger' className={summaryStyle}>{summary}</summary>
      <div data-slot='content' className={content}>{children}</div>
    </details>
  );
}

export type { DisclosureProps };
