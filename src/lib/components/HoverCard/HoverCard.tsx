import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { CollisionPadding } from '../../utils/collision';
import type { FloatingPlacement } from '../../utils/floating';

import { css } from '@linaria/core';
import { useEffect, useId, useMemo, useRef } from 'react';
import { useControl } from 'react-use-control';

import { useConfigDefaults } from '../ConfigProvider/useConfigDefaults';

import { FloatingPanel, useFloating } from '../../utils/floating';

/**
 * HoverCard — a non-modal floating preview (avatar card, link summary)
 * anchored to its trigger.
 *
 * API form: a single component with a `content` prop, matching the
 * library's other lightweight floating pairs (Popover, Tooltip) rather
 * than the Trigger/Content compound of ContextMenu/DropdownMenu — those
 * are click/menu surfaces with focus management, while a hover card
 * keeps the trigger untouched: whatever the consumer renders (link,
 * button, avatar) gets hover-wired around it plus the
 * aria-describedby link to the panel.
 *
 * Behavior: hovering or focusing the trigger opens the card after
 * `openDelay`; leaving closes it only after a `closeDelay` grace
 * period, which is the travel window from trigger to panel — entering
 * the panel cancels the pending close (the "resting zone"). Escape
 * closes at once (native popover light dismiss / the fallback path's
 * document keydown, both owned by useFloating).
 */
type HoverCardProps = {
  /** Card content, rendered inside the floating panel. */
  content: ReactNode;
  /** Milliseconds of hover/focus on the trigger before the card opens. */
  openDelay?: number;
  /**
   * Grace period (ms) after the pointer leaves the trigger or the panel
   * before the card closes — long enough to travel into the panel.
   */
  closeDelay?: number;
  /**
   * Panel placement relative to the trigger, in the floating utils'
   * physical convention ('bottom-span' aligns the panel's inline-start
   * edge under the trigger — 'bottom-start' in logical terms). RTL is
   * the consumer's to mirror.
   */
  placement?: FloatingPlacement;
  open?: ControlOrValue<boolean>;
  /** Viewport inset the panel treats as collision space. */
  collisionPadding?: CollisionPadding;
  className?: string;
  /** The trigger — render a focusable element for keyboard access. */
  children: ReactNode;
};

const container = css`
  position: relative;
  display: inline-flex;
`;

/** Visual skin applied on every rendering tier of the panel. */
const panelVisuals = css`
  min-width: 240px;
  max-width: 320px;
  padding: var(--haze-space-4);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  box-shadow: var(--haze-shadow-lg);

  /* Forced-colors: the UA keeps the author border visible by forcing
     its color to CanvasText — restated so the panel stays separated
     from the Canvas behind it deterministically. */
  @media (forced-colors: active) {
    border-color: CanvasText;
  }
`;

export default function HoverCard({
  content,
  openDelay: openDelayProp,
  closeDelay: closeDelayProp,
  placement = 'bottom-span',
  open: openControl,
  collisionPadding,
  className,
  children,
}: HoverCardProps) {
  // Three tiers: explicit prop → ConfigProvider default → built-ins
  // 200/120 (a missing provider keeps the pre-wiring behavior
  // byte-identical).
  const config = useConfigDefaults('HoverCard');
  const openDelay = openDelayProp ?? config.openDelay ?? 200;
  const closeDelay = closeDelayProp ?? config.closeDelay ?? 120;
  const [open, setOpen] = useControl(openControl, false);
  const id = useId();

  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Stable identity: useFloatingPosition re-runs its effect on every
  // change of this object.
  const collision = useMemo(
    () => (collisionPadding === undefined ? undefined : {collisionPadding}),
    [collisionPadding]
  );
  const floating = useFloating({
    open,
    setOpen,
    triggerRef,
    panelRef,
    animated: true,
    collision,
  });

  // Hover/focus intent with a resting zone: the open timer gives the
  // `openDelay` dwell, the close timer the `closeDelay` grace. Entering
  // the panel clears both timers (nothing pending to close); leaving
  // either side arms the close, which re-entering either side cancels.
  const openTimerRef = useRef(0);
  const closeTimerRef = useRef(0);
  useEffect(
    () => () => {
      window.clearTimeout(openTimerRef.current);
      window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  const cancelTimers = () => {
    window.clearTimeout(openTimerRef.current);
    window.clearTimeout(closeTimerRef.current);
  };
  const scheduleOpen = () => {
    cancelTimers();
    if (open) return;
    openTimerRef.current = window.setTimeout(() => setOpen(true), openDelay);
  };
  const scheduleClose = () => {
    // Also drops a pending open: leaving before the delay never shows.
    cancelTimers();
    if (!open) return;
    closeTimerRef.current = window.setTimeout(() => setOpen(false), closeDelay);
  };

  return (
    <span data-slot='hover-card' className={container}>
      <span
        ref={triggerRef}
        data-slot='trigger'
        style={floating.triggerStyle}
        aria-describedby={id}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
      >
        {children}
      </span>
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement={placement}
        id={id}
        visualClass={panelVisuals}
        className={className}
        onMouseEnter={cancelTimers}
        onMouseLeave={scheduleClose}
      >
        {content}
      </FloatingPanel>
    </span>
  );
}

export type { HoverCardProps };
