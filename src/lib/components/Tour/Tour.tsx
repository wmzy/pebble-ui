import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { FloatingPlacement } from '../../utils/floating';

import { css } from '@linaria/core';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useControl } from 'react-use-control';

import { computeFloatingPosition, resolvePadding } from '../../utils/collision';
import { getDirection } from '../../utils/direction';
import { Presence } from '../../utils/presence';
import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';

/** Why the tour closed: the last step's Done button vs. an early exit. */
type TourCloseReason = 'done' | 'skip';

/**
 * Step-card placement relative to the spotlighted target — logical
 * semantics (mirrors under RTL, like FloatingPlacement), the anchorable
 * subset ('point' has no meaning without a floating trigger pair).
 */
type TourPlacement = Exclude<FloatingPlacement, 'point'>;

type TourStep = {
  /**
   * The spotlighted element: a CSS selector or a getter returning it. A
   * null/hidden/unresolvable target degrades to a screen-centered card
   * instead of throwing.
   */
  target: string | (() => HTMLElement | null);
  title?: ReactNode;
  content: ReactNode;
  /** Card placement relative to the target. Default 'bottom'. */
  placement?: TourPlacement;
};

type TourProps = {
  steps: TourStep[];
  open?: ControlOrValue<boolean>;
  /** Index of the active step; a plain value is the uncontrolled initial. */
  current?: ControlOrValue<number>;
  onClose?: (reason: TourCloseReason) => void;
  onStepChange?: (index: number) => void;
  /**
   * Close (skip) the tour when the mask itself is clicked. Default false —
   * an accidental click must not throw away progress.
   */
  maskClosable?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'title' | 'children'>;

/** Spotlight breathing room around the target rect, in px (mirrors --haze-space-2). */
const SPOTLIGHT_PAD = 8;
/** Clearance between the target rect and the step card, in px. */
const CARD_GAP = 16;

/** Spotlight rect in viewport coordinates, padded around the target. */
type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Resolve a step's target. An invalid selector string is a missing target,
 * not a crash — querySelector would otherwise throw a SyntaxError.
 */
function resolveTarget(step: TourStep): HTMLElement | null {
  const { target } = step;
  if (typeof target === 'function') return target();
  try {
    return document.querySelector<HTMLElement>(target);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/*
 * Fullscreen click-catcher. Visually transparent by itself: the dim layer
 * is painted either by the spotlight's giant box-shadow (a single element
 * cutting a hole, not four mask panels) or by the plain full mask below.
 * Clicks land here because it covers the viewport — the spotlight and the
 * mask are pointer-events: none.
 */
const overlay = css`
  position: fixed;
  inset: 0;
  /* ConfirmDialog tier: above page content; toasts stay on top (9999). */
  z-index: 100;
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);

  &[data-state='open'] {
    animation: haze-tour-in var(--haze-duration-normal) var(--haze-ease);
  }

  &[data-state='closed'] {
    animation: haze-tour-out var(--haze-duration-fast) var(--haze-ease);
  }

  @keyframes haze-tour-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-tour-out {
    to {
      opacity: 0;
    }
  }
`;

/*
 * The spotlight: a padded hole over the target. The enormous second
 * box-shadow paints the whole mask except the element's own (rounded)
 * box; the first is the focus-ring tracing the hole's edge. Its rect is
 * written inline by the placement effect and transitions between steps,
 * giving the driver.js-style traveling spotlight for free.
 */
const spotlight = css`
  position: absolute;
  border-radius: var(--haze-radius-md);
  pointer-events: none;
  box-shadow:
    0 0 0 3px var(--haze-color-focus-ring),
    0 0 0 9999px rgba(0, 0, 0, 0.4);

  transition:
    top var(--haze-duration-normal) var(--haze-ease),
    left var(--haze-duration-normal) var(--haze-ease),
    width var(--haze-duration-normal) var(--haze-ease),
    height var(--haze-duration-normal) var(--haze-ease);
`;

/* Mask for steps without a laid-out target: no hole, whole screen dimmed
   (same backdrop value as Dialog/Drawer/ConfirmDialog ::backdrop). */
const mask = css`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
`;

/*
 * Step card. Fixed and JS-positioned (style.top/left against the target
 * rect through computeFloatingPosition), so the enter/exit animations are
 * opacity-only — a transform would pollute the placement measurement
 * (floatingAnimated precedent). Declared before centeredCard: when both
 * classes apply, source order lets centeredCard override top/left.
 */
const card = css`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  max-width: 360px;
  padding: var(--haze-space-4);
  background: var(--haze-color-bg);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  box-shadow: var(--haze-shadow-xl);

  [data-state='open'] & {
    animation: haze-tour-card-in var(--haze-duration-normal) var(--haze-ease);
  }

  [data-state='closed'] & {
    animation: haze-tour-card-out var(--haze-duration-fast) var(--haze-ease);
  }

  @keyframes haze-tour-card-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-tour-card-out {
    to {
      opacity: 0;
    }
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      var(--haze-shadow-xl),
      0 0 0 3px var(--haze-color-focus-ring);
  }
`;

/* Fallback while the step has no laid-out target: screen-centered card. */
const centeredCard = css`
  top: 50%;
  left: 50%;
  translate: -50% -50%;
`;

const titleStyle = css`
  margin: 0 0 var(--haze-space-2);
  font-size: var(--haze-text-base);
  font-weight: var(--haze-weight-semibold);
`;

const bodyStyle = css`
  margin-block-end: var(--haze-space-4);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  line-height: var(--haze-leading-relaxed);
`;

const footerStyle = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--haze-space-2);
`;

const counterStyle = css`
  margin-inline-end: auto;
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

const btn = css`
  padding: var(--haze-space-2) var(--haze-space-4);
  border-radius: var(--haze-radius-md);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  font-weight: var(--haze-weight-medium);
  cursor: pointer;
  transition:
    background var(--haze-duration-fast) var(--haze-ease),
    border-color var(--haze-duration-fast) var(--haze-ease);
`;

const subtleBtn = css`
  background: var(--haze-color-bg);
  border: 1px solid var(--haze-color-border);
  color: var(--haze-color-text);

  &:hover {
    background: var(--haze-color-bg-muted);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const primaryBtn = css`
  background: var(--haze-color-primary);
  border: 1px solid var(--haze-color-primary);
  color: var(--haze-color-text-inverse);

  &:hover {
    opacity: 0.9;
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Guided-tour overlay: dims the page, spotlights each step's target and
 * anchors a card to it (missing/hidden targets fall back to a centered
 * card). Esc skips, ArrowRight/ArrowLeft step through; the mask itself
 * ignores clicks unless `maskClosable`. The spotlight element carries
 * `data-haze-tour-spotlight` for consumer styling/targeting.
 */
export default function Tour({
  steps,
  open: openControl,
  current: currentControl,
  onClose,
  onStepChange,
  maskClosable = false,
  className,
  ...rest
}: TourProps) {
  const [open, setOpen] = useControl(openControl, false);
  const [current, setCurrent] = useControl(currentControl, 0);
  const strings = useStrings('tour');
  const titleId = `haze-tour-title-${useId()}`;
  const counterId = `haze-tour-step-${useId()}`;

  const total = steps.length;
  // Tolerates an out-of-range `current` without writing back.
  const index = Math.min(Math.max(current, 0), Math.max(total - 1, 0));
  const step = total > 0 ? steps[index] : undefined;
  const last = index >= total - 1;
  const placement = step?.placement ?? 'bottom';
  const stepOf = formatString(strings.stepOf, { current: index + 1, total });

  // A reopened uncontrolled tour restarts at the first step (driver.js /
  // shepherd behavior); a control or explicit value keeps what the app set.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && currentControl === undefined) setCurrent(0);
  }

  const cardRef = useRef<HTMLDivElement | null>(null);
  // Step index the card focus already ran for; keeps unrelated re-renders
  // (scroll/resize placements) from stealing focus back from the buttons.
  const focusedStepRef = useRef(-1);
  // Spotlight rect; null while the active step has no laid-out target —
  // the card falls back to screen center.
  const [spot, setSpot] = useState<SpotlightRect | null>(null);
  const spotRef = useRef<SpotlightRect | null>(null);

  const close = useCallback(
    (reason: TourCloseReason) => {
      setOpen(false);
      onClose?.(reason);
    },
    [onClose, setOpen]
  );

  const goTo = useCallback(
    (next: number) => {
      setCurrent(next);
      onStepChange?.(next);
    },
    [onStepChange, setCurrent]
  );

  // Resolve the active step's target, scroll it into view, then place the
  // card relative to its rect. A missing/hidden target (stale selector,
  // unmounted getter result, display:none — all measure to zero) degrades
  // to the centered card instead of throwing. Re-runs per step: the next
  // card's content can resize it even when target/placement are unchanged.
  useEffect(() => {
    if (!open) return;
    const active = total > 0 ? steps[index] : undefined;
    const card = cardRef.current;
    if (!active || !card) return;

    const el = resolveTarget(active);
    // Scroll before measuring: the card positions against the post-scroll
    // rect. jsdom has no scrollIntoView — tests stub it (Carousel
    // precedent).
    el?.scrollIntoView({ block: 'nearest' });

    const applySpot = (next: SpotlightRect | null) => {
      const prev = spotRef.current;
      const changed =
        (prev === null) !== (next === null) ||
        (prev !== null &&
          next !== null &&
          (prev.top !== next.top ||
            prev.left !== next.left ||
            prev.width !== next.width ||
            prev.height !== next.height));
      if (changed) {
        spotRef.current = next;
        setSpot(next);
      }
    };

    const place = () => {
      const rect = el?.getBoundingClientRect();
      if (!el || !rect || (rect.width === 0 && rect.height === 0)) {
        card.style.top = '';
        card.style.left = '';
        applySpot(null);
        return;
      }
      const box = card.getBoundingClientRect();
      const { top, left } = computeFloatingPosition({
        trigger: rect,
        panel: { width: box.width, height: box.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        placement,
        gap: {
          below: CARD_GAP,
          above: CARD_GAP,
          before: CARD_GAP,
          after: CARD_GAP,
        },
        dir: getDirection(card),
        strategy: { flip: true, shift: true, padding: resolvePadding() },
      });
      card.style.top = `${top}px`;
      card.style.left = `${left}px`;
      applySpot({
        top: rect.top - SPOTLIGHT_PAD,
        left: rect.left - SPOTLIGHT_PAD,
        width: rect.width + SPOTLIGHT_PAD * 2,
        height: rect.height + SPOTLIGHT_PAD * 2,
      });
    };

    place();

    // Viewport movement re-places card and spotlight, rAF-throttled so a
    // scroll storm costs at most one placement per frame. Scroll does not
    // bubble, but it captures down to window.
    let raf = 0;
    const onViewportChange = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        place();
      });
    };
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, steps, index, total, placement]);

  // Focus lands on the card (not a button) once per step: a stable landing
  // point for keyboard users while the global listener drives navigation.
  useEffect(() => {
    if (!open) {
      focusedStepRef.current = -1;
      return;
    }
    if (focusedStepRef.current === index) return;
    focusedStepRef.current = index;
    cardRef.current?.focus();
  }, [open, index]);

  // Global keyboard contract: Esc skips, arrows step. Arrow keys keep
  // their caret meaning inside editable regions. Under RTL the stepping
  // arrows mirror (Left advances), matching the mirrored footer buttons.
  useEffect(() => {
    if (!open || total === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        close('skip');
        return;
      }
      const node = event.target;
      if (
        node instanceof HTMLElement &&
        (node.isContentEditable ||
          node.tagName === 'INPUT' ||
          node.tagName === 'TEXTAREA' ||
          node.tagName === 'SELECT')
      ) {
        return;
      }
      // Direction of the subtree the keypress landed in — the card is
      // the usual focus target while the tour runs.
      const next =
        getDirection(
          node instanceof Element ? node : cardRef.current
        ) === 'rtl'
          ? 'ArrowLeft'
          : 'ArrowRight';
      const prev = next === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
      if (event.key === next && !last) {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === prev && index > 0) {
        event.preventDefault();
        goTo(index - 1);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, total, index, last, close, goTo]);

  if (!step || typeof document === 'undefined') return null;

  return createPortal(
    <Presence present={open}>
      <div
        x-class={[overlay]}
        onClick={
          maskClosable
            ? (event) => {
                // Direct mask hits only — clicks inside the card must not
                // close the tour (Dialog's target guard pattern).
                if (open && event.target === event.currentTarget) {
                  close('skip');
                }
              }
            : undefined
        }
      >
        {spot !== null ? (
          <div
            data-haze-tour-spotlight=''
            aria-hidden='true'
            x-class={[spotlight]}
            style={{
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
            }}
          />
        ) : (
          <div aria-hidden='true' x-class={[mask]} />
        )}
        <div
          ref={cardRef}
          role='dialog'
          aria-modal='false'
          aria-labelledby={step.title !== undefined ? titleId : counterId}
          tabIndex={-1}
          x-class={[card, spot === null && centeredCard, className]}
          {...rest}
        >
          {step.title !== undefined && (
            <h2 id={titleId} x-class={[titleStyle]}>
              {step.title}
            </h2>
          )}
          <div x-class={[bodyStyle]}>{step.content}</div>
          <div x-class={[footerStyle]}>
            <span id={counterId} x-class={[counterStyle]}>
              {stepOf}
            </span>
            <button
              type='button'
              x-class={[btn, subtleBtn]}
              onClick={() => close('skip')}
            >
              {strings.skip}
            </button>
            <button
              type='button'
              x-class={[btn, subtleBtn]}
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              {strings.back}
            </button>
            <button
              type='button'
              x-class={[btn, primaryBtn]}
              onClick={() => (last ? close('done') : goTo(index + 1))}
            >
              {last ? strings.done : strings.next}
            </button>
          </div>
        </div>
      </div>
    </Presence>,
    document.body
  );
}

export type { TourCloseReason, TourPlacement, TourProps, TourStep };
