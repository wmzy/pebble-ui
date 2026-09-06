import type { SetStateAction } from 'react';

import { css } from '@linaria/core';
import { useCallback, useId, useRef } from 'react';

import { FloatingPanel, useFloating } from '../../utils/floating';

import Calendar from '../Calendar/Calendar';

type DatepickerCoreProps = {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  min?: string;
  max?: string;
  locale?: string;
  weekStartsOn?: 0 | 1;
  placeholder?: string;
  className?: string;
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
    border-color 0.15s,
    box-shadow 0.15s;
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

export default function DatepickerCore({
  value,
  onChange,
  open,
  onOpenChange,
  min,
  max,
  locale,
  weekStartsOn,
  placeholder = 'Select date',
  className,
}: DatepickerCoreProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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
        ref={inputRef}
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
        <Calendar
          value={value}
          min={min}
          max={max}
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

export type { DatepickerCoreProps };
