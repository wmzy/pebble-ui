import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { FloatingPanel } from '../../utils/floating';
import { useSubmenuContext } from '../../utils/submenu';

type DropdownMenuSubContentProps = {
  className?: string;
  children: ReactNode;
};

// Same visual skin as DropdownMenuContent; the placement classes put it
// at the trigger's inline end (mirrored under dir='rtl' by the floating
// placement layer).
const content = css`
  min-width: 10rem;
  padding: var(--haze-space-1);
  background: var(--haze-color-bg);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  box-shadow: var(--haze-shadow-md);
`;

/**
 * The panel of a DropdownMenuSub submenu. Unmounts once closed, like
 * DropdownMenuContent (the animated exit keeps it mounted through the
 * fade); keyboard focus is contained to this level — Escape closes only
 * this submenu.
 */
export default function DropdownMenuSubContent({
  className,
  children,
}: DropdownMenuSubContentProps) {
  const sub = useSubmenuContext();
  if (!sub.open && sub.floating.exited) return null;
  return (
    <FloatingPanel
      ref={sub.contentRef}
      behavior={sub.floating}
      placement='right'
      id={sub.contentId}
      role='menu'
      visualClass={content}
      className={className}
      onKeyDown={sub.contentKeyDown}
    >
      {children}
    </FloatingPanel>
  );
}

export type { DropdownMenuSubContentProps };
