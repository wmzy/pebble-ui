import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { getEnabledMenuItems } from '../../utils/menuKeyboard';

import { useDropdownMenuContext } from './DropdownMenuContext';

type DropdownMenuTriggerProps = {
  children: ReactNode;
  className?: string;
};

const trigger = css`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font: inherit;
  color: inherit;
`;

export default function DropdownMenuTrigger({
  children,
  className,
}: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef, contentRef, contentId, focusRequestRef, floating } =
    useDropdownMenuContext();

  // Open the menu and land focus on its first/last item. When the menu is
  // already open (focus stayed on the clicked trigger), focus it directly.
  const focusEdgeItem = (edge: 'first' | 'last') => {
    if (open) {
      const items = getEnabledMenuItems(contentRef.current);
      const target = edge === 'first' ? items[0] : items[items.length - 1];
      target?.focus();
    } else {
      focusRequestRef.current = edge;
      setOpen(true);
    }
  };

  return (
    <button
      ref={triggerRef}
      data-slot='trigger'
      x-class={[trigger, className]}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      style={floating.triggerStyle}
      onPointerDown={floating.onTriggerPointerDown}
      onClick={floating.onTriggerClick}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          focusEdgeItem('first');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusEdgeItem('last');
        }
      }}
    >
      {children}
    </button>
  );
}

export type { DropdownMenuTriggerProps };
