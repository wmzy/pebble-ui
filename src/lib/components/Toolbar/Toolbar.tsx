import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react';

import { css } from '@linaria/core';
import { useCallback, useRef } from 'react';

import { getEnabledMenuItems, useRovingTabindex } from '../../utils/menuKeyboard';
import { getDirection } from '../../utils/direction';

import { ToolbarProvider } from './ToolbarContext';

/**
 * Registered roving items — ToolbarButton marks itself with the data
 * attribute; separators and any foreign content are skipped, disabled
 * items drop out of the focus order entirely.
 */
const TOOLBAR_ITEM_SELECTOR = '[data-haze-toolbar-item]:not([disabled])';

type ToolbarProps = {
  /** Layout axis; also picks which arrow keys move focus. */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'>;

const toolbar = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
`;

const vertical = css`
  flex-direction: column;
  align-items: stretch;
`;

/**
 * Toolbar keyboard roving (WAI-ARIA toolbar pattern): the orientation's
 * main-axis arrows move focus between registered items with wrapping,
 * Home/End jump to the first/last item. Horizontal toolbars mirror the
 * arrow semantics under `dir="rtl"` (← advances), read from the DOM at
 * event time so the keys follow the painted layout. Composed here
 * instead of extending utils/menuKeyboard — menus are vertical-only
 * with typeahead and Escape/Tab semantics; a toolbar is
 * orientation-aware, wraps instead of stopping at the ends, and owns no
 * open/close lifecycle.
 */
function useToolbarKeyboard(
  orientation: 'horizontal' | 'vertical',
  toolbarRef: RefObject<HTMLElement | null>
) {
  return useCallback(
    (event: ReactKeyboardEvent) => {
      // Horizontal main axis mirrors under RTL; vertical never does.
      const rtl =
        orientation === 'horizontal' &&
        getDirection(toolbarRef.current) === 'rtl';
      const nextKey =
        orientation === 'horizontal'
          ? rtl
            ? 'ArrowLeft'
            : 'ArrowRight'
          : 'ArrowDown';
      const prevKey =
        orientation === 'horizontal'
          ? rtl
            ? 'ArrowRight'
            : 'ArrowLeft'
          : 'ArrowUp';
      if (event.key !== nextKey && event.key !== prevKey && event.key !== 'Home' && event.key !== 'End') {
        return;
      }
      const items = getEnabledMenuItems(toolbarRef.current, TOOLBAR_ITEM_SELECTOR);
      if (items.length === 0) return;
      const current = items.indexOf(document.activeElement as HTMLElement);

      const focus = (index: number) => items[index]?.focus();
      event.preventDefault();
      switch (event.key) {
        case nextKey:
          focus((current + 1) % items.length);
          return;
        case prevKey:
          focus((current - 1 + items.length) % items.length);
          return;
        case 'Home':
          focus(0);
          return;
        case 'End':
          focus(items.length - 1);
          return;
      }
    },
    [orientation, toolbarRef]
  );
}

/**
 * A toolbar: a row (or column) of ToolbarButtons/ToolbarSeparators with
 * roving tabindex — exactly one item is a tab stop at a time, arrow
 * keys move between items (wrapping), Home/End jump to the ends. Tab
 * enters and leaves the toolbar as a whole. Give it an accessible name
 * (aria-label / aria-labelledby) describing its purpose.
 */
export default function Toolbar({
  orientation = 'horizontal',
  className,
  children,
  ...rest
}: ToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  // Always-on roving (a toolbar is a persistent surface, not a panel
  // that gates tab stops on open): first item is the initial stop, and
  // the stop follows focus via the hook's focusin listener.
  useRovingTabindex({ menuRef: toolbarRef, active: true, selector: TOOLBAR_ITEM_SELECTOR });
  const handleKeyDown = useToolbarKeyboard(orientation, toolbarRef);

  return (
    <ToolbarProvider value={orientation}>
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-orientation={orientation}
        x-class={[toolbar, orientation === 'vertical' && vertical, className]}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </div>
    </ToolbarProvider>
  );
}

export type { ToolbarProps };
