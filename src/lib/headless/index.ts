/**
 * `haze-ui/headless` — the behavior layer the haze-ui components are built
 * on, curated for authors assembling their own components: floating-panel
 * positioning (native popover + anchor positioning with graceful fallback
 * tiers), exit-animation presence, focus trapping, tab-order queries, and
 * pure collision geometry. Same source, same version, same design tokens
 * as the `haze-ui` component library — none of it is exported from the
 * main entry.
 *
 * Stable public API: this module carries the same semver commitment as
 * the `haze-ui` component library — breaking changes land only on a
 * major version. The primitives still evolve alongside the library's
 * own components, within that contract.
 */

import {
  computeFloatingPosition,
  resolvePadding,
} from '../utils/collision';
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
import { Presence, whenExitSettles } from '../utils/presence';

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
