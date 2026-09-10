import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent, ReactNode, Ref } from 'react';
import type { VirtualListHandle } from '../VirtualList';

import type { SelectEntryData, SelectOptionData } from './select-options';

import { css } from '@linaria/core';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { mergeRefs } from '../../utils/refs';
import Chip from '../Chip/Chip';
import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';
import Spinner from '../Spinner/Spinner';
import { VirtualList } from '../VirtualList';

import { filterSelectEntries, flattenSelectEntries, selectOptionText } from './select-options';

/** Metrics override for the `virtualized` option list of the floating
 * Select paths (multiple, or single with `searchable`). */
type SelectVirtualizedConfig = {
  /**
   * Row height in px of one option row. Defaults to 29 — the measured
   * natural box of an option row: space-1 padding top+bottom (4+4) plus
   * the taller of the text-sm line box (21px at leading-normal) and the
   * 1.125rem visual checkbox (18px). Virtualization math needs it as a
   * JS number; rows are stretched to fill it (`virtualRow`), so the two
   * cannot drift apart.
   */
  itemHeight?: number;
  /** Extra rows kept mounted above/below the visible window. Defaults
   * to VirtualList's 5. */
  overscan?: number;
};

type SelectFloatingProps = {
  /**
   * Current selection — `string[]` in multiple mode, `string` in single
   * mode. A stray value of the other shape is normalized (empty
   * selection / empty value) rather than crashing.
   */
  value: string | string[];
  /**
   * Notifies the next value: `string[]` in multiple mode, `string` in
   * single mode — the single-mode option pick also closes the panel.
   */
  onChange: (value: string | string[]) => void;
  /** Extracted <Option>/<option>/<OptionGroup> children of the owning
   * Select, grouping structure preserved. */
  entries: SelectEntryData[];
  /** Multiple selection mode: chips in the trigger, toggling options,
   * panel stays open across picks. Single mode closes on pick. */
  multiple: boolean;
  /** Falls back to the `select.placeholder` locale string. */
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Render a search input at the top of the panel that filters the
   * options (case-insensitive substring over the label text). Typing
   * filters and auto-highlights the first match; ↑/↓ move the
   * highlight, Enter picks it, Escape closes. The input is focused
   * when the panel opens.
   */
  searchable?: boolean;
  /**
   * Show a pointer-only × clear affordance at the trigger's inline end
   * while a value is selected (revealed on hover/focus-within).
   * Clicking it empties the value (`[]` / `''`) without toggling the
   * panel and keeps focus on the trigger. Keyboard parity: Backspace on
   * the single-mode trigger clears the value; multiple mode keeps
   * Backspace removing the last chip.
   */
  clearable?: boolean;
  /**
   * Async option state: the options area shows a Spinner with
   * `aria-busy="true"` on the panel instead of the list, and search
   * filtering is skipped (an empty result while loading would be a
   * lie). Keyboard navigation is inert until loading finishes.
   */
  loading?: boolean;
  /**
   * Multiple mode only: render at most this many chips; the rest
   * collapse into a `+N` badge whose `title` tooltip lists the
   * overflow labels. Selection semantics are unchanged — the badge is
   * presentational.
   */
  maxTagCount?: number;
  /**
   * Render the options list through VirtualList so thousand-option
   * listboxes mount only the visible window (plus overscan) instead of
   * the full DOM list. `false`/omitted (default) keeps the plain DOM
   * path byte-for-byte; an object additionally customizes row metrics.
   */
  virtualized?: boolean | SelectVirtualizedConfig;
  className?: string;
  /** Forwarded to the trigger `<button>` element. */
  ref?: Ref<HTMLButtonElement>;
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

/** The single-mode trigger's selected label — same clipping contract as
 * the placeholder, plus min-width so it can shrink inside the flex
 * trigger and ellipsize instead of stretching it. */
const triggerLabel = css`
  min-width: 0;
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

/**
 * The `+N` overflow badge of `maxTagCount`: presentational (selection
 * lives in the value, removal through the panel/Backspace), with the
 * full overflow label list in the native `title` tooltip.
 */
const overflowBadge = css`
  display: inline-flex;
  align-items: center;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  line-height: 1;
  white-space: nowrap;
  padding: var(--haze-space-1) var(--haze-space-2);
  cursor: default;
`;

/**
 * Pointer-only clear affordance (same nested-interactive rationale as
 * `chipRemove`). Revealed on trigger hover/focus-within through the
 * `[data-clearable]` ancestor selector (the `[role='option']:hover &`
 * pattern from the option rows); hidden otherwise — `visibility` +
 * `pointer-events` keep the invisible affordance from eating clicks
 * aimed at the caret. The solid background chip masks the painted caret
 * slot it occupies, on both the floating trigger and the native-select
 * overlay in SelectCore.
 */
const clearBtn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg);
  color: var(--haze-color-text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--haze-duration-fast);

  [data-clearable]:hover &,
  [data-clearable]:focus-within & {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  &:hover {
    color: var(--haze-color-text);
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

/**
 * Virtualized panel: same chrome, no scroll box — the VirtualList
 * scrollport owns scrolling. Keeping the plain class untouched avoids a
 * nested scroll container that could grow a second scrollbar (the same
 * trade-off as Combobox's listboxVirtual).
 */
const listboxVirtual = css`
  box-sizing: border-box;
  min-width: 100%;
  min-width: anchor-size(width);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);
`;

/**
 * Searchable panel chrome: the panel itself stays a plain container (a
 * `display` declaration here would override the UA sheet's
 * `[popover]:not(:popover-open) { display: none }` and paint the closed
 * popover into the document flow) — the search input and the inner
 * listbox stack as plain block flow inside the padding.
 */
const panelSearch = css`
  box-sizing: border-box;
  min-width: 100%;
  min-width: anchor-size(width);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);
  padding: var(--haze-space-2);
`;

/** Scroll box of the searchable list — the plain listbox's `max-height`
 * cap re-applied to the inner element that now owns scrolling. */
const listboxInner = css`
  max-height: 200px;
  overflow-y: auto;
`;

/** Search input heading the searchable panel. */
const searchInput = css`
  display: block;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  padding: var(--haze-space-1) var(--haze-space-2);
  margin-block-end: var(--haze-space-2);

  &:focus {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

/** Loading state of the options area — Spinner plus copy, centered. */
const loadingBlock = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-3);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
`;

/** Empty-search state of the options area. */
const emptyBlock = css`
  padding: var(--haze-space-3);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  text-align: center;
`;

/** Group heading typography (shared by the plain row and the sticky
 * virtualized header). */
const groupLabelText = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text-muted);
`;

/** Plain-path group heading row: typography plus the option-row inset. */
const groupLabelRow = css`
  padding: var(--haze-space-1) var(--haze-space-3);
`;

/** Scrollport height of the virtualized list — the plain listbox's
 * `max-height` cap, so both modes cap out equally tall; shorter lists
 * size to their rows through `Math.min` at the call site. */
const LISTBOX_MAX_HEIGHT = 200;

/** Fixed row height for the virtualized path: the natural option-row
 * box — space-1 padding top+bottom (4+4) plus max(text-sm line box at
 * leading-normal 21, checkbox 1.125rem = 18) = 29. Rows are stretched
 * to fill it (`virtualRow`), so the two cannot drift apart. */
const OPTION_ROW_HEIGHT = 29;

/** Stretch a virtualized option over its absolutely-positioned,
 * fixed-height row wrapper so hover/highlight cover the full row. */
const virtualRow = css`
  height: 100%;
  box-sizing: border-box;
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

/** Single-mode selected option: the multiple mode shows its visual
 * checkbox instead — one selectedness cue per mode, never both. */
const optionSelected = css`
  color: var(--haze-color-primary);
  font-weight: var(--haze-weight-medium);
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

export default function SelectFloating({
  value,
  onChange,
  entries,
  multiple,
  placeholder,
  searchable = false,
  clearable = false,
  loading = false,
  maxTagCount,
  size = 'md',
  virtualized,
  className,
  ref,
  ...rest
}: SelectFloatingProps) {
  const strings = useStrings('select');
  const selected = multiple && Array.isArray(value) ? value : [];
  const selectedValue = !multiple && typeof value === 'string' ? value : '';
  // Panel visibility stays internal to the trigger — the pointer-safe
  // open path lives in floating's onTriggerPointerDown/onTriggerClick.
  const [open, setOpen] = useControl(undefined, false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // The search query is internal UI state (never a prop), so useState
  // is the correct primitive here, not useControl.
  const [query, setQuery] = useState('');
  const [prevQuery, setPrevQuery] = useState(query);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  // The consumer's ref rides the same trigger button the floating
  // behavior anchors on.
  const setTriggerRef = useCallback(
    (node: HTMLButtonElement | null) => mergeRefs(triggerRef, ref)(node),
    [triggerRef, ref]
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const activeOptionRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VirtualListHandle>(null);

  // `virtualized` resolution: object config enables and customizes,
  // `true` enables with defaults, anything else keeps the plain DOM.
  const virtual = virtualized !== undefined && virtualized !== false;
  const virtualConfig = typeof virtualized === 'object' ? virtualized : undefined;
  const rowHeight = virtualConfig?.itemHeight ?? OPTION_ROW_HEIGHT;
  const overscan = virtualConfig?.overscan;

  const floating = useFloating({
    open,
    setOpen,
    triggerRef,
    panelRef,
    animated: true,
  });

  const allOptions = flattenSelectEntries(entries);
  // While loading the options area shows a Spinner — no filtering runs
  // (an empty pass would claim "no matches" about options we simply
  // have not received yet) and keyboard navigation is inert.
  const visibleEntries = loading ? [] : filterSelectEntries(entries, query);
  const visibleOptions = flattenSelectEntries(visibleEntries);

  // Flat index at which each entry's options begin — the bridge between
  // the grouped render structure and the flat keyboard/aria order.
  const entryOffsets = visibleEntries.reduce<{ offsets: number[]; flat: number }>(
    (acc, entry) => ({
      offsets: [...acc.offsets, acc.flat],
      flat: acc.flat + (entry.kind === 'group' ? entry.options.length : 1),
    }),
    { offsets: [], flat: 0 }
  ).offsets;

  // Stable, SSR-safe DOM id per option row (Combobox's scheme): the
  // trigger's aria-activedescendant points here so screen readers
  // announce the keyboard highlight on rows that never receive focus.
  const optionId = (index: number) => `${id}-option-${index}`;

  // Only while the popup is open — a closed listbox must not own the
  // trigger's active descendant. No (or out-of-range) highlight omits
  // the attribute entirely.
  const activeDescendant =
    open && visibleOptions[activeIndex] ? optionId(activeIndex) : undefined;

  // The searchable panel hosts the listbox one level down (the search
  // input must not sit inside a listbox), so the trigger's
  // aria-controls targets the inner element there.
  const listboxId = `${id}-listbox`;

  // Keep the highlighted row visible as it moves. Gated on `shown`, not
  // `open`: scrollTop set on a still-hidden popover is clamped away and
  // lost (the same contract as Combobox's virtualized scroll effect).
  // Virtualized mode drives the window through scrollToIndex (rows
  // outside the window are not mounted, so scrollIntoView has no target);
  // jsdom ships no scrollIntoView, hence the typeof guard on the plain
  // path.
  useEffect(() => {
    if (!floating.shown || activeIndex < 0) return;
    if (virtual) {
      listRef.current?.scrollToIndex(activeIndex, 'auto');
      return;
    }
    const row = activeOptionRef.current;
    if (row && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ block: 'nearest' });
    }
  }, [floating.shown, activeIndex, virtual]);

  // Focus lands in the panel's search input whenever the searchable
  // popup is actually shown (gated on `shown` — focus on a still-hidden
  // popover is silently dropped by real engines), so typing filters
  // straight away.
  useEffect(() => {
    if (searchable && open && floating.shown) {
      searchRef.current?.focus();
    }
  }, [searchable, open, floating.shown]);

  // A closed panel starts the next open with a fresh query — a stale
  // filter surviving close/reopen would hide the very value the user
  // just picked. Adjusted during render (the same React-endorsed reset
  // as the highlight below) instead of an effect, per the repo's
  // set-state-in-effect lint posture.
  if (!open && query !== '') {
    setQuery('');
  }

  // Typing a new query invalidates the highlight — adjust during render
  // (React-endorsed reset) so the first filtered frame already carries
  // the auto-highlight of the first match (MUI Autocomplete behavior:
  // Enter right after typing picks it without an arrow press first).
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(visibleOptions.length > 0 ? 0 : -1);
  }

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
    allOptions.find((o) => o.value === optionValue)?.label ?? optionValue;

  const clearValue = () => {
    onChange(multiple ? [] : '');
  };

  /** Pick one option: multiple toggles and keeps the panel open, single
   * commits the value, closes the panel and returns focus to the
   * trigger. */
  const choose = (optionValue: string) => {
    if (multiple) {
      toggleOption(optionValue);
      return;
    }
    onChange(optionValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveActive = (delta: 1 | -1) => {
    setActiveIndex((i) =>
      delta === 1 ? Math.min(i + 1, visibleOptions.length - 1) : Math.max(i - 1, 0)
    );
  };

  const jumpActive = (key: 'Home' | 'End') => {
    setActiveIndex(
      visibleOptions.length === 0 ? -1 : key === 'Home' ? 0 : visibleOptions.length - 1
    );
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    // No typeahead on the trigger: options are also reachable by
    // scrolling the open panel, and searchable mode types into the
    // panel's search input — the single-mode native select keeps its
    // own typeahead.
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Arrows double as the keyboard open path from the closed state.
      setOpen(true);
      moveActive(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setOpen(true);
      jumpActive(e.key);
    } else if (
      // Space arrives as ' ' from real browsers; user-event's {Space}
      // reports the legacy 'Space' key name — accept both.
      (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') &&
      open &&
      visibleOptions[activeIndex]
    ) {
      // Suppress the button's native activation, or the follow-up click
      // would run onTriggerClick and close the panel mid-selection.
      // With no highlight (fresh open), fall through to the click path
      // so Enter/Space keep toggling the panel like any button.
      e.preventDefault();
      choose(visibleOptions[activeIndex].value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace') {
      // Keyboard parity for the pointer-only affordances: multiple
      // drops the most recently selected chip, single (clearable)
      // empties the value — see chipRemove/clearBtn.
      if (multiple && selected.length > 0) {
        e.preventDefault();
        onChange(selected.slice(0, -1));
      } else if (!multiple && clearable && selectedValue !== '') {
        e.preventDefault();
        clearValue();
      }
    }
  };

  // The panel search input owns focus while the searchable popup is
  // open, so it drives the same navigation: arrows move the highlight
  // (caret motion suppressed), Enter picks, Escape closes and returns
  // focus to the trigger. Plain typing filters through onChange.
  const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      jumpActive(e.key);
    } else if (e.key === 'Enter') {
      // Always suppressed while the popup is open — an unhandled Enter
      // in the input would submit an enclosing form.
      e.preventDefault();
      if (visibleOptions[activeIndex]) {
        choose(visibleOptions[activeIndex].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  // One option row, shared by the plain list and the virtualized
  // renderItem so both paths stay in lockstep (aria ids, set semantics,
  // active styling, choosing). `i` is the flat index across groups —
  // the same coordinate aria-activedescendant and the keyboard use.
  const renderOption = (option: SelectOptionData, i: number) => {
    const isSelected = multiple
      ? selected.includes(option.value)
      : option.value === selectedValue;
    return (
      <div
        key={option.value}
        ref={i === activeIndex ? activeOptionRef : undefined}
        role='option'
        id={optionId(i)}
        aria-selected={isSelected}
        aria-setsize={visibleOptions.length}
        aria-posinset={i + 1}
        x-class={[
          optionRow,
          i === activeIndex && optionActive,
          !multiple && isSelected && optionSelected,
          virtual && virtualRow,
        ]}
        onClick={() => choose(option.value)}
      >
        {multiple && (
          <span
            aria-hidden='true'
            x-class={[checkboxVisual, isSelected && checkboxChecked]}
          />
        )}
        {option.label}
      </div>
    );
  };

  const showClear = clearable && (multiple ? selected.length > 0 : selectedValue !== '');

  const clearAffordance = showClear ? (
    <span
      aria-hidden='true'
      title={strings.clear}
      x-class={clearBtn}
      onClick={(e) => {
        // Keep the trigger's open toggle out of this click — clearing
        // must not flip the panel either way (the pointerdown above
        // already reached the floating handlers for race attribution,
        // so an open panel stays open and a closed one stays closed).
        e.stopPropagation();
        clearValue();
        triggerRef.current?.focus();
      }}
    >
      ×
    </span>
  ) : undefined;

  const triggerBody = multiple ? (
    selected.length === 0 ? (
      <span x-class={placeholderText}>
        {placeholder ?? strings.placeholder}
      </span>
    ) : (
      <>
        {(maxTagCount === undefined
          ? selected
          : selected.slice(0, Math.max(maxTagCount, 0))
        ).map((v) => (
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
        ))}
        {maxTagCount !== undefined && selected.length > Math.max(maxTagCount, 0) && (
          <span
            x-class={overflowBadge}
            title={selected
              .slice(Math.max(maxTagCount, 0))
              .map((v) => selectOptionText(labelFor(v)))
              .join(', ')}
          >
            {formatString(strings.moreTags, {
              count: selected.length - Math.max(maxTagCount, 0),
            })}
          </span>
        )}
      </>
    )
  ) : selectedValue === '' ? (
    <span x-class={placeholderText}>{placeholder ?? strings.placeholder}</span>
  ) : (
    <span x-class={triggerLabel}>{labelFor(selectedValue)}</span>
  );

  // The options area of the panel. An empty visible list (loading, or a
  // query without matches) renders a state block instead of the
  // listbox: an option-less element wearing role="listbox" is an axe
  // aria-required-children violation, and while loading the Spinner's
  // role="status" announces the state on its own.
  const hasVisibleOptions = !loading && visibleOptions.length > 0;

  const optionsList = virtual ? (
    <VirtualList
      ref={listRef}
      data-virtualized
      items={visibleOptions}
      groups={
        visibleEntries.some((entry) => entry.kind === 'group')
          ? visibleEntries.flatMap((entry, ei) =>
              entry.kind === 'group'
                ? [
                    {
                      startIndex: entryOffsets[ei] ?? 0,
                      key: `group-${entry.label}-${entryOffsets[ei] ?? 0}`,
                      render: () => (
                        <div x-class={groupLabelText}>{entry.label}</div>
                      ),
                    },
                  ]
                : []
            )
          : undefined
      }
      height={Math.min(LISTBOX_MAX_HEIGHT, visibleOptions.length * rowHeight)}
      itemHeight={rowHeight}
      overscan={overscan}
      renderItem={renderOption}
    />
  ) : (
    visibleEntries.map((entry, ei) => {
      const base = entryOffsets[ei] ?? 0;
      if (entry.kind === 'option') {
        return renderOption(entry.option, base);
      }
      return (
        <div key={`group-${entry.label}`} role='group' aria-label={entry.label}>
          <div x-class={[groupLabelRow, groupLabelText]}>{entry.label}</div>
          {entry.options.map((option, i) => renderOption(option, base + i))}
        </div>
      );
    })
  );

  const listboxBody = loading ? (
    <div x-class={loadingBlock}>
      <Spinner size='sm' />
      <span>{strings.loading}</span>
    </div>
  ) : (
    <div x-class={emptyBlock}>{strings.noMatch}</div>
  );

  return (
    <div x-class={wrapper}>
      <button
        // Spread first — the floating handlers below must win over a
        // spread, or a stray onClick could disable the open toggle
        // entirely (same rationale as SelectCore's onChange ordering).
        {...rest}
        ref={setTriggerRef}
        type='button'
        style={floating.triggerStyle}
        role='combobox'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={searchable ? listboxId : id}
        aria-activedescendant={activeDescendant}
        data-clearable={clearable || undefined}
        onPointerDown={floating.onTriggerPointerDown}
        onClick={floating.onTriggerClick}
        onKeyDown={handleKeyDown}
        x-class={[trigger, sizes[size], className]}
      >
        {triggerBody}
        {clearAffordance}
        <span x-class={caret} aria-hidden='true'>
          <ChevronDown />
        </span>
      </button>
      {searchable ? (
        <FloatingPanel
          ref={panelRef}
          behavior={floating}
          placement='bottom-span'
          aria-busy={loading || undefined}
          visualClass={panelSearch}
        >
          <input
            ref={searchRef}
            type='text'
            aria-label={strings.searchLabel}
            placeholder={strings.searchPlaceholder}
            // aria-controls/aria-autocomplete reference the listbox
            // element, which only renders while options are visible —
            // dangling ids (loading, no-match) are axe violations.
            {...(hasVisibleOptions && {
              'aria-controls': listboxId,
              'aria-autocomplete': 'list' as const,
            })}
            aria-activedescendant={activeDescendant}
            x-class={searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {hasVisibleOptions ? (
            <div
              id={listboxId}
              role='listbox'
              aria-multiselectable={multiple || undefined}
              aria-label={strings.listboxLabel}
              x-class={virtual ? undefined : listboxInner}
            >
              {optionsList}
            </div>
          ) : (
            listboxBody
          )}
        </FloatingPanel>
      ) : (
        <FloatingPanel
          ref={panelRef}
          behavior={floating}
          placement='bottom-span'
          id={id}
          role={hasVisibleOptions ? 'listbox' : undefined}
          aria-multiselectable={hasVisibleOptions && multiple ? 'true' : undefined}
          aria-label={strings.listboxLabel}
          aria-busy={loading || undefined}
          visualClass={virtual ? listboxVirtual : listbox}
        >
          {hasVisibleOptions ? optionsList : listboxBody}
        </FloatingPanel>
      )}
    </div>
  );
}

export type { SelectFloatingProps, SelectVirtualizedConfig };
