import type { ComponentPropsWithoutRef, KeyboardEvent, Ref, RefObject } from 'react';

import type { TimeParts, TimePickerFormat } from './time';

import { useCallback, useEffect, useId, useRef } from 'react';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { mergeRefs } from '../../utils/refs';

import { useStrings } from '../LocaleProvider';

import {
  columnList,
  columnOption,
  columnOptionDisabled,
  columnOptionSelected,
  columnWrap,
  columns,
  footer,
  nowButton,
  panel,
  trigger,
  wrapper,
} from './time-picker-styles';
import {
  formatTimeValue,
  from12Hour,
  hour12Values,
  pad2,
  parseTimeValue,
  stepValue,
  stepValues,
  to12Hour,
} from './time';

/** Which listbox a keyboard event landed on. */
type ColumnKind = 'hour' | 'minute' | 'second' | 'period';

/** One selectable cell of a column listbox. */
type ColumnItem = {
  key: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  choose: () => void;
};

/**
 * One enabled/disabled decision for a candidate cell. The predicate is
 * evaluated against the currently selected parts for the other fields
 * (see `disabledTime` on TimePickerProps).
 */
type TimePredicate = (parts: TimeParts) => boolean;

type TimePickerPanelProps = {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: TimePickerFormat;
  hourStep: number;
  minuteStep: number;
  secondStep: number;
  use12Hours: boolean;
  disabledTime?: TimePredicate;
  placeholder?: string;
  className?: string;
  /** Forwarded to the trigger `<input>` — focus bridges reach it. */
  ref?: Ref<HTMLInputElement>;
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  'value' | 'onChange' | 'type' | 'placeholder' | 'defaultValue'
>;

export default function TimePickerPanel({
  value,
  onChange,
  open,
  onOpenChange,
  format,
  hourStep,
  minuteStep,
  secondStep,
  use12Hours,
  disabledTime,
  placeholder,
  className,
  onKeyDown: consumerKeyDown,
  ref,
  ...rest
}: TimePickerPanelProps) {
  const strings = useStrings('timePicker');
  const inputRef = useRef<HTMLInputElement>(null);
  // The consumer's ref rides the same trigger input the floating
  // behavior anchors on.
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(inputRef, ref)(node),
    [inputRef, ref]
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const hourColumnRef = useRef<HTMLDivElement>(null);
  const minuteColumnRef = useRef<HTMLDivElement>(null);
  const secondColumnRef = useRef<HTMLDivElement>(null);
  const periodColumnRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Adapt the value/onOpenChange pair to the state-setter shape the
  // floating behavior drives (functional updates included).
  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) =>
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

  const withSeconds = format === 'HH:mm:ss';
  const parsed = parseTimeValue(value);
  // Empty value: the columns commit relative to midnight until the
  // first pick (ArrowDown on the hour column lands on 01:00).
  const parts: TimeParts = parsed ?? { hour: 0, minute: 0, second: 0 };
  const hasValue = parsed !== null;
  const isPM = parts.hour >= 12;

  const isTimeDisabled = useCallback<TimePredicate>(
    (candidate) => disabledTime?.(candidate) ?? false,
    [disabledTime]
  );

  const commitParts = useCallback(
    (next: TimeParts) => {
      onChange(formatTimeValue(next, format));
    },
    [onChange, format]
  );

  // Keyboard step targets: the next enabled grid value around the ring.
  const stepHour = useCallback(
    (step: number) =>
      stepValue(parts.hour, step, 23, (hour) =>
        !isTimeDisabled({ ...parts, hour })
      ),
    [parts, isTimeDisabled]
  );
  const stepMinute = useCallback(
    (step: number) =>
      stepValue(
        parts.minute,
        step,
        59,
        (minute) => !isTimeDisabled({ ...parts, minute })
      ),
    [parts, isTimeDisabled]
  );
  const stepSecond = useCallback(
    (step: number) =>
      stepValue(
        parts.second,
        step,
        59,
        (second) => !isTimeDisabled({ ...parts, second })
      ),
    [parts, isTimeDisabled]
  );

  const chooseNow = useCallback(() => {
    const now = new Date();
    onChange(
      formatTimeValue(
        {
          hour: now.getHours(),
          minute: now.getMinutes(),
          second: now.getSeconds(),
        },
        format
      )
    );
    onOpenChange(false);
  }, [onChange, onOpenChange, format]);

  const handleTriggerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!e.currentTarget.disabled) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          // Trigger arrows adjust the hour by ±hourStep (the hour
          // column's step), wrapping the 24-hour ring.
          e.preventDefault();
          const next = stepHour(e.key === 'ArrowDown' ? hourStep : -hourStep);
          if (next !== null) commitParts({ ...parts, hour: next });
        } else if (e.key === 'Enter' || e.key === ' ') {
          // A readonly input has no native activation — complete the
          // textbox contract here (Space also must not scroll).
          e.preventDefault();
          floating.onTriggerClick();
        }
      }
      consumerKeyDown?.(e);
    },
    [
      stepHour,
      hourStep,
      commitParts,
      parts,
      floating.onTriggerClick,
      consumerKeyDown,
    ]
  );

  const handleColumnKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, kind: ColumnKind) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const down = e.key === 'ArrowDown';
      if (kind === 'hour') {
        const next = stepHour(down ? hourStep : -hourStep);
        if (next !== null) commitParts({ ...parts, hour: next });
      } else if (kind === 'minute') {
        const next = stepMinute(down ? minuteStep : -minuteStep);
        if (next !== null) commitParts({ ...parts, minute: next });
      } else if (kind === 'second') {
        const next = stepSecond(down ? secondStep : -secondStep);
        if (next !== null) commitParts({ ...parts, second: next });
      } else {
        // Period column: one option per direction — flip AM/PM.
        const next = from12Hour(to12Hour(parts.hour), !isPM);
        if (!isTimeDisabled({ ...parts, hour: next })) {
          commitParts({ ...parts, hour: next });
        }
      }
    },
    [
      stepHour,
      stepMinute,
      stepSecond,
      hourStep,
      minuteStep,
      secondStep,
      commitParts,
      parts,
      isPM,
      isTimeDisabled,
    ]
  );

  // Focus lands on the hour column when the panel becomes visible —
  // gated on `shown` (a display:none panel would drop the focus call;
  // see FloatingBehavior.shown).
  useEffect(() => {
    if (open && floating.shown) hourColumnRef.current?.focus();
  }, [open, floating.shown]);

  // Center the selected option of every column in its highlight band —
  // on open and after each commit while open.
  useEffect(() => {
    if (!floating.shown) return;
    for (const list of panelRef.current?.querySelectorAll<HTMLElement>(
      '[role="listbox"]'
    ) ?? []) {
      const selected = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (selected) {
        list.scrollTop = Math.max(
          0,
          selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2
        );
      }
    }
  }, [
    floating.shown,
    value,
    format,
    use12Hours,
    hourStep,
    minuteStep,
    secondStep,
  ]);

  const renderColumn = (
    kind: ColumnKind,
    label: string,
    listRef: RefObject<HTMLDivElement | null>,
    items: ColumnItem[]
  ) => (
    <div x-class={[columnWrap]} key={kind}>
      <div
        ref={listRef}
        role="listbox"
        tabIndex={0}
        aria-label={label}
        x-class={[columnList]}
        onKeyDown={(e) => handleColumnKeyDown(e, kind)}
      >
        {items.map((item) => (
          <div
            key={item.key}
            role="option"
            aria-selected={item.selected}
            aria-disabled={item.disabled || undefined}
            x-class={[
              columnOption,
              item.selected && columnOptionSelected,
              item.disabled && columnOptionDisabled,
            ]}
            onClick={() => {
              if (!item.disabled) item.choose();
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );

  const hourItems = (
    use12Hours ? hour12Values(hourStep) : stepValues(23, hourStep)
  ).map((columnValue) => {
    // 12-hour columns display the clock value; commits and disabled
    // decisions run in 24-hour space using the current period.
    const hour = use12Hours ? from12Hour(columnValue, isPM) : columnValue;
    const selected =
      hasValue &&
      (use12Hours
        ? to12Hour(parts.hour) === columnValue
        : parts.hour === columnValue);
    return {
      key: `h${columnValue}`,
      label: use12Hours ? String(columnValue) : pad2(columnValue),
      selected,
      disabled: isTimeDisabled({ ...parts, hour }),
      choose: () => commitParts({ ...parts, hour }),
    };
  });

  const minuteItems = stepValues(59, minuteStep).map((minute) => ({
    key: `m${minute}`,
    label: pad2(minute),
    selected: hasValue && parts.minute === minute,
    disabled: isTimeDisabled({ ...parts, minute }),
    choose: () => commitParts({ ...parts, minute }),
  }));

  const secondItems = stepValues(59, secondStep).map((second) => ({
    key: `s${second}`,
    label: pad2(second),
    selected: hasValue && parts.second === second,
    disabled: isTimeDisabled({ ...parts, second }),
    choose: () => commitParts({ ...parts, second }),
  }));

  const periodItems = [false, true].map((pm) => {
    const hour = from12Hour(to12Hour(parts.hour), pm);
    return {
      key: pm ? 'pm' : 'am',
      label: pm ? strings.pm : strings.am,
      selected: hasValue && isPM === pm,
      disabled: isTimeDisabled({ ...parts, hour }),
      choose: () => commitParts({ ...parts, hour }),
    };
  });

  return (
    <div x-class={[wrapper, className]}>
      <input
        ref={setInputRef}
        readOnly
        style={floating.triggerStyle}
        className={trigger}
        value={value}
        placeholder={placeholder}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onPointerDown={(e) => {
          // jsdom dispatches pointer events on disabled inputs that
          // browsers swallow; keep the two behaviors aligned.
          if (e.currentTarget.disabled) return;
          floating.onTriggerPointerDown();
        }}
        onClick={(e) => {
          if (e.currentTarget.disabled) return;
          floating.onTriggerClick();
        }}
        onKeyDown={handleTriggerKeyDown}
        {...rest}
      />
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement="bottom"
        visualClass={panel}
        id={panelId}
        // Escape closes through the floating engine; the handler only
        // returns focus to the trigger for keyboard closure parity.
        onKeyDown={(e) => {
          if (e.key === 'Escape') inputRef.current?.focus();
        }}
      >
        <div x-class={[columns]}>
          {renderColumn('hour', strings.hour, hourColumnRef, hourItems)}
          {renderColumn('minute', strings.minute, minuteColumnRef, minuteItems)}
          {withSeconds &&
            renderColumn('second', strings.second, secondColumnRef, secondItems)}
          {use12Hours &&
            renderColumn('period', strings.period, periodColumnRef, periodItems)}
        </div>
        <div x-class={[footer]}>
          <button type="button" x-class={[nowButton]} onClick={chooseNow}>
            {strings.now}
          </button>
        </div>
      </FloatingPanel>
    </div>
  );
}
