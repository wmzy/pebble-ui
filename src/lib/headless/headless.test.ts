import type { FloatingBehavior } from './index';

import { expect } from 'vitest';
// Explicit vitest expect: jest-axe's @types pull in a global jest expect
// whose matchers may shadow vitest's.
import { render, screen } from '@testing-library/react';
import { createElement, useRef, useState } from 'react';

import {
  FloatingPanel,
  Presence,
  TABBABLE_SELECTOR,
  computeFloatingPosition,
  focusFirst,
  floatingPlacementClasses,
  getTabbables,
  isTabbable,
  placeFloatingPanel,
  resolvePadding,
  supportsAnchorPositioning,
  supportsNativePopover,
  useFloating,
  useFloatingPosition,
  useFocusScope,
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
