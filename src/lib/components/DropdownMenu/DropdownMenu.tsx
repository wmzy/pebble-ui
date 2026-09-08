import type { ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { CollisionPadding } from '../../utils/collision';

import { useCallback, useId, useImperativeHandle, useMemo, useRef } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { useFloating } from '../../utils/floating';

import { DropdownMenuProvider } from './DropdownMenuContext';

/**
 * Imperative handle exposed through the React 19 `ref` prop (same API
 * choice as VirtualList). `open`/`close` run through the same
 * `handleSetOpen` the trigger and items use — `onOpenChange` fires, and
 * the floating engine's popover visibility, animated exit and
 * toggle-echo reconciliation stay in charge; the handle never calls
 * `showPopover`/`hidePopover` directly.
 */
type DropdownMenuHandle = {
  /** Show the menu, as if the trigger toggled it open (`onOpenChange(true)`). */
  open: () => void;
  /**
   * Close the menu through the animated exit path
   * (`onOpenChange(false)`).
   */
  close: () => void;
  /** Focus the trigger element. */
  focusTrigger: () => void;
};

type DropdownMenuProps = {
  open?: ControlOrValue<boolean>;
  onOpenChange?: (open: boolean) => void;
  /**
   * Viewport inset the panel treats as collision space: a number applies
   * to all four edges, an object per edge.
   */
  collisionPadding?: CollisionPadding;
  children: ReactNode;
  className?: string;
  ref?: Ref<DropdownMenuHandle>;
};

const wrapper = css`
  position: relative;
  display: inline-block;
`;

export default function DropdownMenu({
  open: openControl,
  onOpenChange,
  collisionPadding,
  children,
  className,
  ref,
}: DropdownMenuProps) {
  const [open, setOpen] = useControl(openControl, false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const focusRequestRef = useRef<'first' | 'last' | null>(null);

  const handleSetOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value;
      setOpen(next);
      onOpenChange?.(next);
    },
    [open, setOpen, onOpenChange]
  );

  // Imperative surface: `ref.current?.open()/close()/focusTrigger()`.
  // open/close share handleSetOpen with the trigger and items, so
  // onOpenChange fires and the floating engine drives the popover.
  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        handleSetOpen(true);
      },
      close: () => {
        handleSetOpen(false);
      },
      focusTrigger: () => {
        triggerRef.current?.focus();
      },
    }),
    [handleSetOpen]
  );

  // Stable identity: useFloatingPosition re-runs its effect on every
  // change of this object.
  const collision = useMemo(
    () => (collisionPadding === undefined ? undefined : {collisionPadding}),
    [collisionPadding]
  );

  const floating = useFloating({
    open,
    setOpen: handleSetOpen,
    triggerRef,
    panelRef: contentRef,
    animated: true,
    collision,
  });

  return (
    <DropdownMenuProvider
      value={{
        open,
        setOpen: handleSetOpen,
        triggerRef,
        contentRef,
        contentId,
        focusRequestRef,
        floating,
      }}
    >
      <div x-class={[wrapper, className]}>{children}</div>
    </DropdownMenuProvider>
  );
}

export type { DropdownMenuProps, DropdownMenuHandle };
