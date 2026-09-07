import type { ComponentPropsWithoutRef } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { base, sizes, squareSizes, variants } from '../Button/styles';

/**
 * A toolbar item that toggles: ToolbarButton's skin and roving behavior
 * with a pressed state of its own. `pressed` is self-contained by
 * default (no external wiring needed) and switches to external ownership
 * when passed a control. The pressed look is keyed off `aria-pressed`,
 * so the visual state can never drift from what assistive tech announces.
 */
type ToolbarToggleProps = {
  /** Whether the item is pressed; a control for full external ownership. */
  pressed?: ControlOrValue<boolean>;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Equal padding on all sides — for icon-only square items. */
  square?: boolean;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'aria-pressed'>;

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

export default function ToolbarToggle({
  pressed: pressedControl,
  variant = 'ghost',
  size = 'md',
  square = false,
  className,
  onClick,
  ...rest
}: ToolbarToggleProps) {
  const [pressed, setPressed] = useControl(pressedControl, false);
  const sizeClass = square ? squareSizes[size] : sizes[size];
  return (
    <button
      type="button"
      data-haze-toolbar-item=""
      tabIndex={-1}
      aria-pressed={pressed}
      x-class={[base, variants[variant], sizeClass, toolbarItem, className]}
      onClick={(e) => {
        setPressed(!pressed);
        onClick?.(e);
      }}
      {...rest}
    />
  );
}

export type { ToolbarToggleProps };
