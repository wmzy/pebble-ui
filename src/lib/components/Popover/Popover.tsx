import type { ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { CollisionPadding } from '../../utils/collision';

import { css } from '@linaria/core';
import { useId, useImperativeHandle, useMemo, useRef } from 'react';
import { useControl } from 'react-use-control';

import { FloatingPanel, useFloating } from '../../utils/floating';

/**
 * Imperative handle exposed through the React 19 `ref` prop (same API
 * choice as VirtualList). `open`/`close` are state writes going through
 * the same `useFloating` path as the trigger's own clicks — the popover
 * visibility, animated exit and the toggle-echo reconciliation in the
 * floating engine stay in charge; the handle never calls
 * `showPopover`/`hidePopover` directly.
 */
type PopoverHandle = {
  /** Show the popover, as if the trigger toggled it open. */
  open: () => void;
  /** Close the popover through the animated exit path. */
  close: () => void;
  /** Focus the trigger element. */
  focusTrigger: () => void;
};

type PopoverProps = {
  content: ReactNode;
  open?: ControlOrValue<boolean>;
  /**
   * Viewport inset the panel treats as collision space: a number applies
   * to all four edges, an object per edge.
   */
  collisionPadding?: CollisionPadding;
  className?: string;
  children: ReactNode;
  ref?: Ref<PopoverHandle>;
};

const container = css`
  position: relative;
  display: inline-flex;
`;

/** Visual skin applied on every rendering tier of the panel. */
const panelVisuals = css`
  padding: var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  box-shadow: var(--haze-shadow-lg);
  min-width: 200px;
`;

export default function Popover({
  content,
  open: openControl,
  collisionPadding,
  className,
  children,
  ref,
}: PopoverProps) {
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

  // Imperative surface: `ref.current?.open()/close()/focusTrigger()`.
  // open/close only write the state the floating engine reacts to (the
  // same path as the trigger's clicks), leaving showPopover/hidePopover
  // and the toggle-echo reconciliation to the engine's effect.
  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        setOpen(true);
      },
      close: () => {
        setOpen(false);
      },
      focusTrigger: () => {
        triggerRef.current?.focus();
      },
    }),
    [setOpen]
  );

  return (
    <span className={container}>
      <span
        ref={triggerRef}
        style={floating.triggerStyle}
        // aria-expanded requires an interactive role; a bare span resolves
        // to role=generic, which ARIA 1.2 does not allow it on (axe
        // aria-allowed-attr). The trigger span is the clickable popover
        // trigger — role=button is its honest semantics.
        role='button'
        tabIndex={0}
        aria-haspopup='true'
        aria-expanded={open}
        aria-controls={id}
        onPointerDown={floating.onTriggerPointerDown}
        onClick={floating.onTriggerClick}
        onKeyDown={(e) => {
          // The trigger is a span, not a button: Enter/Space have no
          // native activation, so the button contract is completed here.
          // preventDefault on Space keeps the page from scrolling.
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            floating.onTriggerClick();
          }
        }}
      >
        {children}
      </span>
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement="bottom-span"
        id={id}
        visualClass={panelVisuals}
        className={className}
      >
        {content}
      </FloatingPanel>
    </span>
  );
}

export type { PopoverProps, PopoverHandle };
