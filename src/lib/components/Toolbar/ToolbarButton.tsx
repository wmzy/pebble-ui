import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';

import { base, sizes, squareSizes, variants } from '../Button/styles';

/**
 * A toolbar item wearing Button's skin — the same `variant`/`size`/
 * `square` props (see ButtonLink for the same styles.ts reuse), quieter
 * by default (ghost) than a standalone Button, with toolbar behavior
 * layered on: it registers for the owning Toolbar's roving tabindex
 * (rendered inert, the roving effect promotes exactly one item to tab
 * stop) and arrow-key travel.
 *
 * Toggle items report their state with `aria-pressed` — the pressed
 * look is keyed off that state attribute, so no extra prop can drift
 * out of sync with what assistive tech announces.
 */
type ToolbarButtonProps = {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  square?: boolean;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type'>;

const toolbarItem = css`
  /* Most meaningful on the default ghost: a pressed item reads as
   * engaged with a tinted well instead of a transparent surface. */
  &[aria-pressed='true'] {
    background: var(--haze-color-primary-subtle);
    color: var(--haze-color-primary);

    &:hover {
      background: var(--haze-color-bg-muted);
    }

    &:active {
      background: var(--haze-color-bg-muted);
    }
  }
`;

export default function ToolbarButton({
  variant = 'ghost',
  size = 'md',
  square = false,
  className,
  ...rest
}: ToolbarButtonProps) {
  const sizeClass = square ? squareSizes[size] : sizes[size];
  return (
    <button
      type="button"
      data-slot="toolbar-button"
      data-haze-toolbar-item=""
      tabIndex={-1}
      x-class={[base, variants[variant], sizeClass, toolbarItem, className]}
      {...rest}
    />
  );
}

export type { ToolbarButtonProps };
