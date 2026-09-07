/* eslint-disable react-refresh/only-export-components --
   internal primitives module (hooks + classes + panel component), not a
   fast-refresh boundary; consumers re-render through their own files. */
import type {
  ComponentProps,
  CSSProperties,
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
} from 'react';

import type { CollisionStrategy } from './collision';

import { css } from '@linaria/core';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { computeFloatingPosition, resolvePadding } from './collision';
import { whenExitSettles } from './presence';

/**
 * Internal floating-panel primitives shared by Popover, DropdownMenu,
 * ContextMenu, Datepicker, Combobox, Menu and Tooltip. Not exported from
 * the library entry — the public surface is curated behind the
 * `haze-ui/headless` subpath; consumers compose their own panels on top.
 *
 * RTL note: placement names and geometry are deliberately PHYSICAL —
 * 'left' means the physical left of the trigger, matching the industry
 * convention (Radix, Floating UI) where side/alignment is the consumer's
 * call. An RTL app passes the mirrored placement itself (e.g. 'right'
 * where an LTR app passes 'left'); the collision math below is
 * direction-agnostic because it works on raw viewport rects.
 *
 * Three rendering tiers, chosen by feature detection:
 *
 *   1. popover API + CSS anchor positioning (Chromium): the panel is a
 *      native top-layer `popover=auto` element positioned declaratively
 *      via `position-area`, tracking its trigger for free.
 *   2. popover API only (Firefox / Safari): top-layer panel placed from
 *      the trigger's rect in JS, re-placed on scroll/resize.
 *   3. neither (jsdom, ancient engines): absolutely positioned panel
 *      inside the trigger's relative container, hidden via a class, with
 *      outside-pointerdown and Escape closing bound in JS.
 */

/**
 * Time window (ms) in which a browser-side popover close is attributed to
 * the trigger's pointerdown, and the follow-up click suppressed. A real
 * light-dismiss sequence (pointerdown → close → click) completes well
 * inside it; see the race note at the toggle listener below.
 */
const CLICK_WINDOW = 500;

/** Lazy feature detection so tests can flip between native and fallback. */
export function supportsNativePopover(): boolean {
  return (
    typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype
  );
}

/**
 * Anchor positioning requires the popover API first: jsdom's
 * `CSS.supports` returns true for arbitrary declarations, so it must never
 * be trusted on its own.
 */
export function supportsAnchorPositioning(): boolean {
  return (
    supportsNativePopover() &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name: --haze-floating-probe')
  );
}

// ---------------------------------------------------------------------------
// Path classes. The primitive owns the positioning skeleton; each consumer
// passes its visual skin through FloatingPanel's `visualClass`.
// ---------------------------------------------------------------------------

/**
 * Native path base: undo the UA sheet for `[popover]` (`inset: 0;
 * margin: auto`) so the panel lands where the positioning strategy below
 * puts it instead of the viewport center.
 */
const floatingNative = css`
  inset: auto;
  margin: 0;
`;

/**
 * Native + anchor positioning: the panel tracks its trigger across
 * scroll/resize/viewport changes for free. `--haze-floating-anchor` (set
 * inline per instance) carries the unique anchor name; the position-area
 * and gap come from the per-placement classes below.
 */
const floatingAnchored = css`
  position-anchor: var(--haze-floating-anchor);
`;

/**
 * Native without anchor positioning (older engines): fixed panel placed
 * from the trigger's rect by the position effect below. Still top layer —
 * free of clipping and z-index management.
 */
const floatingFixed = css`
  position: fixed;
`;

/**
 * Fallback path: panel visually hidden while closed. Exported so tests
 * can assert the (animated-delayed) hidden handover like any consumer.
 */
export const floatingHidden = css`
  display: none;
`;

/**
 * Animated panels fade in/out through `data-state` — opacity only.
 * Transform is banned on floating panels: both JS-positioned tiers
 * measure the panel's rect, and getBoundingClientRect includes
 * transforms, so a translating/scaling panel would poison placement.
 * `forwards` keeps a finished fade-out at opacity 0 until the hidden
 * handover lands (a one-frame flash-back would otherwise show).
 */
export const floatingAnimated = css`
  &[data-state='open'] {
    animation: haze-floating-in var(--haze-duration-fast) var(--haze-ease);
  }

  &[data-state='closed'] {
    animation: haze-floating-out var(--haze-duration-fast) var(--haze-ease)
      forwards;
  }

  @keyframes haze-floating-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-floating-out {
    to {
      opacity: 0;
    }
  }
`;

/**
 * Anchored path: declarative placement relative to the trigger.
 *
 * position-area semantics trap: `left`/`right` name the region BESIDE the
 * anchor (the panel hugs the anchor-adjacent edge of that region), not an
 * alignment under it — `bottom left` renders the panel detached to the
 * left of the trigger in Chromium. Under-anchor alignments are expressed
 * with the spans: `span-right` puts the panel's left edge at the
 * trigger's left edge (start-aligned), `span-left` its right edge at the
 * trigger's right edge (end-aligned). Both match the tier-2 geometry
 * ('bottom'/'bottom-span' align start, 'bottom-end' align end) and the
 * fallback tier's top:100%;left:0 / right:0 classes; the spans also give
 * the panel a real cell, without which Chromium never engages
 * position-try-fallbacks (flip-block) on the degenerate side-column
 * cell.
 */
const anchoredBottom = css`
  position-area: bottom span-right;
  margin-top: var(--haze-space-1);
  position-try-fallbacks: flip-block;
`;

const anchoredBottomSpan = css`
  position-area: bottom span-right;
  margin-top: var(--haze-space-1);
  position-try-fallbacks: flip-block;
`;

const anchoredBottomCenter = css`
  position-area: bottom center;
  margin-top: var(--haze-space-1);
  position-try-fallbacks: flip-block;
`;

const anchoredBottomEnd = css`
  position-area: bottom span-left;
  margin-top: var(--haze-space-1);
  position-try-fallbacks: flip-block;
`;

const anchoredTop = css`
  position-area: top center;
  margin-bottom: var(--haze-space-1);
  position-try-fallbacks: flip-block;
`;

const anchoredLeft = css`
  position-area: left center;
  margin-right: var(--haze-space-1);
  position-try-fallbacks: flip-inline;
`;

const anchoredRight = css`
  position-area: right center;
  margin-left: var(--haze-space-1);
  position-try-fallbacks: flip-inline;
`;

/**
 * Fallback path: absolute positioning inside the trigger's container
 * (consumers render it `position: relative`). Matches the geometry the
 * anchored classes express.
 */
const fallbackBottom = css`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  margin-top: var(--haze-space-1);
`;

const fallbackBottomSpan = fallbackBottom;

const fallbackBottomCenter = css`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  margin-top: var(--haze-space-1);
`;

const fallbackBottomEnd = css`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  margin-top: var(--haze-space-1);
`;

const fallbackTop = css`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  margin-bottom: var(--haze-space-1);
`;

const fallbackLeft = css`
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  margin-right: var(--haze-space-1);
`;

const fallbackRight = css`
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  margin-left: var(--haze-space-1);
`;

/** JS-positioned path (tier 2): only the gap margin is declarative. */
const gapBelow = css`
  margin-top: var(--haze-space-1);
`;

const gapAbove = css`
  margin-bottom: var(--haze-space-1);
`;

const gapBefore = css`
  margin-right: var(--haze-space-1);
`;

const gapAfter = css`
  margin-left: var(--haze-space-1);
`;

const anchoredPlacements = {
  bottom: anchoredBottom,
  'bottom-span': anchoredBottomSpan,
  'bottom-center': anchoredBottomCenter,
  'bottom-end': anchoredBottomEnd,
  top: anchoredTop,
  left: anchoredLeft,
  right: anchoredRight,
} as const;

const fallbackPlacements = {
  bottom: fallbackBottom,
  'bottom-span': fallbackBottomSpan,
  'bottom-center': fallbackBottomCenter,
  'bottom-end': fallbackBottomEnd,
  top: fallbackTop,
  left: fallbackLeft,
  right: fallbackRight,
} as const;

const gapPlacements = {
  bottom: gapBelow,
  'bottom-span': gapBelow,
  'bottom-center': gapBelow,
  'bottom-end': gapBelow,
  top: gapAbove,
  left: gapBefore,
  right: gapAfter,
} as const;

type AnchorablePlacement = keyof typeof anchoredPlacements;

/**
 * Panel placement relative to the trigger. `point` leaves positioning
 * entirely to the consumer (e.g. ContextMenu at the pointer coordinates).
 */
export type FloatingPlacement = AnchorablePlacement | 'point';

// ---------------------------------------------------------------------------
// Behavior hook
// ---------------------------------------------------------------------------

type UseFloatingOptions = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  /** Element the panel is anchored to; also the outside-close boundary. */
  triggerRef: RefObject<HTMLElement | null>;
  /** The floating panel element. */
  panelRef: RefObject<HTMLElement | null>;
  /**
   * Fade the panel in/out via `data-state` (opacity only) and keep it
   * visible until its exit animation settles, instead of hiding the
   * instant `open` flips false. Enables `dataState`/`exited` below; in
   * jsdom (no CSS durations) the exit settles within two frames, so
   * tests observe the handover with waitFor.
   */
  animated?: boolean;
  /**
   * Collision knobs consumed by useFloatingPosition on the JS-positioned
   * tiers (the tier-2 flip/shift and the tier-1 cross-axis nudge).
   */
  collision?: CollisionStrategy;
};

export type FloatingBehavior = {
  open: boolean;
  native: boolean;
  anchored: boolean;
  /**
   * Whether the panel element is actually shown right now (native path:
   * mirrored from `toggle` events; fallback path: identical to `open`).
   * Differs from `open` across the commit→effect gap: `open` flips when
   * React commits, while the popover only becomes focusable/paintable
   * after the effect calls showPopover(). Consumers that move focus into
   * the panel on open must gate on `shown`, or the focus call lands on a
   * display:none element and is silently dropped (Chromium).
   */
  shown: boolean;
  /**
   * Panel lifecycle phase for CSS: 'open' while `open` is true (enter
   * animation), 'closed' the moment it flips false (exit animation runs
   * while the panel is still visible). `undefined` when not animated.
   * Render as the panel's `data-state` attribute.
   */
  dataState: 'open' | 'closed' | undefined;
  /**
   * True when the panel is fully closed — nothing visible, nothing
   * animating. Animated: false from the moment `open` flips true until
   * the exit settles, then true again (and true before the first open).
   * Non-animated: mirrors `!open`. Consumers that unmount panel content
   * gate on `!open && exited`.
   */
  exited: boolean;
  /** Collision strategy FloatingPanel forwards to useFloatingPosition. */
  collision: CollisionStrategy | undefined;
  /** Unique CSS anchor name for this instance (anchored path). */
  anchorName: string;
  /** Inline style for the trigger: declares `anchor-name`. */
  triggerStyle: CSSProperties | undefined;
  /** Spread on the trigger: records pointerdown for race attribution. */
  onTriggerPointerDown: () => void;
  /** Spread as the trigger's click handler: suppression-aware toggle. */
  onTriggerClick: () => void;
  /** Spread on the panel: popover attribute + anchor custom property. */
  panelAttrs: { popover: 'auto' | undefined; style: CSSProperties | undefined };
  /**
   * Positioning-skeleton entries for the panel's x-class array. With
   * `animated`, the fallback hidden class is only applied once the exit
   * settled (`exited`), keeping the panel measurable/visible through its
   * fade-out.
   */
  panelClasses: (string | false)[];
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
};

export function useFloating({
  open,
  setOpen,
  triggerRef,
  panelRef,
  animated,
  collision,
}: UseFloatingOptions): FloatingBehavior {
  const id = useId();
  // useId() contains ":" which is invalid in a CSS dashed-ident; strip it.
  const anchorName = `--haze-floating-${id.replace(/[^a-zA-Z0-9]/g, '')}`;

  const native = supportsNativePopover();
  const anchored = supportsAnchorPositioning();

  // Animated bookkeeping: `exited` starts matching `!open` (never opened
  // ⇒ already exited) and flips false the moment `open` does. Returning
  // to true happens only after the exit settles — via the native toggle
  // handler (hidePopover) or the fallback effect below. Without the
  // reset-on-open, a close right after the first open would see a stale
  // `exited === true` and skip the exit animation entirely.
  const [exited, setExited] = useState(!open);
  // Reset during render on the open flip (React-endorsed adjustment) so
  // the first open frame already carries `exited === false`.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setExited(false);
  }

  // Mirrors the panel's live popover visibility, maintained from `toggle`
  // events (which cover browser-side closes too, unlike React state).
  // Drives the show/hide guards: hidePopover() on an already-hidden
  // popover throws InvalidStateError per spec.
  const shownRef = useRef(false);
  // Render-visible mirror of shownRef so consumers can gate effects on
  // actual panel visibility (see the `shown` field on FloatingBehavior).
  const [shown, setShown] = useState(false);
  // The panel element those flags were recorded for — consumers may
  // unmount the panel while closed (menus), and a fresh element starts
  // hidden regardless of what the stale one showed.
  const panelElRef = useRef<HTMLElement | null>(null);
  // Race bookkeeping: timestamp of a trigger pointerdown that predicts a
  // light-dismiss close, and of a close attributed to that pointerdown.
  // "Never" is -Infinity, not 0: in a browser performance.now() counts
  // from navigation start (~0), so a 0 sentinel would swallow every
  // trigger click in the first CLICK_WINDOW of a page's life (caught by
  // Playwright; jsdom's clock starts at process spawn and never showed it).
  const pointerDismissAt = useRef(-Infinity);
  const suppressClickAt = useRef(-Infinity);
  // Our own hidePopover(), whose queued `toggle` echo has not landed yet.
  // Keyed by element: a stale request for a swapped-out panel must not be
  // mistaken for the echo of a hide performed on the current one.
  const hideRequestedRef = useRef<{el: HTMLElement} | null>(null);

  // Native path: React state drives the popover (mirroring Dialog's
  // showModal()/close() pattern) and browser-side closes — Escape, light
  // dismiss on any outside pointerdown — sync back through `toggle`,
  // which does not bubble, hence the native listener. One effect on
  // purpose: the listener must be bound before showPopover() runs.
  //
  // `toggle` events are QUEUED by the browser (delivered before the next
  // rendering opportunity), not dispatched synchronously — a rapid
  // React state flip can therefore land between our showPopover() /
  // hidePopover() call and its echo. The handler must reconcile those
  // echoes instead of re-syncing them back into state: echoing an "open"
  // after a close would resurrect the closed state (reproduced by
  // Enter→Space under parallel e2e load), and echoing a "closed" after a
  // reopen would kill it.
  useEffect(() => {
    const el = panelRef.current;
    if (!el || !native) return;
    if (el !== panelElRef.current) {
      panelElRef.current = el;
      shownRef.current = false;
      setShown(false);
    }
    // Cancels a pending animated hide when the effect re-runs (reopen,
    // unmount, option flip) before the exit animation settles.
    let exitActive = true;

    const hideNow = () => {
      hideRequestedRef.current = {el};
      el.hidePopover();
    };
    // Hide a currently-shown panel: immediately, or once the animated
    // exit has settled. Shared by the effect body (React-driven close)
    // and the toggle handler (late show-echo reconciliation below).
    const beginExit = () => {
      if (!shownRef.current || el !== panelRef.current) return;
      if (animated) {
        // Animated exit: the popover stays shown with data-state=closed so
        // the fade-out can play; hide it once the animation settles. A
        // reopen cancels via exitActive; a browser-side close during the
        // animation flips shownRef first, so the guard skips the
        // (throwing) hidePopover on an already-hidden popover.
        const hideWhenSettled = () => {
          if (!exitActive || !shownRef.current || el !== panelRef.current) {
            return;
          }
          hideNow();
        };
        const settle = whenExitSettles(el);
        if (settle) void settle.then(hideWhenSettled);
        else hideWhenSettled();
      } else {
        hideNow();
      }
    };

    const handleToggle = (event: Event) => {
      const newState = (event as ToggleEvent).newState;
      shownRef.current = newState === 'open';
      setShown(shownRef.current);
      if (newState === 'closed') {
        // An animated panel only counts as exited once it is really
        // hidden — for an exit animation that is after it settles.
        if (animated) setExited(true);
        // Echo of our own hidePopover: if a reopen flipped `open` back on
        // before the queued event landed, re-show to match React (the
        // panel is definitionally hidden right after a "closed" toggle,
        // so this cannot throw). Never a browser-side close.
        const echo = hideRequestedRef.current?.el === el;
        hideRequestedRef.current = null;
        if (echo) {
          if (open) el.showPopover();
          return;
        }
        if (open) {
          // The trigger is not a declarative invoker (it is rarely a button
          // wired via `popovertarget`), so while the popover is open a
          // pointerdown on the trigger light-dismisses it; the click that
          // follows would then toggle it right back open. Attribute closes
          // inside the pointerdown window to the trigger and swallow that
          // one click.
          if (performance.now() - pointerDismissAt.current < CLICK_WINDOW) {
            suppressClickAt.current = performance.now();
          }
          pointerDismissAt.current = -Infinity;
          setOpen(false);
        }
      } else if (!open) {
        // Echo of our own showPopover — with no declarative invoker,
        // nothing but this effect can open the panel, so a browser-side
        // "open" to sync back does not exist. If a close flipped `open`
        // off before the queued event landed, the panel is physically
        // shown while React wants it hidden: run the exit now instead of
        // resurrecting the closed state.
        beginExit();
      }
    };
    el.addEventListener('toggle', handleToggle);
    if (open) {
      if (!shownRef.current) el.showPopover();
    } else {
      beginExit();
    }
    return () => {
      exitActive = false;
      el.removeEventListener('toggle', handleToggle);
    };
  }, [native, open, setOpen, panelRef, animated]);

  // Fallback path: the popover API's light dismiss and Escape close have
  // no native equivalent, so approximate them in JS while open.
  useEffect(() => {
    if (native || !open) return;
    const isInside = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      return Boolean(
        triggerRef.current?.contains(target) || panelRef.current?.contains(target)
      );
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!isInside(event.target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [native, open, setOpen, triggerRef, panelRef]);

  // Fallback path (no popover API): there is no toggle event and no
  // hidePopover to defer — the animated exit is waited out here, after
  // which `exited` re-renders the hidden class into panelClasses. Runs
  // only while a not-yet-exited close is pending; a reopen cancels via
  // the active flag.
  useEffect(() => {
    if (native || !animated || open || exited) return;
    let active = true;
    const el = panelRef.current;
    const settle = el ? whenExitSettles(el) : null;
    const finish = () => {
      if (active) setExited(true);
    };
    if (settle) void settle.then(finish);
    else finish();
    return () => {
      active = false;
    };
  }, [native, animated, open, exited, panelRef]);

  const onTriggerPointerDown = useCallback(() => {
    if (open) pointerDismissAt.current = performance.now();
  }, [open]);

  const onTriggerClick = useCallback(() => {
    if (performance.now() - suppressClickAt.current < CLICK_WINDOW) {
      suppressClickAt.current = -Infinity;
      return;
    }
    setOpen((prev) => !prev);
  }, [setOpen]);

  return {
    open,
    native,
    anchored,
    // Fallback path has no toggle events: visibility === React state.
    shown: native ? shown : open,
    dataState: animated ? (open ? 'open' : 'closed') : undefined,
    exited: animated ? exited : !open,
    collision,
    anchorName,
    triggerStyle: anchored ? { anchorName } : undefined,
    onTriggerPointerDown,
    onTriggerClick,
    panelAttrs: {
      popover: native ? 'auto' : undefined,
      style: anchored
        ? ({ '--haze-floating-anchor': anchorName } as CSSProperties)
        : undefined,
    },
    panelClasses: [
      native && floatingNative,
      native && anchored && floatingAnchored,
      native && !anchored && floatingFixed,
      // Animated fallbacks stay un-hidden until the exit settled above.
      !native && !open && (!animated || exited) && floatingHidden,
      !!animated && floatingAnimated,
    ],
    triggerRef,
    panelRef,
  };
}

// ---------------------------------------------------------------------------
// Placement classes + JS positioning (tier 2)
// ---------------------------------------------------------------------------

/** x-class entries placing the panel relative to the trigger, per tier. */
export function floatingPlacementClasses(
  behavior: Pick<FloatingBehavior, 'native' | 'anchored'>,
  placement: FloatingPlacement
): (string | false)[] {
  if (placement === 'point') return [];
  return [
    behavior.native && behavior.anchored && anchoredPlacements[placement],
    behavior.native && !behavior.anchored && gapPlacements[placement],
    !behavior.native && fallbackPlacements[placement],
  ];
}

function readGap(
  panel: HTMLElement,
  margin: 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight'
): number {
  return parseFloat(getComputedStyle(panel)[margin]) || 0;
}

/**
 * Distance to slide a [start, start+size) span so it fits inside
 * [padStart, extent−padEnd): 0 when it already fits. An inverted range
 * (span wider than the padded extent) pins to the start edge, matching
 * computeFloatingPosition's clamp.
 */
function shiftInto(
  start: number,
  size: number,
  extent: number,
  padStart: number,
  padEnd: number
): number {
  const min = padStart;
  const max = Math.max(min, extent - padEnd - size);
  return Math.min(Math.max(start, min), max) - start;
}

/**
 * Place a fixed panel from the trigger's rect (tier 2). Centers compute
 * from the panel's own rect, so this needs the panel to be laid out —
 * fine in real engines once shown, and unreachable in jsdom where the
 * fallback tier renders instead.
 *
 * Collision handling: a placement that would push the panel past the
 * (optionally padded) viewport edge flips to the opposite side when that
 * side has room, slides along the cross axis, and finally clamps into
 * view when neither side fits — all in computeFloatingPosition. With no
 * `collision` the output is pixel-identical to the legacy inline math
 * (the parity cases in collision.test.ts and the tier-2 regression
 * cases in Popover.test.tsx guard this). Exported for direct testing
 * like `supportsNativePopover` above.
 */
export function placeFloatingPanel(
  panel: HTMLElement,
  trigger: HTMLElement,
  placement: FloatingPlacement,
  collision?: CollisionStrategy
): void {
  if (placement === 'point') return;
  const rect = trigger.getBoundingClientRect();
  const box = panel.getBoundingClientRect();
  const viewport = {width: window.innerWidth, height: window.innerHeight};
  // The gap classes are the only declarative part of this tier — read
  // them back as the clearance between trigger and panel edges.
  const gap = {
    below: readGap(panel, 'marginTop'),
    above: readGap(panel, 'marginBottom'),
    before: readGap(panel, 'marginRight'),
    after: readGap(panel, 'marginLeft'),
  };
  const {top, left} = computeFloatingPosition({
    trigger: rect,
    panel: box,
    viewport,
    placement,
    gap,
    strategy: {
      flip: collision?.flip ?? true,
      shift: collision?.shift ?? true,
      padding: resolvePadding(collision?.collisionPadding),
    },
  });
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

/**
 * JS-assisted positioning:
 *
 * - Tier 2 (popover API, no anchor positioning): place the panel from
 *   the trigger's rect and re-place on scroll/resize while shown.
 * - Tier 1 (anchored): `position-area` + `position-try-fallbacks` handle
 *   the primary axis declaratively; the cross axis is measured here and
 *   nudged back into the padded viewport via `translate`, re-measured on
 *   scroll/resize. Collision padding applies to the cross axis only —
 *   the primary-axis flip is the browser's and cannot see padding
 *   (position-try has no padding concept), a documented limitation.
 *
 * Both tiers gate on actual visibility (`shown`), not `open`: child
 * effects run before the behavior effect that calls showPopover(), and a
 * native popover is `display: none` until then — placing on the `open`
 * commit would measure a zero-size rect and mis-center/mis-align the
 * panel on first open in real engines (jsdom's permissive mocks hide
 * it). The extra render pass after the toggle event is the price for
 * correct geometry.
 */
export function useFloatingPosition({
  behavior,
  placement,
  collision,
}: {
  behavior: FloatingBehavior;
  placement: FloatingPlacement;
  /** Collision knobs; defaults to the behavior's own strategy. */
  collision?: CollisionStrategy;
}): void {
  const { native, anchored, shown, triggerRef, panelRef } = behavior;
  useEffect(() => {
    if (!native || placement === 'point' || !shown) return;
    const panel = panelRef.current;
    if (!panel) return;

    if (anchored) {
      const shift = collision?.shift !== false;
      const pad = resolvePadding(collision?.collisionPadding);
      const horizontal = placement === 'left' || placement === 'right';
      const nudge = () => {
        if (!shift) {
          panel.style.translate = '';
          return;
        }
        const box = panel.getBoundingClientRect();
        const dx = horizontal
          ? 0
          : shiftInto(
              box.left,
              box.width,
              window.innerWidth,
              pad.left,
              pad.right
            );
        const dy = horizontal
          ? shiftInto(
              box.top,
              box.height,
              window.innerHeight,
              pad.top,
              pad.bottom
            )
          : 0;
        panel.style.translate =
          dx === 0 && dy === 0 ? '' : `${dx}px ${dy}px`;
      };
      nudge();
      window.addEventListener('scroll', nudge, true);
      window.addEventListener('resize', nudge);
      return () => {
        window.removeEventListener('scroll', nudge, true);
        window.removeEventListener('resize', nudge);
        panel.style.translate = '';
      };
    }

    const trigger = triggerRef.current;
    if (!trigger) return;
    const place = () => placeFloatingPanel(panel, trigger, placement, collision);
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [native, anchored, shown, placement, collision, triggerRef, panelRef]);
}

// ---------------------------------------------------------------------------
// Panel component
// ---------------------------------------------------------------------------

type FloatingPanelProps = {
  /** Behavior record produced by `useFloating` at the floating root. */
  behavior: FloatingBehavior;
  /**
   * Placement relative to the trigger. Omit (or pass 'point') when the
   * consumer positions the panel itself, e.g. ContextMenu at the pointer.
   */
  placement?: FloatingPlacement;
  /**
   * Collision strategy for the JS-assisted tiers (tier-2 flip/shift,
   * tier-1 cross-axis nudge); defaults to the behavior's own strategy.
   */
  collision?: CollisionStrategy;
  /** Consumer visual skin: border, background, shadow, padding. */
  visualClass?: string;
  className?: string;
  children?: ReactNode;
  /** Merged with the anchor custom property the behavior may set. */
  style?: CSSProperties;
} & Omit<ComponentProps<'div'>, 'className' | 'children' | 'style'>;

/**
 * The panel element of a floating pair: applies the popover attribute,
 * the anchor custom property and the tier/placement classes, mirrors the
 * animated lifecycle as `data-state`, and runs the JS-assisted position
 * effect. Everything else (id, role, handlers, ref) is passed through to
 * the underlying div.
 */
export function FloatingPanel({
  behavior,
  placement,
  collision,
  visualClass,
  className,
  style,
  children,
  ...rest
}: FloatingPanelProps) {
  useFloatingPosition({
    behavior,
    placement: placement ?? 'point',
    collision: collision ?? behavior.collision,
  });

  const mergedStyle =
    behavior.panelAttrs.style || style
      ? { ...behavior.panelAttrs.style, ...style }
      : undefined;

  return (
    <div
      {...(behavior.dataState !== undefined && {
        'data-state': behavior.dataState,
      })}
      {...rest}
      {...behavior.panelAttrs}
      style={mergedStyle}
      x-class={[
        visualClass,
        ...behavior.panelClasses,
        ...(placement ? floatingPlacementClasses(behavior, placement) : []),
        className,
      ]}
    >
      {children}
    </div>
  );
}
