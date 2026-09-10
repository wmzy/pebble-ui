import type { ComponentPropsWithoutRef, Ref } from 'react';

import { css } from '@linaria/core';

import { base, sizes, squareSizes } from '../Button/styles';

type ToggleCoreProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  /** Native click event passthrough — invoked with the DOM event after
   * `onPressedChange`, so a spread can never override the controlled callback. */
  onNativeClick?: ComponentPropsWithoutRef<'button'>['onClick'];
  size?: 'sm' | 'md' | 'lg';
  /** Equal padding on all sides — for icon-only square toggles. */
  square?: boolean;
  className?: string;
  /** Forwarded to the `<button>` element. */
  ref?: Ref<HTMLButtonElement>;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'aria-pressed'>;

/**
 * Surface keyed on pressed state — mutually exclusive like Button's
 * variants, so no emission-order games decide which background wins.
 * Unpressed is a quiet ghost (the toggle recedes); pressed goes solid
 * primary (the "this state is on" signal), each with its own
 * interaction-state tokens.
 */
const surfaces = {
  rest: css`
    background: transparent;
    color: var(--haze-color-text);

    &:hover {
      background: var(--haze-color-bg-subtle);
    }

    &:active {
      background: var(--haze-color-bg-muted);
    }
  `,
  pressed: css`
    background: var(--haze-color-primary);
    color: var(--haze-color-text-inverse);

    &:hover {
      background: var(--haze-color-primary-hover);
    }

    &:active {
      background: var(--haze-color-primary-active);
    }
  `,
} as const;

/**
 * The controlled half of Toggle: a momentary pressed-state button
 * (`<button aria-pressed>`) — one-shot commands like bold/mute, not the
 * on/off *setting* that Switch's `role="switch"` carries. State never
 * lives here: it renders `pressed` and reports clicks through
 * `onPressedChange`, so the sugar (or any owner) owns the truth.
 */
export default function ToggleCore({
  pressed,
  onPressedChange,
  onNativeClick,
  size = 'md',
  square = false,
  className,
  ref,
  ...rest
}: ToggleCoreProps) {
  const sizeClass = square ? squareSizes[size] : sizes[size];
  return (
    <button
      ref={ref}
      type='button'
      aria-pressed={pressed}
      x-class={[base, surfaces[pressed ? 'pressed' : 'rest'], sizeClass, className]}
      onClick={(e) => {
        onPressedChange(!pressed);
        onNativeClick?.(e);
      }}
      {...rest}
    />
  );
}

export type { ToggleCoreProps };
