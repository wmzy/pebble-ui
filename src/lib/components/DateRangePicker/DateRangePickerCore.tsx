import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

import Calendar from '../Calendar/Calendar';

/** One shortcut row at the top of the range panel: clicking applies
 * `range` as the start/end pair. */
type DateRangePickerPreset = {
  /** Visible row copy. */
  label: string;
  /** Applied range as two "YYYY-MM-DD" strings. */
  range: [string, string];
};

type DateRangePickerCoreProps = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  separator?: ReactNode;
  /**
   * Number of month grids in the range panel. `2` renders an inline
   * dual-month calendar below the inputs: the first pick sets the start
   * date, the second completes the range (a pick before the start
   * restarts it), and the two grids move together under one navigation.
   * The default keeps the plain two-input layout.
   * @default 1
   */
  months?: 1 | 2;
  /** Disables individual dates on the panel's Calendar (see Calendar's
   * `disabledDate`). */
  disabledDate?: (date: Date) => boolean;
  /** Shortcut rows at the top of the panel; clicking applies the
   * preset's range to the start/end pair. Providing presets renders
   * the inline panel even with the default `months={1}`. */
  presets?: DateRangePickerPreset[];
  className?: string;
};

const container = css`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
  font-family: var(--haze-font-sans);
`;

/* Dual-month layout: inputs stay on their own row, the calendar panel
   stacks below and never reflows the input row's baseline. */
const stackedContainer = css`
  flex-direction: column;
  align-items: flex-start;
`;

const inputsRow = css`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
`;

const panel = css`
  margin-block-start: var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-md);
  max-width: 100%;
`;

const input = css`
  padding: var(--haze-space-2) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  outline: none;
  transition: border-color var(--haze-duration-fast), box-shadow var(--haze-duration-fast);

  &:focus {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const sep = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

/* Shortcut rows heading the panel (SelectFloating's option-row style),
   a hairline separating them from the calendars below. */
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

export default function DateRangePickerCore({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  separator = '–',
  months = 1,
  disabledDate,
  presets,
  className,
}: DateRangePickerCoreProps) {
  const strings = useStrings('dateRangePicker');

  // Two-click range semantics on the calendar panel: no start yet (or a
  // complete range) starts over with a fresh start; a pick at or after
  // the start completes the range; a pick before the start restarts it.
  const handleCalendarSelect = (date: string) => {
    if (!startDate || endDate) {
      onStartChange(date);
      onEndChange('');
    } else if (date < startDate) {
      onStartChange(date);
    } else {
      onEndChange(date);
    }
  };

  const hasPresets = presets !== undefined && presets.length > 0;

  const inputs = (
    <>
      <input
        type="date"
        x-class={[input]}
        aria-label={strings.startDate}
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <span x-class={[sep]}>{separator}</span>
      <input
        type="date"
        x-class={[input]}
        aria-label={strings.endDate}
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
      />
    </>
  );

  // The inline panel exists for the dual-month calendar and on its own
  // for presets (shortcut rows above nothing still set both inputs).
  if (months !== 2 && !hasPresets) {
    return (
      <div x-class={[container, className]}>
        {inputs}
      </div>
    );
  }

  return (
    <div x-class={[container, stackedContainer, className]}>
      <div x-class={[inputsRow]}>{inputs}</div>
      <div x-class={[panel]}>
        {hasPresets && (
          <div x-class={[presetList]}>
            {presets.map((preset) => (
              <button
                key={`${preset.label}:${preset.range.join('~')}`}
                type='button'
                x-class={[presetRow]}
                onClick={() => {
                  onStartChange(preset.range[0]);
                  onEndChange(preset.range[1]);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        {months === 2 && (
          <Calendar
            months={2}
            rangeStart={startDate}
            rangeEnd={endDate}
            disabledDate={disabledDate}
            onSelect={handleCalendarSelect}
          />
        )}
      </div>
    </div>
  );
}

export type { DateRangePickerCoreProps, DateRangePickerPreset };
