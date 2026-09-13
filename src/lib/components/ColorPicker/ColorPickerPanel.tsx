import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';

import type { ColorFormat, Hsv, Rgb } from './color-math';

import { useRef, useState } from 'react';

import { useStrings } from '../LocaleProvider';

import { cssColor, formatColor, hsvToRgb, parseColor, rgbHexKey, rgbToHsv } from './color-math';

import {
  checkerboard,
  groupLabel,
  hueTrack,
  panelContent,
  svArea,
  svThumb,
  swatchActive,
  swatchBtn,
  swatchFill,
  swatchRow,
  track,
  trackFill,
  trackThumb,
  valueInput,
} from './color-picker-styles';

type ColorPickerPanelProps = {
  /** Current color in any supported format; unparsable values fall back to black. */
  value: string;
  /**
   * Continuous value callback — fires for every drag move (Slider
   * precedent: values stream while the gesture runs), always serialized
   * in `format`.
   */
  onChange: (value: string) => void;
  /**
   * "The user settled on this color": gesture release, discrete pick
   * (preset/recent swatch, arrow keys) or committed text. The
   * recent-colors bookkeeping in the sugar layer rides on this.
   */
  onCommit?: (value: string) => void;
  /** Serialization format of the text field and every emitted value. */
  format?: ColorFormat;
  /** Adds the alpha rail; alpha serializes into the value when below 1. */
  allowAlpha?: boolean;
  /** Swatch row pinned above the recent row; any parsable format. */
  presets?: string[];
  /** Recent-color swatches to render (owned by the sugar layer). */
  recentColors?: string[];
  className?: string;
};

const BLACK: Rgb = {r: 0, g: 0, b: 0};

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/** A laid-out rect, or null for the zero-size rects jsdom reports. */
function rectOf(el: Element): DOMRect | null {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : null;
}

/**
 * Pointer-drag wiring for one control surface: extracts a value from
 * each event, streams it through `apply` while the gesture runs and
 * commits on release. Pointer capture is guarded — jsdom and engines
 * without it still deliver moves bubbling through the element itself
 * (Signature/BottomSheet precedent). A zero-size surface is a no-op.
 */
function usePointerDrag<T>(
  extract: (event: ReactPointerEvent<HTMLDivElement>) => T | null,
  apply: (value: T) => void,
  commit: (value: T) => void
) {
  const pointerRef = useRef<number | null>(null);
  return {
    onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
      if (event.button !== 0) return;
      const value = extract(event);
      if (value === null) return;
      event.preventDefault();
      pointerRef.current = event.pointerId;
      if (typeof event.currentTarget.setPointerCapture === 'function') {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // pointer already released — the gesture still tracks
        }
      }
      apply(value);
    },
    onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
      if (pointerRef.current !== event.pointerId) return;
      const value = extract(event);
      if (value !== null) apply(value);
    },
    onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
      if (pointerRef.current !== event.pointerId) return;
      pointerRef.current = null;
      const value = extract(event);
      if (value !== null) commit(value);
    },
    onPointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
      if (pointerRef.current !== event.pointerId) return;
      // Aborted gesture: stop tracking without recording a commit.
      pointerRef.current = null;
    },
  };
}

/** Horizontal position of the pointer along the element, as 0..1. */
function horizontalFraction(event: ReactPointerEvent<HTMLDivElement>): number | null {
  const rect = rectOf(event.currentTarget);
  if (!rect) return null;
  return clamp01((event.clientX - rect.left) / rect.width);
}

export default function ColorPickerPanel({
  value,
  onChange,
  onCommit,
  format = 'hex',
  allowAlpha = false,
  presets,
  recentColors,
  className,
}: ColorPickerPanelProps) {
  const strings = useStrings('colorPicker');

  // HSV state is derived from the value on every render — never
  // accumulated — so the controlled value stays the single source of
  // truth and a rounding pass through it cannot drift the thumb.
  const base = parseColor(value)?.rgb ?? BLACK;
  const alpha = allowAlpha ? (base.a ?? 1) : 1;
  const hsv = rgbToHsv(base);
  const currentKey = rgbHexKey({...base, a: alpha});

  const emit = (rgb: Rgb, commit: boolean) => {
    const next = formatColor(
      {...rgb, a: allowAlpha ? rgb.a : undefined},
      format,
      allowAlpha
    );
    onChange(next);
    if (commit) onCommit?.(next);
  };

  const applyHsv = (next: Hsv, commit: boolean) => {
    emit({...hsvToRgb(next), a: alpha}, commit);
  };
  const applyAlpha = (next: number, commit: boolean) => {
    emit({...base, a: next}, commit);
  };

  const svHandlers = usePointerDrag<Hsv>(
    (event) => {
      const rect = rectOf(event.currentTarget);
      if (!rect) return null;
      return {
        h: hsv.h,
        s: clamp01((event.clientX - rect.left) / rect.width),
        v: 1 - clamp01((event.clientY - rect.top) / rect.height),
      };
    },
    (next) => applyHsv(next, false),
    (next) => applyHsv(next, true)
  );

  const hueHandlers = usePointerDrag<number>(
    (event) => {
      const fraction = horizontalFraction(event);
      return fraction === null ? null : fraction * 360;
    },
    (next) => applyHsv({...hsv, h: next}, false),
    (next) => applyHsv({...hsv, h: next}, true)
  );

  const alphaHandlers = usePointerDrag<number>(
    (event) => horizontalFraction(event),
    (next) => applyAlpha(next, false),
    (next) => applyAlpha(next, true)
  );

  // Arrow keys adjust by 1% (SV/alpha) or 1° (hue); Shift ×10.
  const svKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = (event.shiftKey ? 10 : 1) / 100;
    switch (event.key) {
      case 'ArrowLeft':
        applyHsv({...hsv, s: clamp01(hsv.s - step)}, true);
        break;
      case 'ArrowRight':
        applyHsv({...hsv, s: clamp01(hsv.s + step)}, true);
        break;
      case 'ArrowDown':
        applyHsv({...hsv, v: clamp01(hsv.v - step)}, true);
        break;
      case 'ArrowUp':
        applyHsv({...hsv, v: clamp01(hsv.v + step)}, true);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const hueKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        applyHsv({...hsv, h: (((hsv.h - step) % 360) + 360) % 360}, true);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        applyHsv({...hsv, h: (hsv.h + step) % 360}, true);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const alphaKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = (event.shiftKey ? 10 : 1) / 100;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        applyAlpha(clamp01(alpha - step), true);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        applyAlpha(clamp01(alpha + step), true);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  // Text field: a local draft while focused; Enter/blur commits a
  // parsable draft in ANY format (normalized to `format`), invalid
  // input reverts (no-op). Escape drops the draft without closing the
  // panel (stopPropagation keeps the floating layer's Esc close away).
  const [draft, setDraft] = useState<string | null>(null);
  const shownValue =
    draft ?? formatColor({...base, a: alpha}, format, allowAlpha);
  const commitDraft = () => {
    if (draft === null) return;
    const next = parseColor(draft);
    setDraft(null);
    if (next) emit(next.rgb, true);
  };

  const renderSwatches = (colors: string[], keyPrefix: string) => (
    <div x-class={[swatchRow]}>
      {colors.map((color) => {
        const rgb = parseColor(color)?.rgb;
        if (!rgb) return null;
        return (
          <button
            key={`${keyPrefix}:${color}`}
            type='button'
            x-class={[swatchBtn, checkerboard, rgbHexKey(rgb) === currentKey && swatchActive]}
            aria-label={color}
            onClick={() => emit(rgb, true)}
          >
            <span x-class={[swatchFill]} style={{background: cssColor(rgb)}} />
          </button>
        );
      })}
    </div>
  );

  return (
    <div x-class={[panelContent, className]}>
      {/*
        The SV surface: hue base painted by inline style under white
        (left→right = saturation) and black (bottom→top = value)
        gradients — functional color stops, like the hue spectrum rail.
      */}
      <div
        x-class={[svArea]}
        role='slider'
        tabIndex={0}
        aria-label={strings.saturationBrightness}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={formatColor(base, 'hex', false)}
        style={{
          background: `linear-gradient(to top, #000, rgba(0, 0, 0, 0)), linear-gradient(to right, #fff, rgba(255, 255, 255, 0)), hsl(${hsv.h}, 100%, 50%)`,
        }}
        onKeyDown={svKeyDown}
        {...svHandlers}
      >
        <span
          x-class={[svThumb]}
          style={{left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`}}
        />
      </div>

      <div
        x-class={[track, hueTrack]}
        role='slider'
        tabIndex={0}
        aria-label={strings.hue}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        aria-valuetext={`${Math.round(hsv.h)}deg`}
        onKeyDown={hueKeyDown}
        {...hueHandlers}
      >
        <span x-class={[trackThumb]} style={{left: `${(hsv.h / 360) * 100}%`}} />
      </div>

      {allowAlpha && (
        <div
          x-class={[track, checkerboard]}
          role='slider'
          tabIndex={0}
          aria-label={strings.alpha}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(alpha * 100)}
          aria-valuetext={`${Math.round(alpha * 100)}%`}
          onKeyDown={alphaKeyDown}
          {...alphaHandlers}
        >
          <span
            x-class={[trackFill]}
            style={{
              background: `linear-gradient(to right, rgba(${base.r}, ${base.g}, ${base.b}, 0), rgba(${base.r}, ${base.g}, ${base.b}, 1))`,
            }}
          />
          <span x-class={[trackThumb]} style={{left: `${alpha * 100}%`}} />
        </div>
      )}

      <input
        type='text'
        x-class={[valueInput]}
        aria-label={strings.hexColor}
        spellCheck={false}
        value={shownValue}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitDraft();
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            setDraft(null);
          }
        }}
      />

      {presets !== undefined && presets.length > 0 && (
        <>
          <div x-class={[groupLabel]}>{strings.presetsLabel}</div>
          {renderSwatches(presets, 'preset')}
        </>
      )}

      {recentColors !== undefined && recentColors.length > 0 && (
        <>
          <div x-class={[groupLabel]}>{strings.recentColors}</div>
          {renderSwatches(recentColors, 'recent')}
        </>
      )}
    </div>
  );
}

export type { ColorPickerPanelProps };
