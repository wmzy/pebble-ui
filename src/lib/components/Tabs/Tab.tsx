import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useTabsContext } from './TabsContext';

type TabProps = {
  value: string;
  className?: string;
  children: ReactNode;
};

const base = css`
  padding: var(--haze-space-2) var(--haze-space-4);
  border: none;
  background: transparent;
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition:
    color var(--haze-duration-fast),
    border-color var(--haze-duration-fast);

  &:hover {
    color: var(--haze-color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const active = css`
  color: var(--haze-color-primary);
  border-bottom-color: var(--haze-color-primary);
`;

export default function Tab({ value, className, children }: TabProps) {
  const { value: current, setValue, classNames } = useTabsContext();
  const isActive = current === value;

  return (
    <button
      type='button'
      role='tab'
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      // Roving tabindex (WAI-ARIA tabs): the active tab is the tab stop,
      // arrow keys in TabList move it — Tab itself stays out of the
      // page tab order.
      tabIndex={isActive ? 0 : -1}
      data-haze-tab-value={value}
      x-class={[base, isActive && active, className, classNames?.tab]}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

export type { TabProps };
