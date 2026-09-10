import type { Ref, SetStateAction } from 'react';

import type { CalendarPickerMode } from '../Calendar/Calendar';

import { css } from '@linaria/core';
import { useCallback, useId, useRef } from 'react';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { mergeRefs } from '../../utils/refs';

import Calendar from '../Calendar/Calendar';

/** One shortcut row at the top of the dropdown panel: clicking applies
 * `value` (serialized per `picker`) and closes the panel. */
type DatepickerPreset = {
  /** Visible row copy. */
  label: string;
  /** Applied value — "YYYY-MM-DD" (date), "YYYY-MM" (month), "YYYY-Qn"
   * (quarter) or "YYYY" (year), matching `picker`. */
  value: string;
};

type DatepickerCoreProps = {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Calendar granularity; forwarded to the panel's Calendar and
   * followed by `value`/`onChange` serialization. */
  picker?: CalendarPickerMode;
  min?: string;
  max?: string;
  /** Disables individual dates on the panel's Calendar (see Calendar's
   * `disabledDate`). */
  disabledDate?: (date: Date) => boolean;
  /** Shortcut rows rendered above the calendar; clicking applies the
   * preset and closes the panel. */
  presets?: DatepickerPreset[];
  locale?: string;
  weekStartsOn?: 0 | 1;
  placeholder?: string;
  className?: string;
  /** Forwarded to the trigger `<input>` (not the wrapper div). */
  ref?: Ref<HTMLInputElement>;
};

const wrapper = css`
  position: relative;
  display: inline-block;
`;

const input = css`
  display: block;
  width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  padding: var(--haze-space-2) var(--haze-space-3);
  line-height: var(--haze-leading-normal);
  cursor: pointer;
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const dropdown = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);
`;

/* Shortcut rows heading the panel (SelectFloating's option-row style:
   full-width quiet rows on the list surface, a hairline separating them
   from the calendar below). */
const presetList = css`
  display: flex;
  flex-direction: column;
  padding-block: var(--haze-space-1) 0;
  margin-block-end: var(--haze-space-2);
  border-block-end: 1px solid var(--haze-color-border);
`;

const presetRow = css`
  display: flex;
  align-items: center;
  width: 100%;
  appearance: none;
  border: none;
  background: transparent;
  padding: var(--haze-space-1) var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  cursor: pointer;
  text-align: start;

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

export default function DatepickerCore({
  value,
  onChange,
  open,
  onOpenChange,
  picker,
  min,
  max,
  disabledDate,
  presets,
  locale,
  weekStartsOn,
  placeholder = 'Select date',
  className,
  ref,
}: DatepickerCoreProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // The consumer's ref rides the same trigger input the floating
  // behavior anchors on.
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(inputRef, ref)(node),
    [inputRef, ref]
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Adapt the value/onChange pair to the state-setter shape the floating
  // behavior drives (functional updates included).
  const setOpen = useCallback(
    (next: SetStateAction<boolean>) =>
      onOpenChange(typeof next === 'function' ? next(open) : next),
    [onOpenChange, open]
  );

  const floating = useFloating({
    open,
    setOpen,
    triggerRef: inputRef,
    panelRef,
    animated: true,
  });

  return (
    <div x-class={[wrapper, className]}>
      <input
        ref={setInputRef}
        readOnly
        style={floating.triggerStyle}
        className={input}
        value={value}
        placeholder={placeholder}
        // aria-expanded is not supported on the implicit textbox role
        // (ARIA 1.2, axe aria-allowed-attr); combobox is the honest role
        // for a readonly input that opens a popup panel.
        role='combobox'
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onPointerDown={floating.onTriggerPointerDown}
        onClick={floating.onTriggerClick}
      />
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement="bottom"
        visualClass={dropdown}
        id={panelId}
      >
        {presets && presets.length > 0 && (
          <div x-class={[presetList]}>
            {presets.map((preset) => (
              <button
                key={`${preset.label}:${preset.value}`}
                type='button'
                x-class={[presetRow]}
                onClick={() => {
                  onChange(preset.value);
                  onOpenChange(false);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        <Calendar
          picker={picker}
          value={value}
          min={min}
          max={max}
          disabledDate={disabledDate}
          locale={locale}
          weekStartsOn={weekStartsOn}
          onSelect={(date) => {
            onChange(date);
            onOpenChange(false);
          }}
        />
      </FloatingPanel>
    </div>
  );
}

export type { DatepickerCoreProps, DatepickerPreset };
