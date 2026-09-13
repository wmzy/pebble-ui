import type { ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { CollisionPadding } from '../../utils/collision';
import type { MenuDataItem } from '../../utils/menuItems';

import { useCallback, useId, useImperativeHandle, useMemo, useRef } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { useFloating } from '../../utils/floating';
import { renderMenuDataItems } from '../../utils/menuItems';

import DropdownMenuCheckboxItem from './DropdownMenuCheckboxItem';
import DropdownMenuContent from './DropdownMenuContent';
import DropdownMenuGroup from './DropdownMenuGroup';
import DropdownMenuItem from './DropdownMenuItem';
import DropdownMenuRadioGroup from './DropdownMenuRadioGroup';
import DropdownMenuRadioItem from './DropdownMenuRadioItem';
import DropdownMenuSeparator from './DropdownMenuSeparator';
import DropdownMenuSub from './DropdownMenuSub';
import DropdownMenuSubContent from './DropdownMenuSubContent';
import DropdownMenuSubTrigger from './DropdownMenuSubTrigger';
import DropdownMenuTrigger from './DropdownMenuTrigger';

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
  /**
   * Data-driven alternative to composed children: plain items,
   * checkboxes, radio groups, labeled groups, dividers and nested
   * submenus, rendered through the same components the compound API
   * uses. When passed, it replaces the children with a default `⋯`
   * trigger plus the content built from the data.
   */
  items?: MenuDataItem[];
  children?: ReactNode;
  className?: string;
  ref?: Ref<DropdownMenuHandle>;
};

const wrapper = css`
  position: relative;
  display: inline-block;
`;

/** The family record the data-driven `items` renderer composes from. */
const dropdownMenuFamily = {
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  Group: DropdownMenuGroup,
  Divider: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
};

export default function DropdownMenu({
  open: openControl,
  onOpenChange,
  collisionPadding,
  items,
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
      <div data-slot='dropdown-menu' x-class={[wrapper, className]}>
        {items !== undefined ? (
          <>
            <DropdownMenuTrigger>⋯</DropdownMenuTrigger>
            <DropdownMenuContent>
              {renderMenuDataItems(items, dropdownMenuFamily)}
            </DropdownMenuContent>
          </>
        ) : (
          children
        )}
      </div>
    </DropdownMenuProvider>
  );
}

export type { DropdownMenuProps, DropdownMenuHandle };
export type { MenuDataItem as DropdownMenuDataItem };
