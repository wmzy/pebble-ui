/**
 * `haze-ui/headless` — the behavior layer the haze-ui components are built
 * on, curated for authors assembling their own components: floating-panel
 * positioning (native popover + anchor positioning with graceful fallback
 * tiers), exit-animation presence, focus trapping, tab-order queries,
 * pure collision geometry, menu/submenu keyboard machinery, RTL direction
 * resolution, ref composition, View-Transition-wrapped state flips, and
 * the document-level interaction hooks (click-outside, hotkeys, in-view,
 * media queries) plus the storage-persisted state hooks. Same source,
 * same version, same design tokens as the `haze-ui` component library —
 * the general-purpose hooks and direction helpers are also exported from
 * the main entry; this module gathers the whole behavior layer under one
 * import.
 *
 * Stable public API: this module carries the same semver commitment as
 * the `haze-ui` component library — breaking changes land only on a
 * major version. The primitives still evolve alongside the library's
 * own components, within that contract.
 */

import { useClickOutside } from '../hooks/useClickOutside';
import { hotkey, useHotkeys } from '../hooks/useHotkeys';
import { useInView } from '../hooks/useInView';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePrevious } from '../hooks/usePrevious';
import { useSessionStorage } from '../hooks/useSessionStorage';
import {
  computeFloatingPosition,
  resolvePadding,
} from '../utils/collision';
import { getDirection, localeDirection, useDirection } from '../utils/direction';
import {
  FloatingPanel,
  floatingPlacementClasses,
  placeFloatingPanel,
  supportsAnchorPositioning,
  supportsNativePopover,
  useFloating,
  useFloatingPosition,
} from '../utils/floating';
import {
  focusFirst,
  getTabbables,
  isTabbable,
  TABBABLE_SELECTOR,
} from '../utils/focus';
import { useFocusScope } from '../utils/focus-scope';
import {
  getEnabledMenuItems,
  useMenuKeyboard,
  useRovingTabindex,
} from '../utils/menuKeyboard';
import { Presence, whenExitSettles } from '../utils/presence';
import { mergeRefs } from '../utils/refs';
import {
  SUBMENU_CLOSE_GRACE_MS,
  SUBMENU_OPEN_DELAY_MS,
  SubmenuProvider,
  useSubmenu,
  useSubmenuContext,
} from '../utils/submenu';
import { useViewTransitionFlip } from '../utils/view-transition';

// ---------------------------------------------------------------------------
// Floating behavior (../utils/floating)
// ---------------------------------------------------------------------------

/**
 * Detects the native Popover API (`popover` attribute, top layer,
 * light-dismiss). The floating primitives use this to choose their
 * rendering tier.
 */
export { supportsNativePopover };

/**
 * Detects CSS anchor positioning on top of the native Popover API. The
 * floating primitives use this to choose between the declarative anchored
 * tier and JS-assisted positioning.
 */
export { supportsAnchorPositioning };

/**
 * The floating-pair behavior hook: pass the open state pair plus trigger
 * and panel refs, receive a `FloatingBehavior` record describing the
 * engine tier and everything to spread on the trigger and panel. This is
 * the same engine Popover, DropdownMenu, Combobox, Datepicker and Tooltip
 * run on.
 */
export { useFloating };

/**
 * Options accepted by {@link useFloating}: the open state pair, trigger
 * and panel refs, plus optional animation and collision knobs.
 */
export type UseFloatingOptions = Parameters<typeof useFloating>[0];

/**
 * Behavior record returned by {@link useFloating}: tier flags, lifecycle
 * phases (`shown`/`dataState`/`exited`), and the props/class entries to
 * spread on the trigger and panel elements.
 */
export type { FloatingBehavior } from '../utils/floating';

/**
 * Panel placement relative to the trigger (`'bottom' | 'bottom-span' |
 * 'bottom-center' | 'bottom-end' | 'top' | 'left' | 'right'`, or
 * `'point'` to position the panel yourself, e.g. at pointer coordinates).
 * Logical, not physical: under `dir="rtl"` the horizontal placements and
 * the start/end alignments mirror automatically.
 */
export type { FloatingPlacement } from '../utils/floating';

/**
 * x-class entries placing a panel element relative to its trigger, per
 * engine tier — for consumers composing their own panel instead of using
 * {@link FloatingPanel}.
 */
export { floatingPlacementClasses };

/**
 * Imperatively place a fixed panel from the trigger's rect (the
 * JS-positioned tier). Re-run on scroll/resize — or use
 * {@link useFloatingPosition}, which wires that up.
 */
export { placeFloatingPanel };

/**
 * Hook that keeps a floating panel positioned on the JS-assisted tiers:
 * tier-2 fixed placement and the tier-1 cross-axis nudge, re-run on
 * scroll and resize.
 */
export { useFloatingPosition };

/**
 * The panel half of a floating pair: applies the popover attribute, the
 * anchor custom property and the tier/placement classes, mirrors the
 * animated lifecycle as `data-state`, and runs the JS-assisted position
 * effect. Your visual skin goes in `visualClass`; everything else passes
 * through to the underlying div.
 */
export { FloatingPanel };

/**
 * Props accepted by {@link FloatingPanel} — behavior record, optional
 * placement/collision overrides, `visualClass` skin, plus native div
 * attributes.
 */
export type FloatingPanelProps = Parameters<typeof FloatingPanel>[0];

// ---------------------------------------------------------------------------
// Presence / exit animations (../utils/presence)
// ---------------------------------------------------------------------------

/**
 * Keeps a single child mounted while its exit animation runs: the child
 * receives `data-state="open" | "closed"` (render your enter/exit
 * transitions on it) and unmounts only after the exit settles. This is
 * the engine behind haze-ui's animated panels, modals and collapsibles.
 */
export { Presence };

/**
 * Props accepted by {@link Presence}: `present`, a single-element
 * `children`, and an optional `onExited` callback.
 */
export type { PresenceProps } from '../utils/presence';

/**
 * Wait for an element's exit animation/transition to finish. Resolves
 * immediately when no positive duration is declared, `null` for an
 * element outside the document; repeated calls share the in-flight
 * settle. The imperative companion to {@link Presence}.
 */
export { whenExitSettles };

// ---------------------------------------------------------------------------
// Focus (../utils/focus-scope, ../utils/focus)
// ---------------------------------------------------------------------------

/**
 * Focus-domain hook for overlays: attach the returned ref callback to a
 * container and flip `enabled` to get initial focus, focus restoration
 * and optional Tab trapping — a simplified Radix-style FocusScope with
 * no CSS dependency.
 */
export { useFocusScope };

/**
 * Options accepted by {@link useFocusScope}: `enabled`, `trapped`,
 * `autoFocus`, `returnFocus`, and the mount/unmount auto-focus event
 * callbacks (preventable via `event.preventDefault()`).
 */
export type { FocusScopeOptions } from '../utils/focus-scope';

/**
 * Tab-order candidate selector (structural filter only; runtime state —
 * disabled, hidden, visibility — is filtered by {@link isTabbable}).
 */
export { TABBABLE_SELECTOR };

/**
 * Whether an element is in the Tab order: matches
 * {@link TABBABLE_SELECTOR} and is not disabled, hidden or invisible.
 */
export { isTabbable };

/**
 * All tabbable elements inside a container, in DOM order (the container
 * itself excluded).
 */
export { getTabbables };

/**
 * Focus the first tabbable element in a container, or the container
 * itself when none exists. Returns whether focus actually transferred —
 * guarding against `focus()` silently no-op-ing on disabled or detached
 * elements.
 */
export { focusFirst };

// ---------------------------------------------------------------------------
// Collision geometry (../utils/collision)
// ---------------------------------------------------------------------------

/**
 * Pure floating-panel collision math over literal rects — no DOM, no
 * React: baseline coordinates, then flip on the primary axis, shift on
 * the cross axis, primary-axis clamp. The deterministic core of the
 * JS-positioned tiers.
 */
export { computeFloatingPosition };

/**
 * Arguments accepted by {@link computeFloatingPosition}: trigger rect,
 * panel and viewport sizes, placement, per-direction gap, and the
 * resolved strategy record.
 */
export type ComputeFloatingPositionOptions = Parameters<
  typeof computeFloatingPosition
>[0];

/**
 * Position resolved by {@link computeFloatingPosition}: panel `top`/
 * `left` and the (possibly flipped) placement side.
 */
export type FloatingPosition = ReturnType<typeof computeFloatingPosition>;

/**
 * Normalize a {@link CollisionPadding} into a full per-side record — the
 * padding shape {@link computeFloatingPosition}'s strategy expects.
 */
export { resolvePadding };

/**
 * Viewport edge a collision measurement applies to.
 */
export type { CollisionSide } from '../utils/collision';

/**
 * Viewport inset for collision checks: a number applies to all four
 * sides, an object per side.
 */
export type { CollisionPadding } from '../utils/collision';

/**
 * Collision knobs: `flip` to the opposite side and `shift` along the
 * cross axis when the panel overflows the padded viewport (both default
 * on), plus `collisionPadding`. Consumers may pass any subset.
 */
export type { CollisionStrategy } from '../utils/collision';

// ---------------------------------------------------------------------------
// Menu keyboard (../utils/menuKeyboard)
// ---------------------------------------------------------------------------

/**
 * Enabled menu items inside a container, in DOM order. `role="menu"`
 * containers scope each item to its nearest menu ancestor, so a nested
 * submenu's items belong to their own level — the same query the
 * haze-ui menu families' traversal, typeahead and roving tabindex run
 * on. The item selector is customizable for non-menu containers
 * (listboxes, command palettes).
 */
export { getEnabledMenuItems };

/**
 * Keyboard behavior for a roving-tabindex item container (WAI-ARIA menu
 * button pattern): the orientation's main-axis arrows move focus
 * wrapping and skipping disabled items (mirrored under `dir="rtl"` for
 * horizontal layouts), Home/End jump to the ends, Escape and Tab close,
 * printable characters run typeahead. Returns the `onKeyDown` handler
 * to spread on the container — the engine DropdownMenu, ContextMenu and
 * Command run on.
 */
export { useMenuKeyboard };

/**
 * Options accepted by {@link useMenuKeyboard}: the container ref, the
 * close callback, an optional custom item selector, the submenu-level
 * `onCloseToStart` callback and the layout `orientation`.
 */
export type UseMenuKeyboardOptions = Parameters<typeof useMenuKeyboard>[0];

/**
 * Roving tabindex for a menu/listbox container: exactly one item is a
 * tab stop at any time — kept on activation, moved with focus, and
 * re-synced by a MutationObserver when the item set changes (e.g. a
 * filtered list). While `active` is false the effect is inert.
 */
export { useRovingTabindex };

/**
 * Options accepted by {@link useRovingTabindex}: the container ref, the
 * `active` flag and an optional custom item selector.
 */
export type UseRovingTabindexOptions = Parameters<typeof useRovingTabindex>[0];

// ---------------------------------------------------------------------------
// Submenu mechanism (../utils/submenu)
// ---------------------------------------------------------------------------

/**
 * The nested-submenu mechanism behind `MenuSub*` / `DropdownMenuSub*`:
 * owns the open state (controllable through the `open` option), drives
 * the floating pair, wires hover intent (rest-delayed open, graceful
 * close) and the level-scoped keyboard contract — the inline-end arrow
 * opens focusing the first item, Escape and the inline-start arrow
 * close only this level, Tab closes the whole stack. Returns the
 * behavior record the family components skin.
 */
export { useSubmenu };

/**
 * Options accepted by {@link useSubmenu}: the `open` state (controlled
 * control or uncontrolled initial value) and `onOpenChange`, fired on
 * every open transition whatever drove it.
 */
export type UseSubmenuOptions = Parameters<typeof useSubmenu>[0];

/**
 * Behavior record returned by {@link useSubmenu}: the open state, the
 * trigger/content refs, the panel id, the floating behavior, and the
 * handlers to spread on the trigger (`onPointerEnter`, `onKeyDown`)
 * and the panel (`onKeyDown`).
 */
export type { SubmenuBehavior } from '../utils/submenu';

/**
 * Context provider carrying a {@link SubmenuBehavior} from a Sub
 * container to its trigger/content parts — for authors composing their
 * own submenu skins. Nesting works naturally: each Sub re-provides for
 * its own parts.
 */
export { SubmenuProvider };

/**
 * Read the nearest {@link SubmenuBehavior} provided by an enclosing
 * {@link SubmenuProvider}. Throws outside one.
 */
export { useSubmenuContext };

/**
 * Pointer rest time before a submenu opens on hover (intent, not
 * rest), in milliseconds.
 */
export { SUBMENU_OPEN_DELAY_MS };

/**
 * Grace before a hover-opened submenu closes after the pointer settled
 * outside it, in milliseconds.
 */
export { SUBMENU_CLOSE_GRACE_MS };

// ---------------------------------------------------------------------------
// Direction / RTL (../utils/direction)
// ---------------------------------------------------------------------------

/**
 * Writing direction of a subtree: `'ltr'` or `'rtl'`.
 */
export type { Direction } from '../utils/direction';

/**
 * Direction implied by a BCP 47 tag — RTL primary language subtags
 * (`ar`, `fa`, `he`, `ur`, …) resolve to `'rtl'`, everything else to
 * `'ltr'`; `undefined` when no tag is given.
 */
export { localeDirection };

/**
 * Rendered direction of an element: the nearest ancestor carrying a
 * `dir` attribute, `'ltr'` when none does. The layout truth that
 * arrow-key mirroring and JS placement math must follow — read it at
 * event/measure time, never from React state.
 */
export { getDirection };

/**
 * Declared direction for the current tree: the LocaleProvider chain's
 * explicit `direction` prop or locale-derived direction, falling back
 * to the document's rendered direction when no provider is mounted.
 * Prefer {@link getDirection} on the concrete element whenever the
 * value must match the painted layout.
 */
export { useDirection };

// ---------------------------------------------------------------------------
// Ref composition (../utils/refs)
// ---------------------------------------------------------------------------

/**
 * Compose several refs (object and/or callback) into one callback ref —
 * the pattern for merging a behavior record's `triggerRef`/`panelRef`
 * with your own element handle on the same node.
 */
export { mergeRefs };

// ---------------------------------------------------------------------------
// View transitions (../utils/view-transition)
// ---------------------------------------------------------------------------

/**
 * Wrap a boolean open-state flip in a View Transition — the same outlet
 * the Dialog/Drawer/BottomSheet `viewTransition` prop runs on. Every
 * write executes inside `document.startViewTransition(() =>
 * flushSync(...))`; the full guard chain (disabled,
 * `prefers-reduced-motion: reduce`, unsupported engine) degrades to a
 * direct write. Pass the flag and the `useControl` setter, and use the
 * returned writer wherever the state flips.
 */
export { useViewTransitionFlip };

// ---------------------------------------------------------------------------
// Document-level interaction hooks (../hooks)
// ---------------------------------------------------------------------------

/**
 * Call back on `pointerdown` outside an element: attach the returned
 * stable callback ref to the target, optionally ignore refs (e.g. the
 * trigger), and toggle `enabled` with the panel's open state so a
 * closed overlay costs no listener. Shadow-DOM retargeted clicks are
 * attributed correctly via `event.composedPath()`.
 */
export { useClickOutside };

/**
 * Options accepted by {@link useClickOutside}: `enabled` (default
 * `true`) and the `ignore` ref list — elements whose hits do not count
 * as outside.
 */
export type { UseClickOutsideOptions } from '../hooks/useClickOutside';

/**
 * Declarative keyboard shortcuts: a map of spec strings (`'mod+k'`,
 * `'ctrl+shift+p'`, `'?'`, named keys) to handlers, listened on the
 * window (or a ref target). `mod` normalizes per platform (⌘ on macOS,
 * Ctrl elsewhere), editable focus suppresses fires unless
 * `allowInInput`, and the map may be an inline literal — a latest-ref
 * keeps the listener mounted once.
 */
export { useHotkeys };

/**
 * Combine several hotkey specs into one comma-joined alias binding so
 * a single handler catches any of them:
 * `useHotkeys({ [hotkey('mod+k', 'mod+j')]: cycle })`.
 */
export { hotkey };

/**
 * Handler signature {@link useHotkeys} calls with the raw KeyboardEvent
 * (already `preventDefault`-ed and stopped when it fires).
 */
export type { HotkeyHandler } from '../hooks/useHotkeys';

/**
 * Options accepted by {@link useHotkeys}: `enabled`, `target` (element
 * ref or `window`), `eventName` and `allowInInput`.
 */
export type { UseHotkeysOptions } from '../hooks/useHotkeys';

/**
 * Observe whether an element is in the viewport: attach the returned
 * callback ref and read the `inView` flag. `once: true` freezes after
 * the first intersection (lazy-load style); engines without
 * IntersectionObserver (SSR, jsdom) stay `false` without throwing.
 */
export { useInView };

/**
 * Options accepted by {@link useInView}: the IntersectionObserver init
 * members plus the `once` freeze flag.
 */
export type { UseInViewOptions } from '../hooks/useInView';

/**
 * Subscribe to a CSS media query and return whether it currently
 * matches; the query can change per render. SSR and hydration snapshots
 * are `false` (no `window` access), and engines without `matchMedia`
 * get a stable `false` instead of a throw.
 */
export { useMediaQuery };

// ---------------------------------------------------------------------------
// Persistent state hooks (../hooks)
// ---------------------------------------------------------------------------

/**
 * The value from the previous render; `undefined` on the first.
 * Compared by identity per render — no deep equality.
 */
export { usePrevious };

/**
 * localStorage-persisted controllable state: initial-value resolution
 * is persisted value > uncontrolled prop > `initial`, uncontrolled
 * writes persist as JSON, cross-tab updates arrive via `storage`
 * events, and a controlled `control` stays the single source of truth
 * (no write-back). Unavailable storage (private mode) degrades
 * silently to in-memory state.
 */
export { useLocalStorage };

/**
 * sessionStorage-persisted controllable state — exactly the semantics
 * of {@link useLocalStorage}, scoped to the tab session.
 */
export { useSessionStorage };
