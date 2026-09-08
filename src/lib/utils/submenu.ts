/**
 * Shared mechanism for nested submenus, consumed by the Menu and
 * DropdownMenu families (`MenuSub*` / `DropdownMenuSub*`). Headless: the
 * hook owns open state (useControl), the floating pair, hover intent,
 * level-scoped keyboard behavior and roving tabindex; the family
 * components are visual skins over the returned behavior record plus the
 * context that carries it from the Sub container to its trigger/content.
 *
 * Keyboard contract (WAI-ARIA menu button / menu pattern, per level):
 *   - ArrowDown/Up/Home/End/typeahead stay within the current level
 *     (getEnabledMenuItems scopes a `role=menu` container to its nearest
 *     menu ancestor);
 *   - the inline-end arrow (ArrowRight in LTR, ArrowLeft under
 *     `dir="rtl"`) on a sub trigger opens that submenu and focuses its
 *     first item;
 *   - the inline-start arrow inside a submenu closes it and returns
 *     focus to its trigger;
 *   - Escape closes only the innermost open level (events are stopped at
 *     the level that handled them);
 *   - Tab closes the whole stack (propagation is deliberately NOT
 *     stopped for Tab so every ancestor level also closes).
 */
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { createContext, useCallback, useContext, useEffect, useId, useRef } from 'react';
import { useControl } from 'react-use-control';

import { getDirection } from './direction';
import { useFloating, type FloatingBehavior } from './floating';
import { getEnabledMenuItems, useMenuKeyboard, useRovingTabindex } from './menuKeyboard';

/** Pointer rest time before a submenu opens on hover (intent, not rest). */
export const SUBMENU_OPEN_DELAY_MS = 120;
/** Grace before a hover-opened submenu closes after the pointer left it. */
export const SUBMENU_CLOSE_GRACE_MS = 160;

type UseSubmenuOptions = {
  /** Whether the submenu is open — controlled control or uncontrolled initial value. */
  open?: ControlOrValue<boolean>;
  /** Fires on every open transition, whatever drove it. */
  onOpenChange?: (open: boolean) => void;
};

/** Mechanism surface shared between a Sub container and its skin parts. */
export type SubmenuBehavior = {
  open: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  /** id of the sub panel; wired to the trigger's `aria-owns` while open. */
  contentId: string;
  /** Floating-panel behavior of the (trigger, panel) pair. */
  floating: FloatingBehavior;
  /** Hover-intent open; spread on the sub trigger's `onPointerEnter`. */
  onTriggerPointerEnter: () => void;
  /**
   * Inline-end arrow opens (focusing the first item), Escape and the
   * inline-start arrow close an open submenu from its trigger; spread on
   * the trigger's `onKeyDown`.
   */
  handleTriggerKeyDown: (event: ReactKeyboardEvent) => void;
  /**
   * Level-scoped keyboard for the sub panel: the shared menu keyboard
   * plus level containment — every handled key stops propagating so the
   * parent level stays inert, except Tab which closes the whole stack.
   */
  contentKeyDown: (event: ReactKeyboardEvent) => void;
};

export function useSubmenu({
  open: openControl,
  onOpenChange,
}: UseSubmenuOptions): SubmenuBehavior {
  const [open, setOpenState] = useControl(openControl, false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  // Focus handoff requested when the trigger opens the submenu by
  // keyboard — consumed after the panel is actually shown (a native
  // popover is display:none until showPopover(); a .focus() before that
  // is silently dropped in Chromium).
  const focusRequestRef = useRef(false);
  const openTimerRef = useRef(0);
  const closeTimerRef = useRef(0);

  // Same shape as DropdownMenu's handleSetOpen: accepts functional updates
  // (the floating engine's trigger click toggles with (prev) => !prev) and
  // notifies onOpenChange on every transition, whatever drove it.
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value;
      setOpenState(next);
      onOpenChange?.(next);
    },
    [open, setOpenState, onOpenChange]
  );

  const floating = useFloating({
    open,
    setOpen,
    triggerRef,
    panelRef: contentRef,
    animated: true,
  });

  // --- hover intent -------------------------------------------------------
  // Open after a short rest on the trigger; close with grace once the
  // pointer settles anywhere outside the trigger ∪ panel region (a
  // document-level pointerover listener, so sibling items need no
  // cooperation from the parent menu). Re-entering the region cancels a
  // pending close.
  //
  // Fallback-tier note: on engines without the popover API the parent
  // menu hides through CSS only, so a submenu that was open when the
  // parent closed re-appears until the next pointerover closes it (the
  // native tier reconciles through toggle events — hidePopover on an
  // ancestor hides nested popovers).
  const clearCloseTimer = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
  }, []);

  const closeAfterGrace = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, SUBMENU_CLOSE_GRACE_MS);
  }, [setOpen]);

  const onTriggerPointerEnter = useCallback(() => {
    if (triggerRef.current?.disabled) return;
    clearCloseTimer();
    if (open) return;
    window.clearTimeout(openTimerRef.current);
    openTimerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, SUBMENU_OPEN_DELAY_MS);
  }, [open, setOpen, clearCloseTimer]);

  useEffect(() => {
    const inRegion = (target: EventTarget | null) =>
      target instanceof Node &&
      Boolean(
        triggerRef.current?.contains(target) ||
          contentRef.current?.contains(target)
      );
    const handlePointerOver = (event: PointerEvent) => {
      if (inRegion(event.target)) {
        if (open) clearCloseTimer();
        return;
      }
      // Pointer left the trigger before the open delay elapsed: cancel
      // the pending open; when this level is open, run the close grace.
      window.clearTimeout(openTimerRef.current);
      if (!open) return;
      closeAfterGrace();
    };
    document.addEventListener('pointerover', handlePointerOver);
    return () => {
      document.removeEventListener('pointerover', handlePointerOver);
      if (open) clearCloseTimer();
    };
  }, [open, clearCloseTimer, closeAfterGrace]);

  useEffect(
    () => () => {
      window.clearTimeout(openTimerRef.current);
      window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  // --- keyboard -----------------------------------------------------------
  const focusFirstItem = useCallback(() => {
    getEnabledMenuItems(contentRef.current)[0]?.focus();
  }, []);

  useEffect(() => {
    if (!open || !floating.shown) return;
    if (!focusRequestRef.current) return;
    focusRequestRef.current = false;
    focusFirstItem();
  }, [open, floating.shown, focusFirstItem]);

  // Keyboard-driven close (Escape / inline-start arrow / Tab): restore
  // focus to the trigger only when it actually was inside this level —
  // hover-driven closes never steal focus from wherever it lives.
  const closeAndRestoreFocus = useCallback(() => {
    const restore = contentRef.current?.contains(document.activeElement) ?? false;
    setOpen(false);
    if (restore) triggerRef.current?.focus();
  }, [setOpen]);

  const handleTriggerKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (triggerRef.current?.disabled) return;
      const dir = getDirection(triggerRef.current);
      const openKey = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const closeKey = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (event.key === openKey) {
        event.preventDefault();
        event.stopPropagation();
        if (open) {
          focusFirstItem();
        } else {
          focusRequestRef.current = true;
          setOpen(true);
        }
      } else if (open && (event.key === closeKey || event.key === 'Escape')) {
        // Close only this level; without the stop the parent's handler
        // would close the whole menu. With the submenu closed the keys
        // bubble and act on the parent level as usual.
        event.preventDefault();
        event.stopPropagation();
        closeAndRestoreFocus();
      }
    },
    [open, setOpen, focusFirstItem, closeAndRestoreFocus]
  );

  const levelKeyDown = useMenuKeyboard({
    menuRef: contentRef,
    onClose: closeAndRestoreFocus,
    onCloseToStart: closeAndRestoreFocus,
  });

  const contentKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      levelKeyDown(event);
      // Level containment: unhandled-by-this-level keys (even printable
      // typeahead misses) must not reach the parent's handler — it would
      // act on the parent item list with activeElement inside this panel
      // (index -1) and yank focus out. Tab is the exception: it closes
      // every level, which needs the parent handlers to run.
      if (event.key !== 'Tab') event.stopPropagation();
    },
    [levelKeyDown]
  );

  useRovingTabindex({ menuRef: contentRef, active: open });

  return {
    open,
    triggerRef,
    contentRef,
    contentId,
    floating,
    onTriggerPointerEnter,
    handleTriggerKeyDown,
    contentKeyDown,
  };
}

// ---------------------------------------------------------------------------
// Context carrying the behavior from a Sub container to its trigger/content
// parts. Nesting works naturally: each Sub re-provides for its own parts.
// ---------------------------------------------------------------------------

const SubmenuContext = createContext<SubmenuBehavior | undefined>(undefined);

export const SubmenuProvider = SubmenuContext.Provider;

export function useSubmenuContext(): SubmenuBehavior {
  const ctx = useContext(SubmenuContext);
  if (!ctx) {
    throw new Error(
      'Submenu components must be used within <MenuSub> or <DropdownMenuSub>'
    );
  }
  return ctx;
}
