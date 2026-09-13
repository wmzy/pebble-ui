import type { ReactNode } from 'react';

import { css } from '@linaria/core';
import { useCallback, useEffect } from 'react';

import { FloatingPanel, type FloatingPlacement } from '../../utils/floating';
import {
  getEnabledMenuItems,
  useMenuKeyboard,
  useRovingTabindex,
} from '../../utils/menuKeyboard';

import { useDropdownMenuContext } from './DropdownMenuContext';

type DropdownMenuContentProps = {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
};

const content = css`
  min-width: 10rem;
  padding: var(--haze-space-1);
  background: var(--haze-color-bg);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  box-shadow: var(--haze-shadow-md);

  /* Forced-colors: the UA keeps the author border visible by forcing
     its color to CanvasText — restated so the panel stays separated
     from the Canvas behind it deterministically. */
  @media (forced-colors: active) {
    border-color: CanvasText;
  }
`;

/** `align` prop → floating placement under the trigger. */
const alignments = {
  start: 'bottom',
  center: 'bottom-center',
  end: 'bottom-end',
} as const satisfies Record<string, FloatingPlacement>;

export default function DropdownMenuContent({
  children,
  align = 'start',
  className,
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef, contentRef, contentId, focusRequestRef, floating } =
    useDropdownMenuContext();

  const closeMenu = useCallback(() => {
    setOpen(false);
    // The menu unmounts on close; hand focus back so keyboard users
    // never land on <body>.
    triggerRef.current?.focus();
  }, [setOpen, triggerRef]);

  const handleKeyDown = useMenuKeyboard({
    menuRef: contentRef,
    onClose: closeMenu,
  });

  useRovingTabindex({ menuRef: contentRef, active: open });

  // Focus handoff requested by the trigger when it opens the menu by
  // keyboard — consumed here, after the items have mounted AND the panel
  // is actually shown. Child effects run before the parent's
  // showPopover() effect, so at open-flip time the popover=auto panel is
  // still display:none and .focus() would be silently dropped in
  // Chromium; `floating.shown` flips only once the panel is focusable.
  useEffect(() => {
    if (!open || !floating.shown) return;
    const request = focusRequestRef.current;
    focusRequestRef.current = null;
    if (!request) return;
    const items = getEnabledMenuItems(contentRef.current);
    const target = request === 'first' ? items[0] : items[items.length - 1];
    target?.focus();
  }, [open, floating.shown, contentRef, focusRequestRef]);

  // Animated exit: the panel stays mounted (fading out via
  // data-state=closed) until the exit settles — `exited` starts true
  // before the first open, so a never-opened menu renders nothing.
  if (!open && floating.exited) return null;

  return (
    <FloatingPanel
      ref={contentRef}
      behavior={floating}
      placement={alignments[align]}
      id={contentId}
      role="menu"
      visualClass={content}
      className={className}
      onKeyDown={handleKeyDown}
    >
      {children}
    </FloatingPanel>
  );
}

export type { DropdownMenuContentProps };
