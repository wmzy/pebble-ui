import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';

import { useToolbarOrientation } from './ToolbarContext';

/**
 * A visual divider between toolbar groups. Not a roving item — it takes
 * no focus and no arrow-key stops. Its orientation mirrors the owning
 * Toolbar's: a vertical rule inside a horizontal toolbar, a horizontal
 * rule inside a vertical one (non-focusable separators may omit
 * aria-orientation per ARIA; stating it keeps the presentation
 * explicit).
 */
type ToolbarSeparatorProps = {
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'>;

const separator = css`
  flex: none;
  align-self: stretch;
  inline-size: 1px;
  margin-block: var(--haze-space-1);
  background: var(--haze-color-border);
`;

/** Vertical toolbar: the rule runs horizontally instead. */
const horizontalRule = css`
  inline-size: auto;
  block-size: 1px;
  margin-block: 0;
  margin-inline: var(--haze-space-1);
`;

export default function ToolbarSeparator({ className, ...rest }: ToolbarSeparatorProps) {
  const verticalToolbar = useToolbarOrientation() === 'vertical';
  return (
    <div
      role="separator"
      aria-orientation={verticalToolbar ? 'horizontal' : 'vertical'}
      x-class={[separator, verticalToolbar && horizontalRule, className]}
      {...rest}
    />
  );
}

export type { ToolbarSeparatorProps };
