import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { ColorFormat } from './color-math';

import { css } from '@linaria/core';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { mergeRefs } from '../../utils/refs';

import ColorPickerPanel from './ColorPickerPanel';
import { cssColor, parseColor, rgbHexKey } from './color-math';

import {
  checkerboard,
  panelVisuals,
  swatchFill,
  trigger,
} from './color-picker-styles';

type ColorPickerProps = {
  /** Color value in any supported format (hex / rgb / hsl). */
  value?: ControlOrValue<string>;
  /**
   * Value callback: streams continuously while a drag runs (Slider
   * precedent), serialized in `format`.
   */
  onChange?: (color: string) => void;
  /** Floating panel visibility (floating mode only; controllable). */
  open?: ControlOrValue<boolean>;
  /**
   * Always-visible panel instead of the trigger + floating panel pair.
   * The Core-level primitive (`ColorPickerCore`) remains the native
   * inline form for headless composition.
   */
  inline?: boolean;
  /**
   * Serialization format of the text field and emitted values
   * (`#rrggbb`, `rgb(r, g, b)`, `hsl(h, s%, l%)`). A controlled display
   * concern — switching it does not re-emit the current value.
   */
  format?: ColorFormat;
  /**
   * Adds the alpha rail. Values below full opacity serialize with the
   * alpha channel (`#rrggbbaa`, `rgba()`, `hsla()`); full opacity keeps
   * the opaque form.
   */
  allowAlpha?: boolean;
  /** Swatch row pinned above the recent row; any parsable format. */
  presets?: string[];
  /**
   * Tracks recently used colors (last 10, newest first) as internal
   * state: every committed pick — drag release, swatch click, arrow
   * key, text commit — moves its color to the front, deduplicated.
   */
  recent?: boolean;
  className?: string;
  /**
   * Accessible name of the trigger (floating mode) and the panel;
   * defaults to the locale's "Pick color". Set it whenever more than
   * one picker is on a page.
   */
  'aria-label'?: string;
  /**
   * Floating mode: the trigger swatch button. Inline mode: the panel
   * card div — the elements `ref.current.focus()` reaches.
   */
  ref?: Ref<HTMLButtonElement | HTMLDivElement>;
};

/** Recent colors are capped (AntD-aligned); newest first. */
const RECENT_LIMIT = 10;

const container = css`
  position: relative;
  display: inline-flex;
`;

export default function ColorPicker({
  value: valueControl,
  onChange,
  open: openControl,
  inline = false,
  format = 'hex',
  allowAlpha = false,
  presets,
  recent = false,
  className,
  'aria-label': ariaLabel,
  ref,
}: ColorPickerProps) {
  const strings = useStrings('colorPicker');
  const [value, setValue] = useControl(valueControl, '#000000');
  const [open, setOpen] = useControl(openControl, false);

  const label = ariaLabel ?? strings.pickColor;
  const display = parseColor(value)?.rgb ?? {r: 0, g: 0, b: 0};

  const handleChange = useCallback(
    (next: string) => {
      setValue(next);
      onChange?.(next);
    },
    [setValue, onChange]
  );

  // Recent colors: internal-only UI state (never a controlled prop) —
  // commits unshift, dedupe by canonical RGBA, cap at RECENT_LIMIT.
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const handleCommit = useCallback(
    (color: string) => {
      if (!recent) return;
      const key = rgbHexKey(parseColor(color)?.rgb ?? {r: 0, g: 0, b: 0});
      setRecentColors((prev) => [
        color,
        ...prev.filter((c) => {
          const p = parseColor(c);
          return p === null || rgbHexKey(p.rgb) !== key;
        }),
      ].slice(0, RECENT_LIMIT));
    },
    [recent]
  );

  const panel = (
    <ColorPickerPanel
      value={value}
      onChange={handleChange}
      onCommit={handleCommit}
      format={format}
      allowAlpha={allowAlpha}
      presets={presets}
      recentColors={recent ? recentColors : undefined}
    />
  );

  // Inline mode: the panel card is the root; no trigger, no floating
  // layer. Hooks above still run — the floating behavior idles closed.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Stable identity (Datepicker precedent): the floating behavior anchors
  // on this trigger (outside-close boundary); the consumer's ref rides
  // the same node.
  const setTriggerRef = useCallback(
    (node: HTMLButtonElement | null) =>
      mergeRefs(triggerRef, ref as Ref<HTMLButtonElement> | undefined)(node),
    [ref]
  );
  const id = useId();
  const floating = useFloating({
    open,
    setOpen,
    triggerRef,
    panelRef,
    animated: true,
  });

  // Keyboard reach: opening the panel moves focus onto the SV surface
  // (the first slider), so arrows adjust color immediately. Gated on
  // `shown` — focusing before the popover is visible is silently
  // dropped (see FloatingBehavior.shown).
  useEffect(() => {
    if (!floating.shown) return;
    panelRef.current
      ?.querySelector<HTMLElement>("[role='slider']")
      ?.focus();
  }, [floating.shown]);

  if (inline) {
    return (
      <div ref={ref as Ref<HTMLDivElement> | undefined} x-class={[panelVisuals, className]}>
        {panel}
      </div>
    );
  }

  return (
    <span className={container}>
      <button
        ref={setTriggerRef}
        type='button'
        x-class={[trigger, checkerboard]}
        style={floating.triggerStyle}
        aria-label={label}
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-controls={id}
        onPointerDown={floating.onTriggerPointerDown}
        onClick={floating.onTriggerClick}
      >
        <span x-class={[swatchFill]} style={{background: cssColor(display)}} />
      </button>
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement='bottom'
        id={id}
        role='dialog'
        aria-label={label}
        visualClass={panelVisuals}
        className={className}
      >
        {panel}
      </FloatingPanel>
    </span>
  );
}

export type { ColorPickerProps };
