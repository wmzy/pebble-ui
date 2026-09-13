import type {
  ComponentPropsWithoutRef,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  Ref,
} from 'react';

import { css } from '@linaria/core';
import { useEffect } from 'react';
import { useControl } from 'react-use-control';

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
  /**
   * Shows a value bubble over the active thumb while it is being
   * dragged (pointerdown until pointerup) or focused. Opt-in: without
   * it nothing extra renders. The bubble is visual only
   * (`aria-hidden`) — the native input keeps exposing the value, so
   * `aria-valuetext` semantics are untouched. In range mode each thumb
   * carries its own bubble.
   */
  tooltip?: boolean;
  /** Formats the bubble content (both modes); defaults to the raw
   * number. */
  tooltipFormatter?: (value: number) => ReactNode;
  /**
   * Tick labels rendered under the track (beside it when `vertical`).
   * Clicking a label commits that value to the nearest thumb (ties go
   * to the low thumb; a value past the other thumb still snaps against
   * it instead of crossing). Combine with `step={null}` to restrict
   * the selectable values to the mark keys.
   */
  marks?: Record<number, ReactNode>;
  /**
   * Vertical orientation (bottom-to-top) via the modern
   * `writing-mode: vertical-lr; direction: rtl` slider recipe
   * (Chromium 119+ / Firefox 120+ / Safari 17.4+; older engines keep
   * rendering horizontally). Keyboard behavior stays native — the
   * RTL arrow mirroring only applies to horizontal sliders. The track
   * length defaults to `calc(var(--haze-space-16) * 2)`; override it
   * by setting `--haze-slider-track` on the slider or an ancestor.
   */
  vertical?: boolean;
  /**
   * Pass `null` (with `marks`) to make the marks the only selectable
   * values: the native inputs receive `step='any'` and every change —
   * drag, click or keyboard — snaps to the nearest mark key. A number
   * is forwarded to the native inputs as-is; omitted keeps the native
   * default.
   */
  step?: number | null;
  className?: string;
  /**
   * Single mode: forwarded to the input untouched. Range mode: a
   * `[lowLabel, highLabel]` tuple labels each thumb; a bare string
   * labels both thumbs (two identically named sliders are ambiguous —
   * prefer the tuple). All other forwarded native props (min, max,
   * step, disabled, …) apply to both inputs.
   */
  'aria-label'?: string | [string, string];
  /**
   * Forwarded to the `<input type='range'>` — the only input in single
   * mode, the low thumb (first tab stop) in range mode.
   */
  ref?: Ref<HTMLInputElement>;
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'value' | 'onChange' | 'aria-label' | 'step'
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

  /* Forced-colors: the UA flattens the muted rail and the primary
     thumb onto Canvas — the slider would disappear. The single-mode
     input paints its own rail in CanvasText with Highlight thumbs
     (Windows-native slider rendering); the thumb pseudo rules also
     cover the range-mode stacked inputs (rangeInput's transparent
     background wins over the restated rail color there — the rail
     span below paints it). The thumb box-shadow focus rings are
     dropped by the UA, so focus moves to an input-level Highlight
     outline. */
  @media (forced-colors: active) {
    background: CanvasText;

    &::-webkit-slider-thumb {
      background: Highlight;
      border-color: HighlightText;
    }

    &::-moz-range-thumb {
      background: Highlight;
      border-color: HighlightText;
    }

    &:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }
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

/**
 * Single mode opts into extras (tooltip / marks / vertical) through
 * this relative wrapper — the bare input stays the root otherwise.
 * Flex (not block) so the inline input contributes its exact height
 * without a text-baseline gap for absolutely positioned children
 * (bubble, marks) to be measured against.
 */
const singleWrapper = css`
  position: relative;
  display: flex;
  width: 100%;
`;

/** The shared track — the range-mode inputs paint no track of their
 * own (see rangeInput), so the rail lives under them. */
const rangeRail = css`
  display: block;
  height: 6px;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);

  /* Forced-colors: the muted rail flattens onto Canvas — restated as
     a CanvasText track line (rangeInput's transparent background
     keeps the stacked inputs from double-painting it). */
  @media (forced-colors: active) {
    background: CanvasText;
  }
`;

/** Progress between the thumbs; positioned with logical properties so
 * RTL mirrors it for free (the fill grows from the inline start). */
const rangeFill = css`
  position: absolute;
  inset-block-start: 0;
  height: 6px;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-primary);

  /* Forced-colors: the primary fill flattens onto Canvas — restated
     as Highlight so the selected range stays visible over the
     CanvasText rail. */
  @media (forced-colors: active) {
    background: Highlight;
  }
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
 * Vertical mode: the modern slider recipe (no deprecated
 * `-webkit-appearance: slider-vertical`) — engines without support
 * (Chromium <119 / Firefox <120 / Safari <17.4) fall back to a plain
 * horizontal slider. `direction: rtl` is part of the recipe (min at
 * the bottom, max at the top), not an RTL-context signal — which is
 * why the arrow mirroring skips vertical sliders. The wrapper owns the
 * `--haze-slider-track` default so rail, inputs and consumer
 * overrides all read one value.
 */
const verticalWrapper = css`
  --haze-slider-track: calc(var(--haze-space-16) * 2);
  position: relative;
  display: inline-flex;
  inline-size: max-content;
`;

const verticalInput = css`
  writing-mode: vertical-lr;
  direction: rtl;
  width: 6px;
  height: var(--haze-slider-track);
`;

const verticalRail = css`
  width: 6px;
  height: var(--haze-slider-track);
`;

const verticalFill = css`
  width: 6px;
`;

/** Room below the horizontal rail for the mark labels. */
const marksHorizontal = css`
  padding-block-end: var(--haze-space-6);
`;

/** Room beside the vertical rail for the mark labels. */
const marksVertical = css`
  padding-inline-end: var(--haze-space-12);
`;

const markBase = css`
  position: absolute;
  display: flex;
  align-items: center;
  cursor: pointer;
  /* Widen the hit area around the label. */
  padding-inline: var(--haze-space-1);
`;

const markHorizontal = css`
  inset-block-start: 0;
  flex-direction: column;
  transform: translateX(-50%);

  /* Center the 4px tick inside the 6px rail. */
  & > span:first-child {
    margin-block-start: 1px;
  }
`;

const markVertical = css`
  inset-inline-start: 0;
  gap: var(--haze-space-2);
  transform: translateY(50%);
`;

const markTick = css`
  flex: none;
  width: 4px;
  height: 4px;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-text-muted);

  /* Forced-colors: the muted tick flattens onto Canvas. */
  @media (forced-colors: active) {
    background: CanvasText;
  }
`;

const markLabel = css`
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-normal);
  color: var(--haze-color-text-secondary);
  white-space: nowrap;
`;

/**
 * The value bubble: always mounted (per thumb) and toggled through
 * `data-state`, so enter and exit both animate on the duration token.
 * Anchored past the block-start edge (not from block-end) so the
 * marks' block-end padding cannot shift it. Visual only — the native
 * input keeps announcing the value.
 */
const tooltipBubble = css`
  position: absolute;
  inset-block-start: calc(-1 * var(--haze-space-1));
  transform: translate(-50%, -100%);
  padding: var(--haze-space-1) var(--haze-space-2);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-text);
  color: var(--haze-color-text-inverse);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-normal);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity var(--haze-duration-fast) var(--haze-ease),
    visibility var(--haze-duration-fast) var(--haze-ease);

  &[data-state='open'] {
    opacity: 1;
    visibility: visible;
  }

  /* Forced-colors: the dark bubble and its inverse text flatten onto
     Canvas/CanvasText — restated with a CanvasText boundary so the
     value stays readable as a chip. */
  @media (forced-colors: active) {
    background: Canvas;
    color: CanvasText;
    border: 1px solid CanvasText;
  }
`;

/** Vertical sliders carry the bubble beside the thumb instead. */
const tooltipBubbleVertical = css`
  inset-block-start: auto;
  inset-inline-start: calc(100% + var(--haze-space-2));
  transform: translateY(-50%);
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

/** The mark keys as a sorted number list; `undefined` when no marks. */
function markKeyList(marks: Record<number, ReactNode> | undefined) {
  if (marks === undefined) return undefined;
  const keys = Object.keys(marks)
    .map(Number)
    .filter((key) => Number.isFinite(key))
    .sort((a, b) => a - b);
  return keys.length > 0 ? keys : undefined;
}

/** The mark key closest to `value` (ties keep the lower key). */
function nearestMark(value: number, keys: readonly number[]): number {
  let best = keys[0]!;
  let bestDistance = Math.abs(value - best);
  for (let i = 1; i < keys.length; i += 1) {
    const candidate = keys[i]!;
    const distance = Math.abs(value - candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

export default function SliderCore({
  value,
  onChange,
  onNativeChange,
  range = false,
  className,
  onKeyDown,
  'aria-label': ariaLabel,
  tooltip = false,
  tooltipFormatter,
  marks,
  vertical = false,
  step,
  onPointerDown,
  onFocus,
  onBlur,
  ref,
  ...rest
}: SliderCoreProps) {
  // Which thumb's bubble is up (`null` = none). Internal UI state via
  // the control hook, never exposed as a prop.
  const [activeThumb, setActiveThumb] = useControl<number | null>(
    undefined,
    null
  );

  // A drag can release outside the input (pointer left mid-drag), so
  // hiding listens for any pointerup/pointercancel while a bubble is
  // up — blur covers the keyboard exit.
  useEffect(() => {
    if (activeThumb === null) return;
    const hide = () => setActiveThumb(null);
    window.addEventListener('pointerup', hide);
    window.addEventListener('pointercancel', hide);
    return () => {
      window.removeEventListener('pointerup', hide);
      window.removeEventListener('pointercancel', hide);
    };
  }, [activeThumb, setActiveThumb]);

  const min = numberOr(rest.min, 0);
  const max = numberOr(rest.max, 100);
  const span = max - min;
  const percent = (raw: number) =>
    span > 0 ? Math.min(Math.max(((raw - min) / span) * 100, 0), 100) : 0;

  // `step={null}` (with marks) frees the native inputs (`step='any'`)
  // and snaps every commit onto the nearest mark key.
  const markKeys = markKeyList(marks);
  const snapValue =
    step === null && markKeys !== undefined
      ? (next: number) => nearestMark(next, markKeys)
      : (next: number) => next;
  const inputStep = step === null ? 'any' : step;

  const showFor =
    (thumb: number) => (event: ReactPointerEvent<HTMLInputElement>) => {
      onPointerDown?.(event);
      if (!event.currentTarget.disabled) setActiveThumb(thumb);
    };

  // Tooltip wiring composes the consumer's focus handlers; without the
  // feature the props pass through untouched.
  const thumbProps = (thumb: number) =>
    tooltip
      ? {
          onPointerDown: showFor(thumb),
          onFocus: (event: ReactFocusEvent<HTMLInputElement>) => {
            onFocus?.(event);
            setActiveThumb(thumb);
          },
          onBlur: (event: ReactFocusEvent<HTMLInputElement>) => {
            onBlur?.(event);
            setActiveThumb(null);
          },
        }
      : { onPointerDown, onFocus, onBlur };

  const renderBubble = (thumbValue: number, thumb: number) => {
    if (!tooltip) return null;
    const open = activeThumb === thumb;
    return (
      <span
        data-slot='tooltip'
        aria-hidden='true'
        data-state={open ? 'open' : 'closed'}
        x-class={[tooltipBubble, vertical && tooltipBubbleVertical]}
        style={
          vertical
            ? { insetBlockEnd: `${percent(thumbValue)}%` }
            : { insetInlineStart: `${percent(thumbValue)}%` }
        }
      >
        {tooltipFormatter ? tooltipFormatter(thumbValue) : thumbValue}
      </span>
    );
  };

  const renderMarks = (commit: (next: number) => void) =>
    markKeys === undefined
      ? null
      : markKeys.map((mark) => (
          <span
            key={mark}
            data-slot='mark'
            x-class={[markBase, vertical ? markVertical : markHorizontal]}
            style={
              vertical
                ? { insetBlockEnd: `${percent(mark)}%` }
                : { insetInlineStart: `${percent(mark)}%` }
            }
            onClick={() => commit(mark)}
          >
            <span data-slot='mark-tick' x-class={markTick} />
            <span data-slot='mark-label' x-class={markLabel}>{marks?.[mark] ?? null}</span>
          </span>
        ));

  if (!range) {
    // Single mode carries the union's number member — the sugar
    // guarantees it; the assertion is that member selection only.
    const single = value as number;
    // Same member selection for the label: single mode consumers pass a
    // string (a tuple is a range-mode-only shape).
    const singleLabel = ariaLabel as string | undefined;
    const commit = (next: number) => onChange(snapValue(next));
    const input = (
      <input
        ref={ref}
        type='range'
        data-slot='input'
        x-class={[base, vertical && verticalInput, className]}
        value={single}
        aria-label={singleLabel}
        step={inputStep}
        onChange={(e) => {
          commit(Number(e.target.value));
          onNativeChange?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (!e.defaultPrevented && !vertical) {
            mirrorRangeArrows(e, single, commit, onNativeChange);
          }
        }}
        {...thumbProps(0)}
        {...rest}
      />
    );
    // Zero-regression guard: without any extra the bare input stays
    // the component's root (no wrapper).
    if (!tooltip && marks === undefined && !vertical) {
      return input;
    }
    return (
      <span
        data-slot='slider'
        x-class={[
          vertical ? verticalWrapper : singleWrapper,
          marks !== undefined && (vertical ? marksVertical : marksHorizontal),
        ]}
      >
        {input}
        {renderBubble(single, 0)}
        {renderMarks(commit)}
      </span>
    );
  }

  const [low, high] = normalizePair(value);
  const thumbLabels: [string | undefined, string | undefined] = Array.isArray(
    ariaLabel
  )
    ? ariaLabel
    : [ariaLabel, ariaLabel];

  // Fill geometry as track percentages, clamped to the rail's extent.
  const fillStart = percent(low);
  const fillSize = percent(high) - fillStart;

  // Cross-snap: a thumb driven past the other sticks to it. Each native
  // input owns its focus and grab, so thumbs push against each other
  // rather than swapping identity — every emitted tuple stays ordered.
  const commitLow = (next: number) =>
    onChange([Math.min(snapValue(next), high), high]);
  const commitHigh = (next: number) =>
    onChange([low, Math.max(snapValue(next), low)]);

  // A mark click lands on the nearest thumb (ties on the low thumb) and
  // respects the same snap-instead-of-cross rule as a drag.
  const commitMark = (mark: number) => {
    const snapped = snapValue(mark);
    const toLow = Math.abs(snapped - low) <= Math.abs(snapped - high);
    onChange(
      toLow
        ? [Math.min(snapped, high), high]
        : [low, Math.max(snapped, low)]
    );
  };

  const thumbKeyDown =
    (thumbValue: number, commit: (next: number) => void) =>
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      // Vertical sliders keep native arrow semantics — their input-level
      // `direction: rtl` is the orientation recipe, not an RTL context.
      if (!e.defaultPrevented && !vertical) {
        mirrorRangeArrows(e, thumbValue, commit, onNativeChange);
      }
    };

  return (
    <span
      data-slot='slider'
      x-class={[
        rangeWrapper,
        vertical && verticalWrapper,
        marks !== undefined && (vertical ? marksVertical : marksHorizontal),
        className,
      ]}
    >
      <span data-slot='track' x-class={[rangeRail, vertical && verticalRail]} />
      <span
        data-slot='fill'
        x-class={[rangeFill, vertical && verticalFill]}
        style={
          vertical
            ? {
                insetBlockStart: `${100 - percent(high)}%`,
                height: `${fillSize}%`,
              }
            : {
                insetInlineStart: `${fillStart}%`,
                width: `${fillSize}%`,
              }
        }
      />
      <input
        ref={ref}
        type='range'
        data-slot='input'
        x-class={[base, rangeInput, vertical && verticalInput]}
        value={low}
        aria-label={thumbLabels[0]}
        step={inputStep}
        onChange={(e) => {
          commitLow(Number(e.target.value));
          onNativeChange?.(e);
        }}
        onKeyDown={thumbKeyDown(low, commitLow)}
        {...thumbProps(0)}
        {...rest}
      />
      <input
        type='range'
        data-slot='input'
        x-class={[base, rangeInput, vertical && verticalInput]}
        value={high}
        aria-label={thumbLabels[1]}
        step={inputStep}
        onChange={(e) => {
          commitHigh(Number(e.target.value));
          onNativeChange?.(e);
        }}
        onKeyDown={thumbKeyDown(high, commitHigh)}
        {...thumbProps(1)}
        {...rest}
      />
      {renderBubble(low, 0)}
      {renderBubble(high, 1)}
      {renderMarks(commitMark)}
    </span>
  );
}

export type { SliderCoreProps };
