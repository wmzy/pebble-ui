import type { ToastPlacement } from '../Toast/ToastContainer';

import { createContext } from 'react';

/**
 * Component default overrides, keyed by the exported component name —
 * a simplified AntD-v6 `ConfigProvider` channel scoped to prop defaults
 * (theming stays on the token classes, i18n on `LocaleProvider`).
 *
 * Each section names the defaults of one component; an explicit prop on
 * the component itself always beats anything set here, and a missing
 * provider leaves every component on its built-in defaults.
 */
type HazeConfig = {
  /** `Button` prop defaults. */
  Button?: {
    /** Default `size` when the prop is omitted (built-in `'md'`). */
    size?: 'sm' | 'md' | 'lg';
  };
  /** `ButtonLink` prop defaults — the anchor wearing Button's skin. */
  ButtonLink?: {
    /** Default `size` when the prop is omitted (built-in `'md'`). */
    size?: 'sm' | 'md' | 'lg';
  };
  /**
   * Toast defaults. `duration` covers toasts fired through `useToast()`;
   * the module-level `toast()` runs outside any React tree and keeps its
   * own 3000ms default regardless of config. `loading()` toasts keep
   * their persistent (0ms) semantics — config never re-arms them.
   */
  Toast?: {
    /** Auto-dismiss budget in ms when a call omits `duration` (3000). */
    duration?: number;
    /** Viewport edge the stack is pinned to (`'bottom-right'`). */
    placement?: ToastPlacement;
    /** Max simultaneous toasts; oldest dropped on overflow (unbounded). */
    maxCount?: number;
  };
  /** `Tooltip` prop defaults. */
  Tooltip?: {
    /** Hover/focus delay in ms before the tooltip appears (150). */
    delay?: number;
  };
  /** `HoverCard` prop defaults. */
  HoverCard?: {
    /** Hover/focus dwell in ms before the card opens (200). */
    openDelay?: number;
    /**
     * Grace period in ms after the pointer leaves before the card
     * closes — the travel window into the panel (120).
     */
    closeDelay?: number;
  };
};

/**
 * The fully merged config visible below a `ConfigProvider`. The
 * provider resolves nesting itself (inner sections shallow-merge over
 * outer ones), so the context always carries one flat value — consumers
 * never walk a chain.
 */
const ConfigContext = createContext<HazeConfig | undefined>(undefined);

/**
 * Per-section shallow merge for nested providers: keys the inner
 * provider names win, keys it leaves unset keep the outer value, and
 * sections present on only one side pass through untouched. Pure — no
 * DOM access, SSR-safe.
 */
function mergeConfig(
  outer: HazeConfig | undefined,
  inner: HazeConfig | undefined
): HazeConfig {
  if (outer === undefined) return inner ?? {};
  if (inner === undefined) return outer;
  // Section-wise shallow merge, inner wins. Explicit sections (instead of
  // a union-keyed loop) keep the assignment type-safe without casts.
  return {
    Button: { ...(outer.Button ?? {}), ...(inner.Button ?? {}) },
    ButtonLink: { ...(outer.ButtonLink ?? {}), ...(inner.ButtonLink ?? {}) },
    Toast: { ...(outer.Toast ?? {}), ...(inner.Toast ?? {}) },
    Tooltip: { ...(outer.Tooltip ?? {}), ...(inner.Tooltip ?? {}) },
    HoverCard: { ...(outer.HoverCard ?? {}), ...(inner.HoverCard ?? {}) },
  };
}

export { ConfigContext, mergeConfig };
export type { HazeConfig };
