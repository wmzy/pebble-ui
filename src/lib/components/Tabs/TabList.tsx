import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';

import { css } from '@linaria/core';
import { useRef } from 'react';

import { getDirection } from '../../utils/direction';

import { useTabsContext } from './TabsContext';

type TabListProps = {
  className?: string;
  children: ReactNode;
};

const base = css`
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--haze-color-border);
  overflow-x: auto;
`;

/** Enabled tabs in DOM order (roving tabindex keeps exactly one stop). */
const TAB_SELECTOR = '[role="tab"]:not([disabled])';

/**
 * The tab strip: a roving-tabindex list per the WAI-ARIA tabs pattern —
 * ←/→ move between tabs with wrapping and automatic activation
 * (selection follows focus), Home/End jump to the ends. Under
 * `dir="rtl"` the horizontal arrows mirror (← advances), read from the
 * DOM at event time so the keys follow the mirrored strip.
 */
export default function TabList({ className, children }: TabListProps) {
  const { setValue, classNames } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(TAB_SELECTOR) ?? []
    );
    if (tabs.length === 0) return;
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);

    const activate = (index: number) => {
      const tab = tabs[index];
      if (!tab) return;
      tab.focus();
      setValue(tab.dataset.hazeTabValue ?? '');
    };

    const nextKey =
      getDirection(listRef.current) === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = nextKey === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        activate(current < 0 ? 0 : (current + 1) % tabs.length);
        return;
      case prevKey:
        event.preventDefault();
        activate(
          current < 0 ? tabs.length - 1 : (current - 1 + tabs.length) % tabs.length
        );
        return;
      case 'Home':
        event.preventDefault();
        activate(0);
        return;
      case 'End':
        event.preventDefault();
        activate(tabs.length - 1);
        return;
    }
  };

  return (
    <div
      ref={listRef}
      data-slot='tab-list'
      role='tablist'
      onKeyDown={handleKeyDown}
      x-class={[base, className, classNames?.list]}
    >
      {children}
    </div>
  );
}

export type { TabListProps };
