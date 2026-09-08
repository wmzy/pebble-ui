import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';

import type { SelectOptionData } from './select-options';

import { css } from '@linaria/core';
import { useEffect, useId, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { FloatingPanel, useFloating } from '../../utils/floating';
import Chip from '../Chip/Chip';
import { useStrings } from '../LocaleProvider';


type SelectMultipleProps = {
  /**
   * Current selection — `string[]` per the multiple contract. A stray
   * string is normalized to an empty selection rather than crashing.
   */
  value: string | string[];
  /** Notifies the next selection array on every toggle or chip removal. */
  onChange: (value: string[]) => void;
  /** Flattened <Option>/<option> children of the owning Select. */
  options: SelectOptionData[];
  /** Falls back to the `select.placeholder` locale string. */
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /**
   * Native passthrough re-hosted on the button trigger. The owning
   * SelectCore forwards its select-typed rest here — only the
   * element-generic event handler types differ between the two
   * attribute sets, so the widening happens at that boundary.
   */
} & Omit<
  ComponentPropsWithoutRef<'button'>,
  'value' | 'onChange' | 'size' | 'type' | 'children'
>;

const wrapper = css`
  position: relative;
  display: inline-block;
  width: 100%;
`;

const trigger = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--haze-space-1);
  width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  line-height: var(--haze-leading-normal);
  appearance: none;
  text-align: start;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &:hover {
    border-color: var(--haze-color-border-hover);
  }

  &:focus {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const sizes = {
  sm: css`
    padding: var(--haze-space-1) var(--haze-space-2);
    font-size: var(--haze-text-sm);
  `,
  md: css`
    padding: var(--haze-space-2) var(--haze-space-3);
    font-size: var(--haze-text-sm);
  `,
  lg: css`
    padding: var(--haze-space-3) var(--haze-space-4);
    font-size: var(--haze-text-base);
  `,
} as const;

const placeholderText = css`
  color: var(--haze-color-text-muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

/** One selected value: the Chip capsule plus its pointer-only remove ×. */
const chipItem = css`
  display: inline-flex;
  align-items: center;
`;

/**
 * Pointer-only remove affordance. A real button here would nest
 * interactive controls inside the trigger button — invalid HTML, an axe
 * `nested-interactive` violation, and a screen-reader mess. The span is
 * aria-hidden and unreachable by Tab on purpose: keyboard users remove
 * values with Backspace on the trigger or by toggling the option in the
 * listbox (the same trade-off Ant Design's multiple select makes).
 */
const chipRemove = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  border-radius: var(--haze-radius-full);
  background: transparent;
  color: var(--haze-color-text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  margin-inline-start: var(--haze-space-1);
  opacity: 0.6;
  transition: opacity var(--haze-duration-fast);

  &:hover {
    opacity: 1;
  }
`;

const caret = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-inline-start: auto;
  color: var(--haze-color-text-muted);
  pointer-events: none;
`;

/**
 * Same chrome contract as Combobox's listbox: the `min-width` cascade
 * re-pins the panel to the trigger's width on the anchored tier (where
 * `100%` would resolve against the viewport-wide position-area region)
 * and drops as invalid on engines without anchor positioning, leaving
 * the fallback — the trigger-width wrapper — intact.
 */
const listbox = css`
  box-sizing: border-box;
  min-width: 100%;
  min-width: anchor-size(width);
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);
`;

const optionRow = css`
  display: flex;
  align-items: center;
  padding: var(--haze-space-1) var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  cursor: pointer;

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }
`;

const optionActive = css`
  background: var(--haze-color-bg-subtle);
`;

/**
 * Purely visual checkbox in front of each option, mirroring
 * CheckboxCore's look token for token. It cannot be a real input: a
 * focusable control inside the interactive option row is an axe
 * `no-focusable-content` violation (negative tabindex and aria-hidden
 * do not exempt it), so selection semantics live on the option row
 * alone — the trigger owns focus, Enter/Space toggle the highlighted
 * option.
 */
const checkboxVisual = css`
  display: inline-block;
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  box-sizing: border-box;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  background: var(--haze-color-bg);
  position: relative;
  transition:
    background var(--haze-duration-fast),
    border-color var(--haze-duration-fast);

  [role='option']:hover & {
    border-color: var(--haze-color-border-hover);
  }

  &::after {
    content: '';
    position: absolute;
    display: none;
    top: 2px;
    /* physical: the checkmark is drawn from physical borders +
       rotate(45) and stays unmirrored under RTL by industry convention
       (same primitive as CheckboxCore). */
    left: 5px;
    width: 5px;
    height: 9px;
    border: solid var(--haze-color-text-inverse);
    /* physical: drawing primitive of the same unmirrored checkmark. */
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const checkboxChecked = css`
  background: var(--haze-color-primary);
  border-color: var(--haze-color-primary);

  &::after {
    display: block;
  }
`;

const ChevronDown = () => (
  <svg
    viewBox='0 0 12 12'
    width='12'
    height='12'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M2 4l4 4 4-4' />
  </svg>
);

export default function SelectMultiple({
  value,
  onChange,
  options,
  placeholder,
  size = 'md',
  className,
  ...rest
}: SelectMultipleProps) {
  const strings = useStrings('select');
  const selected = Array.isArray(value) ? value : [];
  // Panel visibility stays internal to the trigger — the pointer-safe
  // open path lives in floating's onTriggerPointerDown/onTriggerClick.
  const [open, setOpen] = useControl(undefined, false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeOptionRef = useRef<HTMLDivElement>(null);

  const floating = useFloating({
    open,
    setOpen,
    triggerRef,
    panelRef,
    animated: true,
  });

  // Stable, SSR-safe DOM id per option row (Combobox's scheme): the
  // trigger's aria-activedescendant points here so screen readers
  // announce the keyboard highlight on rows that never receive focus.
  const optionId = (index: number) => `${id}-option-${index}`;

  // Only while the popup is open — a closed listbox must not own the
  // trigger's active descendant. No (or out-of-range) highlight omits
  // the attribute entirely.
  const activeDescendant =
    open && options[activeIndex] ? optionId(activeIndex) : undefined;

  // Keep the highlighted row visible as it moves. Gated on `shown`, not
  // `open`: scrollTop set on a still-hidden popover is clamped away and
  // lost (the same contract as Combobox's virtualized scroll effect).
  // jsdom ships no scrollIntoView, hence the typeof guard.
  useEffect(() => {
    if (!floating.shown || activeIndex < 0) return;
    const row = activeOptionRef.current;
    if (row && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ block: 'nearest' });
    }
  }, [floating.shown, activeIndex]);

  const toggleOption = (optionValue: string) => {
    onChange(
      selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue]
    );
  };

  const removeValue = (optionValue: string) => {
    onChange(selected.filter((v) => v !== optionValue));
  };

  const labelFor = (optionValue: string): ReactNode =>
    options.find((o) => o.value === optionValue)?.label ?? optionValue;

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    // No typeahead: options are also reachable by scrolling the open
    // panel, and the single-mode native select keeps its own typeahead —
    // deliberately omitted here.
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Arrows double as the keyboard open path from the closed state.
      setOpen(true);
      setActiveIndex((i) =>
        e.key === 'ArrowDown'
          ? Math.min(i + 1, options.length - 1)
          : Math.max(i - 1, 0)
      );
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(
        options.length === 0 ? -1 : e.key === 'Home' ? 0 : options.length - 1
      );
    } else if (
      // Space arrives as ' ' from real browsers; user-event's {Space}
      // reports the legacy 'Space' key name — accept both.
      (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') &&
      open &&
      options[activeIndex]
    ) {
      // Suppress the button's native activation, or the follow-up click
      // would run onTriggerClick and close the panel mid-selection.
      // With no highlight (fresh open), fall through to the click path
      // so Enter/Space keep toggling the panel like any button.
      e.preventDefault();
      toggleOption(options[activeIndex].value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && selected.length > 0) {
      // Keyboard parity for the chips' pointer-only × (see chipRemove):
      // Backspace drops the most recently selected value.
      e.preventDefault();
      onChange(selected.slice(0, -1));
    }
  };

  return (
    <div x-class={wrapper}>
      <button
        // Spread first — the floating handlers below must win over a
        // spread, or a stray onClick could disable the open toggle
        // entirely (same rationale as SelectCore's onChange ordering).
        {...rest}
        ref={triggerRef}
        type='button'
        style={floating.triggerStyle}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={id}
        aria-activedescendant={activeDescendant}
        onPointerDown={floating.onTriggerPointerDown}
        onClick={floating.onTriggerClick}
        onKeyDown={handleKeyDown}
        x-class={[trigger, sizes[size], className]}
      >
        {selected.length === 0 ? (
          <span x-class={placeholderText}>
            {placeholder ?? strings.placeholder}
          </span>
        ) : (
          selected.map((v) => (
            <span x-class={chipItem} key={v}>
              <Chip color='primary'>{labelFor(v)}</Chip>
              <span
                aria-hidden='true'
                x-class={chipRemove}
                onClick={(e) => {
                  // Keep the trigger's open toggle out of this click —
                  // removing a chip must not close the panel.
                  e.stopPropagation();
                  removeValue(v);
                }}
              >
                ×
              </span>
            </span>
          ))
        )}
        <span x-class={caret} aria-hidden='true'>
          <ChevronDown />
        </span>
      </button>
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement='bottom-span'
        id={id}
        role='listbox'
        aria-multiselectable='true'
        // A button-triggered listbox needs its own accessible name (axe
        // `aria-input-field-name`) — combobox popups are exempt through
        // their owning input, a button's popup is not.
        aria-label={strings.listboxLabel}
        visualClass={listbox}
      >
        {options.map((option, i) => {
          const isSelected = selected.includes(option.value);
          return (
            <div
              key={option.value}
              ref={i === activeIndex ? activeOptionRef : undefined}
              role='option'
              id={optionId(i)}
              aria-selected={isSelected}
              aria-setsize={options.length}
              aria-posinset={i + 1}
              x-class={[optionRow, i === activeIndex && optionActive]}
              onClick={() => toggleOption(option.value)}
            >
              <span
                aria-hidden='true'
                x-class={[checkboxVisual, isSelected && checkboxChecked]}
              />
              {option.label}
            </div>
          );
        })}
      </FloatingPanel>
    </div>
  );
}

export type { SelectMultipleProps };
