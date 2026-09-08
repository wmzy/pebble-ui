import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent } from 'react';

import { css } from '@linaria/core';

import { getDirection } from '../../utils/direction';

type SliderCoreProps = {
  /** `number` in single mode, `[low, high]` when `range` is set. An
   * inverted tuple renders normalized (low ≤ high). */
  value: number | [number, number];
  /** Notifies the next value: `number` in single mode, `[low, high]` in
   * range mode — a thumb driven past the other snaps against it, so the
   * pair stays ordered. */
  onChange: (value: number | [number, number]) => void;
  /** Native change event passthrough — invoked with the DOM event after
   * `onChange`, so a spread can never override the controlled callback.
   * In range mode the event is the changing input's. */
  onNativeChange?: ComponentPropsWithoutRef<'input'>['onChange'];
  /**
   * Range mode: the single input becomes two stacked native inputs
   * (low thumb first in DOM and tab order) over a shared rail with a
   * primary-colored fill between the thumbs. Each thumb steps
   * independently, clamps to the shared min/max, and snaps against the
   * other thumb instead of crossing it. The stacked inputs' tracks are
   * transparent and pointer-transparent — only their thumbs take
   * pointer input.
   */
  range?: boolean;
  className?: string;
  /**
   * Single mode: forwarded to the input untouched. Range mode: a
   * `[lowLabel, highLabel]` tuple labels each thumb; a bare string
   * labels both thumbs (two identically named sliders are ambiguous —
   * prefer the tuple). All other forwarded native props (min, max,
   * step, disabled, …) apply to both inputs.
   */
  'aria-label'?: string | [string, string];
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'value' | 'onChange' | 'aria-label'
>;

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
 * Range mode: rail, fill and the two stacked inputs share this relative
 * box; the static rail span alone gives it height.
 */
const rangeWrapper = css`
  position: relative;
  display: block;
  width: 100%;

  /* Disabled dimming lives here (not on the inputs) so the rail and
     fill follow the thumbs' state, not just the thumbs themselves. */
  &:has(input:disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

/** The shared track — the range-mode inputs paint no track of their
 * own (see rangeInput), so the rail lives under them. */
const rangeRail = css`
  display: block;
  height: 6px;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
`;

/** Progress between the thumbs; positioned with logical properties so
 * RTL mirrors it for free (the fill grows from the inline start). */
const rangeFill = css`
  position: absolute;
  inset-block-start: 0;
  height: 6px;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-primary);
`;

/**
 * The stacked inputs must not paint their own muted track over the rail
 * and fill (base sets one), and their full-width surfaces must not
 * swallow each other's thumb hits: only the thumb pseudo-elements take
 * pointer events. Where an engine ignores pointer-events on a
 * pseudo-element the thumbs stay reachable via keyboard.
 */
const rangeInput = css`
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  margin: 0;
  background: transparent;
  pointer-events: none;

  &::-webkit-slider-thumb {
    pointer-events: auto;
  }

  &::-moz-range-thumb {
    pointer-events: auto;
  }

  &:disabled {
    opacity: 1;
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

/** Low/high as an ordered pair: an inverted tuple swaps; a bare number
 * in range mode (a type error at the call sites) puts both thumbs on
 * it rather than rendering a broken input. */
function normalizePair(value: number | [number, number]): [number, number] {
  const pair: [number, number] = Array.isArray(value) ? value : [value, value];
  return pair[0] <= pair[1] ? [pair[0], pair[1]] : [pair[1], pair[0]];
}

/** A min/max attribute as a finite number, else the native default. */
function numberOr(raw: string | number | undefined, fallback: number): number {
  const parsed = raw === undefined ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function SliderCore({
  value,
  onChange,
  onNativeChange,
  range = false,
  className,
  onKeyDown,
  'aria-label': ariaLabel,
  ...rest
}: SliderCoreProps) {
  if (!range) {
    // Single mode carries the union's number member — the sugar
    // guarantees it; the assertion is that member selection only.
    const single = value as number;
    // Same member selection for the label: single mode consumers pass a
    // string (a tuple is a range-mode-only shape).
    const singleLabel = ariaLabel as string | undefined;
    return (
      <input
        type='range'
        x-class={[base, className]}
        value={single}
        aria-label={singleLabel}
        onChange={(e) => {
          onChange(Number(e.target.value));
          onNativeChange?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (!e.defaultPrevented) {
            mirrorRangeArrows(e, single, onChange, onNativeChange);
          }
        }}
        {...rest}
      />
    );
  }

  const [low, high] = normalizePair(value);
  const thumbLabels: [string | undefined, string | undefined] = Array.isArray(
    ariaLabel
  )
    ? ariaLabel
    : [ariaLabel, ariaLabel];

  // Fill geometry as track percentages, clamped to the rail's extent.
  const min = numberOr(rest.min, 0);
  const max = numberOr(rest.max, 100);
  const span = max - min;
  const percent = (raw: number) =>
    span > 0 ? Math.min(Math.max(((raw - min) / span) * 100, 0), 100) : 0;
  const fillStart = percent(low);
  const fillWidth = percent(high) - fillStart;

  // Cross-snap: a thumb driven past the other sticks to it. Each native
  // input owns its focus and grab, so thumbs push against each other
  // rather than swapping identity — every emitted tuple stays ordered.
  const commitLow = (next: number) => onChange([Math.min(next, high), high]);
  const commitHigh = (next: number) => onChange([low, Math.max(next, low)]);

  const thumbKeyDown =
    (thumbValue: number, commit: (next: number) => void) =>
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (!e.defaultPrevented) {
        mirrorRangeArrows(e, thumbValue, commit, onNativeChange);
      }
    };

  return (
    <span x-class={[rangeWrapper, className]}>
      <span x-class={rangeRail} />
      <span
        x-class={rangeFill}
        style={{ insetInlineStart: `${fillStart}%`, width: `${fillWidth}%` }}
      />
      <input
        type='range'
        x-class={[base, rangeInput]}
        value={low}
        aria-label={thumbLabels[0]}
        onChange={(e) => {
          commitLow(Number(e.target.value));
          onNativeChange?.(e);
        }}
        onKeyDown={thumbKeyDown(low, commitLow)}
        {...rest}
      />
      <input
        type='range'
        x-class={[base, rangeInput]}
        value={high}
        aria-label={thumbLabels[1]}
        onChange={(e) => {
          commitHigh(Number(e.target.value));
          onNativeChange?.(e);
        }}
        onKeyDown={thumbKeyDown(high, commitHigh)}
        {...rest}
      />
    </span>
  );
}

export type { SliderCoreProps };
