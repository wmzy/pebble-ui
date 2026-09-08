import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent } from 'react';

import { css } from '@linaria/core';

import { getDirection } from '../../utils/direction';

type SliderCoreProps = {
  value: number;
  onChange: (value: number) => void;
  /** Native change event passthrough — invoked with the DOM event after
   * `onChange`, so a spread can never override the controlled callback. */
  onNativeChange?: ComponentPropsWithoutRef<'input'>['onChange'];
  className?: string;
} & Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'onChange'>;

const base = css`
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  outline: none;
  cursor: pointer;
  transition: background var(--haze-duration-fast);

  &::-webkit-slider-thumb {
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--haze-radius-full);
    background: var(--haze-color-primary);
    border: 2px solid var(--haze-color-bg);
    box-shadow: var(--haze-shadow-sm);
    cursor: pointer;
    transition:
      background var(--haze-duration-fast),
      box-shadow var(--haze-duration-fast);
  }

  &::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--haze-radius-full);
    background: var(--haze-color-primary);
    border: 2px solid var(--haze-color-bg);
    box-shadow: var(--haze-shadow-sm);
    cursor: pointer;
  }

  &:focus-visible {
    &::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
    }
    &::-moz-range-thumb {
      box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Arrow semantics under RTL: the native control's ←/→ handling tracks
 * the engine's own (inconsistent) range-flip support, so the mirrored
 * behavior is enforced here — ← increases, → decreases — stepping by
 * the input's own min/max/step. LTR stays fully native (untouched).
 */
type NativeChangeHandler = ComponentPropsWithoutRef<'input'>['onChange'];

function mirrorRangeArrows(
  event: ReactKeyboardEvent<HTMLInputElement>,
  value: number,
  onChange: (value: number) => void,
  onNativeChange?: NativeChangeHandler
) {
  const el = event.currentTarget;
  if (
    el.disabled ||
    getDirection(el) !== 'rtl' ||
    (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
  ) {
    return;
  }
  event.preventDefault();
  const step = el.step === '' || el.step === 'any' ? 1 : Number(el.step);
  const min = el.min === '' ? 0 : Number(el.min);
  const max = el.max === '' ? 100 : Number(el.max);
  const delta = event.key === 'ArrowLeft' ? step : -step;
  const next = Math.min(Math.max(value + delta, min), max);
  onChange(Math.round(next * 1e6) / 1e6);
  // The passthrough expects a change event; a synthesized one is not
  // constructible cross-engine, and this key event targets the same
  // input — close enough for consumers tracking value changes.
  (onNativeChange as ((event: unknown) => void) | undefined)?.(event);
}

export default function SliderCore({
  value,
  onChange,
  onNativeChange,
  className,
  onKeyDown,
  ...rest
}: SliderCoreProps) {
  return (
    <input
      type='range'
      x-class={[base, className]}
      value={value}
      onChange={(e) => {
        onChange(Number(e.target.value));
        onNativeChange?.(e);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!e.defaultPrevented) {
          mirrorRangeArrows(e, value, onChange, onNativeChange);
        }
      }}
      {...rest}
    />
  );
}

export type { SliderCoreProps };
