import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';

import { useCallback, useEffect, useRef } from 'react';

import { getDirection } from './direction';

/** How long typed characters keep accumulating before the buffer resets. */
const TYPEAHEAD_WINDOW_MS = 500;

/** Default item selector: enabled menu items inside a menu container. */
const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

/** Enabled items inside a container, in DOM order. */
export function getEnabledMenuItems(
  container: HTMLElement | null,
  selector: string = MENU_ITEM_SELECTOR
): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

type UseMenuKeyboardOptions = {
  /** Element containing the item children (`[role=menuitem]` by default). */
  menuRef: RefObject<HTMLElement | null>;
  /**
   * Called when the menu should close via keyboard; the caller returns
   * focus to the trigger.
   */
  onClose: () => void;
  /**
   * Item selector for containers that are not a `role="menu"` — e.g. the
   * `[role=option]` list of a Command palette.
   */
  selector?: string;
  /**
   * Layout axis of the item container. Vertical (default) moves with
   * ↑/↓; horizontal moves with ←/→, mirrored under `dir="rtl"` (←
   * advances) so the keys follow the mirrored layout. Home/End, Escape,
   * Tab-close and typeahead are direction-invariant either way.
   */
  orientation?: 'horizontal' | 'vertical';
};

/**
 * Keyboard behavior for a roving-tabindex item container (WAI-ARIA menu
 * button / listbox pattern): the orientation's main-axis arrows move
 * focus (wrapping, skipping disabled items), Home/End jump to the ends,
 * Escape closes (returning focus to the trigger), Tab closes, and
 * printable characters run typeahead.
 */
export function useMenuKeyboard({
  menuRef,
  onClose,
  selector,
  orientation = 'vertical',
}: UseMenuKeyboardOptions) {
  const typedRef = useRef('');
  const resetTimerRef = useRef(0);

  useEffect(
    () => () => window.clearTimeout(resetTimerRef.current),
    []
  );

  return useCallback(
    (event: ReactKeyboardEvent) => {
      const items = getEnabledMenuItems(menuRef.current, selector);
      if (items.length === 0) return;
      const current = items.indexOf(document.activeElement as HTMLElement);

      const focus = (index: number) => items[index]?.focus();

      // Main-axis arrows for the orientation; horizontal mirrors under
      // RTL (direction read from the DOM at event time — the layout
      // truth the focus order must follow).
      const forward =
        orientation === 'horizontal'
          ? getDirection(menuRef.current) === 'rtl'
            ? 'ArrowLeft'
            : 'ArrowRight'
          : 'ArrowDown';
      const backward =
        orientation === 'horizontal'
          ? getDirection(menuRef.current) === 'rtl'
            ? 'ArrowRight'
            : 'ArrowLeft'
          : 'ArrowUp';

      switch (event.key) {
        case forward:
          event.preventDefault();
          focus((current + 1) % items.length);
          return;
        case backward:
          event.preventDefault();
          focus((current - 1 + items.length) % items.length);
          return;
        case 'Home':
          event.preventDefault();
          focus(0);
          return;
        case 'End':
          event.preventDefault();
          focus(items.length - 1);
          return;
        case 'Escape':
          event.preventDefault();
          onClose();
          return;
        case 'Tab':
          // Close and hand focus to the trigger: without this the focused
          // item unmounts and focus drops to <body>. A following Tab
          // continues past the trigger.
          event.preventDefault();
          onClose();
          return;
        default: {
          if (
            event.key.length !== 1 ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
          ) {
            return;
          }
          event.preventDefault();
          const typed = (typedRef.current + event.key).toLowerCase();
          typedRef.current = typed;
          window.clearTimeout(resetTimerRef.current);
          resetTimerRef.current = window.setTimeout(() => {
            typedRef.current = '';
          }, TYPEAHEAD_WINDOW_MS);
          // Search forward from the current item, wrapping; the current
          // item itself is the last candidate so repeating a character
          // cycles between items starting with it.
          const start = current + 1;
          for (let i = 0; i < items.length; i++) {
            const index = (start + i) % items.length;
            // Element.textContent is spec'd non-null (concatenation of
            // descendants; '' when empty)
            if (items[index]!.textContent.toLowerCase().startsWith(typed)) {
              focus(index);
              return;
            }
          }
        }
      }
    },
    [menuRef, onClose, selector, orientation]
  );
}

type UseRovingTabindexOptions = {
  menuRef: RefObject<HTMLElement | null>;
  /**
   * While false the effect is inert — panels that stay mounted when
   * closed (Menu, Combobox-style listboxes) manage the tab stops only
   * while open.
   */
  active: boolean;
  selector?: string;
};

/**
 * Roving tabindex for a menu/listbox container: exactly one item is a tab
 * stop at any time. On activation the current stop is kept (first item
 * initially); a `focusin` listener moves the stop with focus, and a
 * MutationObserver re-syncs when the item set changes (e.g. a filtered
 * Command list).
 */
export function useRovingTabindex({
  menuRef,
  active,
  selector = MENU_ITEM_SELECTOR,
}: UseRovingTabindexOptions) {
  useEffect(() => {
    const menu = menuRef.current;
    if (!active || !menu) return;

    const sync = () => {
      const items = getEnabledMenuItems(menu, selector);
      if (items.length === 0) return;
      const stop = items.findIndex((el) => el.tabIndex === 0);
      const next = stop >= 0 ? stop : 0;
      items.forEach((el, index) => {
        el.tabIndex = index === next ? 0 : -1;
      });
    };
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(menu, { childList: true, subtree: true });

    const handleFocusIn = (event: FocusEvent) => {
      getEnabledMenuItems(menu, selector).forEach((el) => {
        el.tabIndex = el === event.target ? 0 : -1;
      });
    };
    menu.addEventListener('focusin', handleFocusIn);
    return () => {
      observer.disconnect();
      menu.removeEventListener('focusin', handleFocusIn);
    };
  }, [menuRef, active, selector]);
}
