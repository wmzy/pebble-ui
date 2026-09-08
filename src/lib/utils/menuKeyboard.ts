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
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector));
  // Nested submenus keep their panel inside the parent menu's DOM (the
  // popover top layer only changes paint order, not the tree). For menu
  // containers keep only items whose NEAREST menu ancestor is the
  // container itself, so each level's keyboard traversal, typeahead and
  // roving tabindex see exactly its own items — a submenu trigger
  // belongs to the parent level, the submenu's items do not. Non-menu
  // containers (listbox, toolbar) never nest menus and pass through.
  if (container.getAttribute('role') === 'menu') {
    return items.filter((el) => el.closest('[role="menu"]') === container);
  }
  return items;
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
   * Submenu levels only: called for the inline-start arrow (ArrowLeft in
   * LTR, ArrowRight under `dir="rtl"` — mirrored like the horizontal
   * orientation) so this level closes and focus returns to its trigger.
   * Root menus leave it unset and the key stays inert.
   */
  onCloseToStart?: () => void;
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
  onCloseToStart,
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

      // Submenu level: the inline-start arrow closes this level (and the
      // caller returns focus to its trigger) before the switch — a
      // submenu is always vertical, so the key is otherwise inert.
      if (onCloseToStart) {
        const startKey =
          getDirection(menuRef.current) === 'rtl'
            ? 'ArrowRight'
            : 'ArrowLeft';
        if (event.key === startKey) {
          event.preventDefault();
          onCloseToStart();
          return;
        }
      }

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
    [menuRef, onClose, selector, onCloseToStart, orientation]
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
      const items = getEnabledMenuItems(menu, selector);
      // Focus landing outside this level's items (a nested submenu's
      // panel lives inside this container's DOM) must not strip the
      // level's tab stop — the stop moves only with focus on its own
      // items.
      if (!items.includes(event.target as HTMLElement)) return;
      items.forEach((el) => {
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
