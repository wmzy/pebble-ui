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

  /* Forced-colors: the UA forces the transparent inactive underline to
     CanvasText (transparent borders do not survive), so every tab
     gains an underline that merges with the strip line — acceptable
     noise, but it also means selection can no longer ride the
     underline. The box-shadow focus ring is dropped by the UA — an
     inset Highlight outline replaces it (the strip scrolls, an outer
     outline would clip). */
  @media (forced-colors: active) {
    &:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }
  }
`;

const active = css`
  color: var(--haze-color-primary);
  border-bottom-color: var(--haze-color-primary);

  /* Forced-colors: the primary underline and text flatten onto
     CanvasText — the selected tab would be indistinguishable. The
     Windows-native selection renders instead: a Highlight chip with
     HighlightText content. */
  @media (forced-colors: active) {
    background: Highlight;
    color: HighlightText;
    border-bottom-color: Highlight;
  }
`;

export default function Tab({ value, className, children }: TabProps) {
  const { value: current, setValue, classNames } = useTabsContext();
  const isActive = current === value;

  return (
    <button
      type='button'
      data-slot='tab'
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
