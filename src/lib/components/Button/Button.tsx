import type { ComponentPropsWithoutRef } from 'react';

import { useConfigDefaults } from '../ConfigProvider/useConfigDefaults';

import { base, sizes, squareSizes, variants } from './styles';

/**
 * Component-level tokens: Button can be rethemed per-component by setting
 * `--haze-button-*` custom properties on `:root` or any ancestor —
 * `--haze-button-height-sm|md|lg`, `--haze-button-font-size-sm|md|lg`,
 * `--haze-button-radius` (fallbacks and usage documented in ./styles).
 * ButtonLink and Toggle wear the same skin and follow along.
 */
type ButtonProps = {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  square?: boolean;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type'>;

export default function Button({
  variant = 'solid',
  size: sizeProp,
  square = false,
  className,
  ...rest
}: ButtonProps) {
  // Three tiers: explicit prop → ConfigProvider default → built-in 'md'.
  // The built-in stays last so a missing provider renders exactly what
  // Button rendered before the wiring (byte-identical).
  const config = useConfigDefaults('Button');
  const size = sizeProp ?? config.size ?? 'md';
  const sizeClass = square ? squareSizes[size] : sizes[size];
  return (
    <button
      type='button'
      data-slot='button'
      x-class={[base, variants[variant], sizeClass, className]}
      {...rest}
    />
  );
}

export type { ButtonProps };
