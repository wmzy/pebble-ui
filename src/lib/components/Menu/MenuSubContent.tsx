import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { FloatingPanel } from '../../utils/floating';
import { useSubmenuContext } from '../../utils/submenu';

type MenuSubContentProps = {
  className?: string;
  children: ReactNode;
};

// Same visual skin as the Menu panel; the placement classes put it at
// the trigger's inline end (mirrored under dir='rtl' by the floating
// placement layer).
const panel = css`
  min-width: 160px;
  padding: var(--haze-space-1) 0;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);

  /* Forced-colors: CanvasText boundary restated (see the Menu panel). */
  @media (forced-colors: active) {
    border-color: CanvasText;
  }
`;

/**
 * The panel of a MenuSub submenu. Resident like the Menu panel itself
 * (hidden through the floating lifecycle while closed); keyboard focus
 * is contained to this level — Escape closes only this submenu.
 */
export default function MenuSubContent({
  className,
  children,
}: MenuSubContentProps) {
  const sub = useSubmenuContext();
  return (
    <FloatingPanel
      ref={sub.contentRef}
      behavior={sub.floating}
      placement='right'
      id={sub.contentId}
      role='menu'
      visualClass={panel}
      className={className}
      onKeyDown={sub.contentKeyDown}
    >
      {children}
    </FloatingPanel>
  );
}

export type { MenuSubContentProps };
