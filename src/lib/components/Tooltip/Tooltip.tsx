import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { CollisionPadding } from '../../utils/collision';

import { css } from '@linaria/core';
import { useEffect, useId, useMemo, useRef } from 'react';
import { useControl } from 'react-use-control';

import { useConfigDefaults } from '../ConfigProvider/useConfigDefaults';

import {
  floatingPlacementClasses,
  useFloating,
  useFloatingPosition,
  type FloatingPlacement,
} from '../../utils/floating';

type TooltipProps = {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Milliseconds of hover/focus before the tooltip appears. */
  delay?: number;
  open?: ControlOrValue<boolean>;
  /** Viewport inset the bubble treats as collision space. */
  collisionPadding?: CollisionPadding;
  className?: string;
  children: ReactNode;
};

const wrapper = css`
  position: relative;
  display: inline-flex;
`;

const bubble = css`
  padding: var(--haze-space-1) var(--haze-space-2);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-text);
  color: var(--haze-color-text-inverse);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-normal);
  white-space: nowrap;
  pointer-events: none;
`;

/** `position` prop → floating placement; sides center over the trigger. */
const placements = {
  top: 'top',
  bottom: 'bottom-center',
  left: 'left',
  right: 'right',
} as const satisfies Record<string, FloatingPlacement>;

export default function Tooltip({
  content,
  position = 'top',
  delay: delayProp,
  open: openControl,
  collisionPadding,
  className,
  children,
}: TooltipProps) {
  // Three tiers: explicit prop → ConfigProvider default → built-in 150ms
  // (a missing provider keeps the pre-wiring behavior byte-identical).
  const config = useConfigDefaults('Tooltip');
  const delay = delayProp ?? config.delay ?? 150;
  const [open, setOpen] = useControl(openControl, false);
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const placement = placements[position];

  // Stable identity: useFloatingPosition re-runs its effect on every
  // change of this object.
  const collision = useMemo(
    () => (collisionPadding === undefined ? undefined : {collisionPadding}),
    [collisionPadding]
  );
  // Manual wiring (span panel, not FloatingPanel): the behavior still
  // owns the animated lifecycle — dataState, the exit-delayed hidden
  // class inside panelClasses — and this hook owns placement/nudge.
  const floating = useFloating({
    open,
    setOpen,
    triggerRef,
    panelRef,
    animated: true,
  });
  useFloatingPosition({ behavior: floating, placement, collision });

  // Hover/focus intent: show after `delay`, hide at once; leaving before
  // the delay cancels the pending show.
  const showTimerRef = useRef(0);
  useEffect(() => () => window.clearTimeout(showTimerRef.current), []);

  const show = () => {
    window.clearTimeout(showTimerRef.current);
    showTimerRef.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(showTimerRef.current);
    setOpen(false);
  };

  return (
    <span x-class={[wrapper, className]}>
      <span
        ref={triggerRef}
        style={floating.triggerStyle}
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {/* A span panel (not FloatingPanel's div): phrasing content context. */}
      <span
        id={id}
        ref={panelRef}
        role="tooltip"
        data-state={floating.dataState}
        {...floating.panelAttrs}
        x-class={[
          bubble,
          ...floating.panelClasses,
          ...floatingPlacementClasses(floating, placement, floating.direction),
        ]}
      >
        {content}
      </span>
    </span>
  );
}

export type { TooltipProps };
