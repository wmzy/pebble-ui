import type { FloatingBehavior } from './index';

import { expect } from 'vitest';
// Explicit vitest expect: jest-axe's @types pull in a global jest expect
// whose matchers may shadow vitest's.
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { createElement, useRef, useState } from 'react';

import {
  FloatingPanel,
  Presence,
  SUBMENU_CLOSE_GRACE_MS,
  SUBMENU_OPEN_DELAY_MS,
  TABBABLE_SELECTOR,
  computeFloatingPosition,
  focusFirst,
  floatingPlacementClasses,
  getDirection,
  getEnabledMenuItems,
  getTabbables,
  hotkey,
  isTabbable,
  localeDirection,
  mergeRefs,
  placeFloatingPanel,
  resolvePadding,
  SubmenuProvider,
  supportsAnchorPositioning,
  supportsNativePopover,
  useClickOutside,
  useDirection,
  useFloating,
  useFloatingPosition,
  useFocusScope,
  useHotkeys,
  useInView,
  useLocalStorage,
  useMediaQuery,
  useMenuKeyboard,
  usePrevious,
  useRovingTabindex,
  useSessionStorage,
  useSubmenu,
  useSubmenuContext,
  useViewTransitionFlip,
  whenExitSettles,
} from './index';

/**
 * Contract test for the `haze-ui/headless` surface: every curated export
 * exists with the documented kind, and the core primitives satisfy their
 * minimal call/render contracts. Deep behavior is covered by the
 * co-located suites in src/lib/utils/.
 */

/*
 * The surface as a local record: iterating named imports keeps the module
 * namespace un-computed (import-x/namespace cannot validate dynamic member
 * access), while still asserting every curated export is defined.
 */
const functionSurface: Record<string, unknown> = {
  supportsNativePopover,
  supportsAnchorPositioning,
  useFloating,
  floatingPlacementClasses,
  placeFloatingPanel,
  useFloatingPosition,
  FloatingPanel,
  Presence,
  whenExitSettles,
  useFocusScope,
  isTabbable,
  getTabbables,
  focusFirst,
  computeFloatingPosition,
  resolvePadding,
  getEnabledMenuItems,
  useMenuKeyboard,
  useRovingTabindex,
  useSubmenu,
  useSubmenuContext,
  localeDirection,
  getDirection,
  useDirection,
  mergeRefs,
  useViewTransitionFlip,
  useClickOutside,
  useHotkeys,
  hotkey,
  useInView,
  useMediaQuery,
  usePrevious,
  useLocalStorage,
  useSessionStorage,
};

describe('haze-ui/headless exports', () => {
  it('exposes every function/component export as a defined function', () => {
    for (const [name, value] of Object.entries(functionSurface)) {
      expect(value, name).toBeDefined();
      expect(typeof value, name).toBe('function');
    }
  });

  it('exposes the tabbable selector as a non-empty string', () => {
    expect(TABBABLE_SELECTOR).toBeDefined();
    expect(typeof TABBABLE_SELECTOR).toBe('string');
    expect(TABBABLE_SELECTOR.length).toBeGreaterThan(0);
  });

  it('exposes SubmenuProvider as the React 19 context provider object', () => {
    // React 19 ships Context.Provider as an exotic object, not a function
    expect(SubmenuProvider).toBeDefined();
    expect(typeof SubmenuProvider).toBe('object');
  });

  it('exposes the submenu timing constants as positive numbers', () => {
    expect(typeof SUBMENU_OPEN_DELAY_MS).toBe('number');
    expect(SUBMENU_OPEN_DELAY_MS).toBeGreaterThan(0);
    expect(typeof SUBMENU_CLOSE_GRACE_MS).toBe('number');
    expect(SUBMENU_CLOSE_GRACE_MS).toBeGreaterThan(0);
  });
});

describe('useFloating', () => {
  it('runs inside a render and returns a behavior record', () => {
    let behavior: FloatingBehavior | undefined;

    function Probe() {
      const triggerRef = useRef<HTMLElement | null>(null);
      const panelRef = useRef<HTMLElement | null>(null);
      const [open, setOpen] = useState(false);
      behavior = useFloating({ open, setOpen, triggerRef, panelRef });
      return null;
    }

    render(createElement(Probe));

    // Tier-independent invariants: closed-from-birth panels are exited,
    // non-animated behaviors carry no data-state, and the anchor name is
    // a valid dashed ident derived from useId.
    expect(behavior).toBeDefined();
    expect(behavior?.open).toBe(false);
    expect(behavior?.shown).toBe(false);
    expect(behavior?.exited).toBe(true);
    expect(behavior?.dataState).toBeUndefined();
    expect(behavior?.anchorName).toMatch(/^--haze-floating-/);
    expect(Array.isArray(behavior?.panelClasses)).toBe(true);
    expect(typeof behavior?.onTriggerClick).toBe('function');
    expect(typeof behavior?.onTriggerPointerDown).toBe('function');
  });
});

describe('Presence', () => {
  it('mounts its child with data-state="open" while present', () => {
    render(
      createElement(Presence, {
        present: true,
        children: createElement('div', { 'data-testid': 'child' }),
      })
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveAttribute('data-state', 'open');
  });

  it('keeps the child unmounted when never presented', () => {
    render(
      createElement(Presence, {
        present: false,
        children: createElement('div', { 'data-testid': 'child' }),
      })
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });
});

describe('computeFloatingPosition', () => {
  it('places a panel below the trigger from literal rects', () => {
    const position = computeFloatingPosition({
      trigger: {
        top: 0,
        left: 0,
        bottom: 24,
        right: 100,
        width: 100,
        height: 24,
      },
      panel: { width: 50, height: 40 },
      viewport: { width: 800, height: 600 },
      placement: 'bottom',
      gap: { below: 4, above: 4, before: 4, after: 4 },
      strategy: {
        flip: true,
        shift: true,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
    });
    expect(position).toEqual({ top: 28, left: 0, placement: 'bottom' });
  });
});

// ---------------------------------------------------------------------------
// Menu keyboard / roving tabindex (../utils/menuKeyboard)
// ---------------------------------------------------------------------------

describe('getEnabledMenuItems', () => {
  it('scopes role=menu containers to their nearest menu ancestor', () => {
    render(
      createElement(
        'div',
        { role: 'menu', 'data-testid': 'root' },
        createElement('div', { role: 'menuitem' }, 'Alpha'),
        createElement(
          'div',
          { role: 'menu' },
          createElement('div', { role: 'menuitem' }, 'Sub One')
        ),
        createElement('div', { role: 'menuitem' }, 'Omega')
      )
    );
    const items = getEnabledMenuItems(screen.getByTestId('root'));
    expect(items.map((el) => el.textContent)).toEqual(['Alpha', 'Omega']);
  });

  it('returns an empty list for a null container', () => {
    expect(getEnabledMenuItems(null)).toEqual([]);
  });
});

describe('useMenuKeyboard / useRovingTabindex', () => {
  function MenuProbe() {
    const menuRef = useRef<HTMLDivElement>(null);
    const handleKeyDown = useMenuKeyboard({
      menuRef,
      onClose: () => undefined,
    });
    useRovingTabindex({ menuRef, active: true });
    return createElement(
      'div',
      { ref: menuRef, role: 'menu', onKeyDown: handleKeyDown },
      createElement('div', { role: 'menuitem', tabIndex: -1 }, 'Alpha'),
      createElement('div', { role: 'menuitem', tabIndex: -1 }, 'Beta'),
      createElement('div', { role: 'menuitem', tabIndex: -1 }, 'Gamma')
    );
  }

  it('establishes exactly one tab stop and moves it with the arrows', () => {
    render(createElement(MenuProbe));
    const items = screen.getAllByRole('menuitem');
    expect(items.map((el) => el.tabIndex)).toEqual([0, -1, -1]);

    items[0]!.focus();
    fireEvent.keyDown(items[0]!, { key: 'ArrowDown' });
    expect(items[1]).toHaveFocus();

    fireEvent.keyDown(items[1]!, { key: 'End' });
    expect(items[2]).toHaveFocus();

    fireEvent.keyDown(items[2]!, { key: 'ArrowDown' });
    expect(items[0]).toHaveFocus();
  });
});

// ---------------------------------------------------------------------------
// Submenu mechanism (../utils/submenu)
// ---------------------------------------------------------------------------

describe('useSubmenu', () => {
  it('returns the behavior record for a closed submenu', () => {
    const { result } = renderHook(() => useSubmenu({}));
    const sub = result.current;
    expect(sub.open).toBe(false);
    expect(typeof sub.contentId).toBe('string');
    expect(sub.contentId.length).toBeGreaterThan(0);
    expect(sub.floating.open).toBe(false);
    expect(typeof sub.onTriggerPointerEnter).toBe('function');
    expect(typeof sub.handleTriggerKeyDown).toBe('function');
    expect(typeof sub.contentKeyDown).toBe('function');
  });

  it('carries the behavior through SubmenuProvider / useSubmenuContext', () => {
    function ContextChild() {
      const ctx = useSubmenuContext();
      return createElement(
        'output',
        { 'data-testid': 'ctx-open' },
        String(ctx.open)
      );
    }

    function Probe() {
      const sub = useSubmenu({});
      return createElement(
        SubmenuProvider,
        { value: sub },
        createElement(ContextChild)
      );
    }
    render(createElement(Probe));
    expect(screen.getByTestId('ctx-open').textContent).toBe('false');
  });

  it('throws from useSubmenuContext outside a SubmenuProvider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect(() => renderHook(() => useSubmenuContext())).toThrow(/Submenu/);
    } finally {
      errorSpy.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// Direction / RTL (../utils/direction)
// ---------------------------------------------------------------------------

describe('direction', () => {
  it('derives the direction from BCP 47 tags', () => {
    expect(localeDirection('ar-SA')).toBe('rtl');
    expect(localeDirection('fa_IR')).toBe('rtl');
    expect(localeDirection('fr')).toBe('ltr');
    expect(localeDirection(undefined)).toBeUndefined();
  });

  it('reads the rendered direction off the DOM', () => {
    expect(getDirection(null)).toBe('ltr');
    render(createElement('div', { dir: 'rtl', 'data-testid': 'rtl' }));
    expect(getDirection(screen.getByTestId('rtl'))).toBe('rtl');
  });

  it('falls back to the document direction without a provider', () => {
    const { result } = renderHook(() => useDirection());
    expect(result.current).toBe('ltr');
  });
});

// ---------------------------------------------------------------------------
// Ref composition (../utils/refs)
// ---------------------------------------------------------------------------

describe('mergeRefs', () => {
  it('forwards the node to object and callback refs alike', () => {
    const obj: { current: HTMLDivElement | null } = { current: null };
    const callback = vi.fn();
    const node = document.createElement('div');

    mergeRefs(obj, callback)(node);

    expect(obj.current).toBe(node);
    expect(callback).toHaveBeenCalledWith(node);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// View transitions (../utils/view-transition)
// ---------------------------------------------------------------------------

describe('useViewTransitionFlip', () => {
  it('degrades to a direct state write without startViewTransition', () => {
    const { result } = renderHook(() => {
      const [open, setOpen] = useState(false);
      const flip = useViewTransitionFlip(true, setOpen);
      return { open, flip };
    });
    expect(result.current.open).toBe(false);
    act(() => result.current.flip(true));
    expect(result.current.open).toBe(true);
    act(() => result.current.flip(false));
    expect(result.current.open).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Document-level interaction hooks (../hooks)
// ---------------------------------------------------------------------------

describe('useHotkeys', () => {
  it('fires only the matching spec and returns void', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({ 'ctrl+k': handler }));

    expect(result.current).toBeUndefined();
    fireEvent.keyDown(document.body, { key: 'k' });
    expect(handler).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(KeyboardEvent));
  });

  it('combines specs into one alias binding via hotkey()', () => {
    expect(hotkey('mod+k', 'mod+j')).toBe('mod+k,mod+j');

    const handler = vi.fn();
    renderHook(() => useHotkeys({ [hotkey('ctrl+k', 'ctrl+j')]: handler }));
    fireEvent.keyDown(document.body, { key: 'j', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('useClickOutside', () => {
  it('fires on outside pointerdown only', () => {
    const onOutside = vi.fn();

    function Panel() {
      const ref = useClickOutside<HTMLDivElement>(onOutside);
      return createElement('div', { ref, 'data-testid': 'panel' });
    }

    render(createElement(Panel));
    fireEvent.pointerDown(screen.getByTestId('panel'));
    expect(onOutside).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body);
    expect(onOutside).toHaveBeenCalledTimes(1);
  });
});

describe('useMediaQuery', () => {
  it('returns a stable false for never-matching queries', () => {
    // 999999px never matches on any engine, and engines without
    // matchMedia (the documented no-engine contract) stay false too.
    const { result } = renderHook(() => useMediaQuery('(min-width: 999999px)'));
    expect(result.current).toBe(false);
  });
});

describe('useInView', () => {
  it('returns a callback ref plus a false flag without an element', () => {
    // jsdom ships no IntersectionObserver — the documented no-engine
    // contract is a stable false without throwing.
    const { result } = renderHook(() => useInView<HTMLDivElement>());
    const [ref, inView] = result.current;
    expect(typeof ref).toBe('function');
    expect(inView).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Persistent state hooks (../hooks)
// ---------------------------------------------------------------------------

describe('useLocalStorage / useSessionStorage', () => {
  it('persists uncontrolled writes to localStorage as JSON', () => {
    const key = 'haze-headless-test-local';
    const { result } = renderHook(() =>
      useLocalStorage<string>(key, undefined, 'initial')
    );
    act(() => result.current[1]('persisted'));
    expect(result.current[0]).toBe('persisted');
    expect(window.localStorage.getItem(key)).toBe('"persisted"');
    window.localStorage.removeItem(key);
  });

  it('persists uncontrolled writes to sessionStorage as JSON', () => {
    const key = 'haze-headless-test-session';
    const { result } = renderHook(() =>
      useSessionStorage<string>(key, undefined, 'initial')
    );
    act(() => result.current[1]('persisted'));
    expect(result.current[0]).toBe('persisted');
    expect(window.sessionStorage.getItem(key)).toBe('"persisted"');
    window.sessionStorage.removeItem(key);
  });
});

describe('usePrevious', () => {
  it('holds the previous render value, undefined on the first', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });
    expect(result.current).toBeUndefined();
    rerender({ value: 2 });
    expect(result.current).toBe(1);
    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });
});
