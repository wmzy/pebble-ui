import type { ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { VirtualListHandle } from '../VirtualList';

import { css } from '@linaria/core';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { mergeRefs } from '../../utils/refs';
import Chip from '../Chip/Chip';
import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';
import Spinner from '../Spinner/Spinner';
import { VirtualList } from '../VirtualList';

import ComboboxGroup from './ComboboxGroup';
import ComboboxOption from './ComboboxOption';

/** Metrics override for the `virtualized` option list of Combobox. */
type ComboboxVirtualizedConfig = {
  /**
   * Row height in px of one option row. Defaults to 37 —
   * ComboboxOption's natural box: space-2 padding top+bottom + text-sm
   * at leading-normal = 8 + 21 + 8. Virtualization math needs it as a
   * JS number; rows are stretched to fill it (`virtualRow`), so the two
   * cannot drift apart.
   */
  itemHeight?: number;
  /** Extra rows kept mounted above/below the visible window. Defaults
   * to VirtualList's 5. */
  overscan?: number;
};

/** One entry of the `options` prop. */
type ComboboxOptionData = {
  value: string;
  label: string;
  /**
   * Optional group heading: consecutive options carrying the same
   * `group` cluster into one `ComboboxGroup` section (sticky heading,
   * `role="group"` — the cmdk shape); options without a `group` stay
   * direct listbox children. A group whose every option was filtered
   * out hides entirely.
   */
  group?: string;
};

type ComboboxProps = {
  /**
   * `string` in single mode, `string[]` when `multiple` is set. The
   * uncontrolled empty value is `''` in single mode, `[]` in multiple
   * mode.
   */
  value?: ControlOrValue<string | string[]>;
  open?: ControlOrValue<boolean>;
  options: ComboboxOptionData[];
  /**
   * Multiple-selection mode: selected values render as chips inside
   * the trigger, Enter toggles the highlighted option without closing
   * the panel, and Backspace on an empty query drops the most recently
   * selected chip.
   */
  multiple?: boolean;
  /**
   * Value callback for both modes — `string` in single mode,
   * `string[]` when `multiple` is set — fired after the value updates.
   */
  onValuesChange?: (value: string | string[]) => void;
  /**
   * Offer the current query as a creatable option: when nothing
   * matches a non-blank query, a localized `Create "…"` row renders at
   * the top of the list. Committing it calls `onCreate` and appends the
   * new value to a local option set layered on top of `options` — the
   * controlled `options` array is never mutated, and local creations
   * are dropped when the component unmounts (re-pass `options` to own
   * them permanently).
   */
  creatable?: boolean;
  /** Fired with the created query when the creatable row is committed. */
  onCreate?: (query: string) => void;
  /**
   * Remote search: while set, local query filtering is suspended — the
   * list renders exactly the `options` the consumer passes — and every
   * query transition fires this callback instead: each keystroke,
   * clearing the input, and the resets that follow a selection (the
   * empty query restores the full list). The consumer owns the options
   * end to end; pair with `loading` for the pending state. Debouncing
   * is the consumer's concern.
   */
  onSearch?: (query: string) => void;
  /**
   * Async-search pending state: the combobox input carries
   * `aria-busy` and the panel shows a spinner row instead of the
   * (stale) option list.
   */
  loading?: boolean;
  /**
   * Wrap the case-insensitive query match inside each option label in
   * a token-styled `<mark>` (first occurrence; the label stays one
   * text node otherwise). Off by default so the un-enabled rendering
   * stays byte-identical; works through the virtualized path too.
   */
  highlightMatches?: boolean;
  /**
   * Custom no-results content for the empty filtered list. Defaults to
   * the `combobox.noResults` locale string.
   */
  empty?: ReactNode;
  /**
   * Panel max height in px: caps the plain listbox's scroll box and
   * the virtualized scrollport alike. Defaults to 200 (the historical
   * cap); omitted leaves the DOM untouched.
   */
  maxHeight?: number;
  placeholder?: string;
  /**
   * Render the dropdown through VirtualList once the filtered list is
   * longer than this many options. Defaults to 100; 0 disables
   * virtualization entirely (plain DOM rendering at any length).
   */
  virtualThreshold?: number;
  /**
   * Explicit VirtualList override, bypassing `virtualThreshold`: `true`
   * (or an object) always renders the list virtually — at any length,
   * including below the threshold — while an object additionally
   * customizes row metrics; `false` never virtualizes, even past the
   * threshold. Omitted (default) keeps the threshold behavior
   * untouched.
   */
  virtualized?: boolean | ComboboxVirtualizedConfig;
  className?: string;
  /**
   * Forwarded to the combobox `<input>` — the focusable field in both
   * single and multiple mode (multiple mode's chip box wraps it but is
   * not itself the combobox) — so form bridges and
   * `ref.current.focus()` reach.
   */
  ref?: Ref<HTMLInputElement>;
};

const wrapper = css`
  position: relative;
  display: inline-block;
  width: 100%;
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

/**
 * Multiple-mode trigger: a chip box wrapping the bare search input.
 * The box owns the border/focus chrome (`:focus-within` mirrors the
 * single input's ring token for token) and the floating anchor; the
 * input inside is chromeless and grows to fill the remaining row
 * (`min-width` keeps it typeable once chips wrap).
 */
const multiBox = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--haze-space-1);
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  cursor: text;
  padding: var(--haze-space-1) var(--haze-space-2);
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &:focus-within {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

/** The bare query input inside the multiple-mode chip box. */
const multiInput = css`
  flex: 1;
  min-width: 4rem;
  border: none;
  outline: none;
  background: transparent;
  padding: var(--haze-space-1) 0;
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);

  &::placeholder {
    color: var(--haze-color-text-muted);
  }
`;

/**
 * Query-match highlight inside an option label. Only token colors —
 * the `mark` element's UA chrome (yellow/black) is fully replaced.
 */
const matchMark = css`
  background: var(--haze-color-primary-subtle);
  color: var(--haze-color-primary);
  border-radius: var(--haze-radius-sm);
  padding: 0;
`;

/**
 * Loading spinner row / no-results row. Rendered as an aria-disabled
 * option so the listbox's owned-element contract stays satisfied while
 * nothing is actually selectable (PromptInput's pattern).
 */
const stateRow = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-2) var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  cursor: default;
`;

/**
 * Group-heading text for the virtualized path — VirtualList's sticky
 * header wrapper supplies the chrome (background, border, padding);
 * this mirrors the plain path's heading text style.
 */
const groupHeadingText = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

/**
 * The fallback/absolute tier keeps the panel as wide as the input via
 * `min-width: 100%` (its containing block is the input-width wrapper).
 * On the anchored tier the containing block is the viewport-wide
 * position-area region, so `100%` there inflates the panel to the whole
 * region — the second declaration re-pins it to the trigger's width and
 * simply drops as invalid on engines without anchor positioning,
 * leaving the fallback intact. `border-box` makes the re-pin match the
 * trigger's border-box width exactly (content-box would add the panel's
 * own border+padding on top of the anchor size).
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
 * nested scroll container that could grow a second scrollbar under a
 * border-box consumer (2px of panel border would overflow the cap).
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

/** Scrollport height of the virtualized list — the plain listbox's
 * `max-height` cap, so both modes are equally tall at the limit;
 * shorter lists size to their rows (min at the call site), matching the
 * non-virtualized content-driven height. */
const VIRTUAL_LIST_HEIGHT = 200;

/** Fixed row height for the virtualized path: ComboboxOption's natural
 * box — space-2 padding top+bottom + text-sm at leading-normal =
 * 8 + 21 + 8. Virtualization math needs it as a JS number; rows are
 * stretched to fill it (`virtualRow`), so the two cannot drift apart. */
const OPTION_ROW_HEIGHT = 37;

/** Stretch a virtualized option over its absolutely-positioned,
 * fixed-height row wrapper so hover/highlight cover the full row. */
const virtualRow = css`
  height: 100%;
  box-sizing: border-box;
`;

/**
 * Wraps the first case-insensitive occurrence of `query` inside
 * `label` with a token-styled `<mark>`. An empty query or a miss
 * returns the label verbatim — the un-highlighted DOM stays
 * byte-identical to the historical plain-text children.
 */
function highlightLabel(label: string, query: string): ReactNode {
  if (query === '') return label;
  const index = label.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return label;
  return (
    <>
      {label.slice(0, index)}
      <mark x-class={[matchMark]}>{label.slice(index, index + query.length)}</mark>
      {label.slice(index + query.length)}
    </>
  );
}

/** One flat option row plus its index in the navigable item list. */
type IndexedOption = { option: ComboboxOptionData; index: number };

/** A labelled group section, or a run of groupless direct rows. */
type OptionSection = {
  key: string;
  label: string | undefined;
  rows: IndexedOption[];
};

export default function Combobox({
  value: valueControl,
  open: openControl,
  options,
  multiple = false,
  onValuesChange,
  creatable = false,
  onCreate,
  onSearch,
  loading = false,
  empty,
  highlightMatches = false,
  maxHeight,
  placeholder,
  virtualThreshold = 100,
  virtualized: virtualizedProp,
  className,
  ref,
}: ComboboxProps) {
  const strings = useStrings('combobox');
  const [value, setValue] = useControl(valueControl, multiple ? [] : '');
  // Locally created options (creatable) layered on top of `options` —
  // see the `creatable` prop doc for the lifetime contract.
  const [created, setCreated] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useControl(openControl, false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [prevQuery, setPrevQuery] = useState(query);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // The consumer's ref rides the same combobox input the floating
  // behavior anchors on (the focusable field in both modes).
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(inputRef, ref)(node),
    [inputRef, ref]
  );
  const boxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VirtualListHandle>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  const floating = useFloating({
    open,
    setOpen,
    // The multiple-mode chip box anchors the panel (its width, not the
    // shrunken input's); single mode anchors the input itself.
    triggerRef: multiple ? boxRef : inputRef,
    panelRef,
    animated: true,
  });

  // In multiple mode the selection is the array value; single mode
  // compares against the string value directly.
  const selected = Array.isArray(value) ? value : [];

  // Creatable appends live until unmount — `options` itself is never
  // mutated (it is a controlled prop), and additions dedupe against it
  // by value.
  const effectiveOptions = useMemo(() => {
    if (created.length === 0) return options;
    const existing = new Set(options.map((o) => o.value));
    const additions = created
      .filter((v) => !existing.has(v))
      .map((v) => ({ value: v, label: v }));
    return additions.length > 0 ? [...options, ...additions] : options;
  }, [options, created]);

  // Remote mode (onSearch set) never filters locally — the visible
  // list is exactly the consumer's current options, refetched per
  // query. Creatable's local layering still applies on top.
  const filtered = onSearch
    ? effectiveOptions
    : effectiveOptions.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      );

  // Creatable row: offered only when nothing matches a non-blank query
  // (an exact label match is itself an `includes` match, so it suppresses
  // the row). It leads the navigable list, so keyboard and aria-set
  // semantics treat it as a regular option.
  const showCreateItem =
    creatable && !loading && query.trim() !== '' && filtered.length === 0;
  const trimmedQuery = query.trim();
  const createText = formatString(strings.create, { query: trimmedQuery });
  const listItems: ComboboxOptionData[] = showCreateItem
    ? [{ value: trimmedQuery, label: trimmedQuery }, ...filtered]
    : filtered;

  // Explicit `virtualized` override: object config enables at any
  // length and customizes metrics, `true` enables with defaults,
  // `false` disables outright. Omitted keeps the threshold behavior
  // (byte-identical to the historical rendering path).
  const virtualConfig =
    typeof virtualizedProp === 'object' ? virtualizedProp : undefined;
  const forced =
    virtualizedProp === undefined ? undefined : !!virtualizedProp;
  const virtualized =
    forced ?? (virtualThreshold > 0 && listItems.length > virtualThreshold);
  const rowHeight = virtualConfig?.itemHeight ?? OPTION_ROW_HEIGHT;
  const overscan = virtualConfig?.overscan;

  // Stable, SSR-safe DOM id per option row: listbox id + index, both
  // deterministic across renders and re-opens (no random values). The
  // input's aria-activedescendant points here so screen readers announce
  // the keyboard highlight on options that never receive DOM focus.
  const optionId = (index: number) => `${id}-option-${index}`;

  // Only while the popup is open — a closed listbox must not own the
  // input's active descendant, even though the highlight itself persists
  // for reopen recovery. No highlight (or an out-of-range one after the
  // option list shrank) omits the attribute entirely.
  const activeDescendant =
    open && listItems[highlightIndex] ? optionId(highlightIndex) : undefined;

  // Cluster the flat item list into sections: consecutive items sharing
  // a `group` label fall under one heading; groupless items stay direct
  // listbox children. Keyboard order stays the flat order, so arrows
  // cross group boundaries continuously.
  const sections: OptionSection[] = [];
  for (let i = 0; i < listItems.length; i++) {
    const option = listItems[i];
    if (option === undefined) continue;
    const prev = sections[sections.length - 1];
    if (option.group !== undefined && prev?.label === option.group) {
      prev.rows.push({ option, index: i });
      continue;
    }
    sections.push(
      option.group === undefined
        ? { key: `row-${option.value}`, label: undefined, rows: [{ option, index: i }] }
        : {
            key: `group-${option.group}`,
            label: option.group,
            rows: [{ option, index: i }],
          }
    );
  }
  const hasGroups = sections.some((s) => s.label !== undefined);

  // The highlighted row must stay visible whenever it moves (keyboard
  // navigation) and whenever the panel (re)opens with a live highlight —
  // 'auto' alignment is a no-op for rows already on screen. Gated on
  // `shown`, not `open`: this child effect runs before the behavior
  // effect calls showPopover(), and scrollTop set on a still-hidden
  // popover is clamped away and lost. Virtualized mode drives the
  // window through scrollToIndex (rows outside the window are not
  // mounted, so scrollIntoView has no target); jsdom ships no
  // scrollIntoView, hence the typeof guard on the plain path.
  useEffect(() => {
    if (!floating.shown || highlightIndex < 0) return;
    if (virtualized) {
      listRef.current?.scrollToIndex(highlightIndex, 'auto');
      return;
    }
    const row = activeRowRef.current;
    if (row && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ block: 'nearest' });
    }
  }, [virtualized, floating.shown, highlightIndex]);

  // Remote-search report (Toast's latest-ref pattern: an inline arrow
  // has a fresh identity every parent render, so the callback rides a
  // ref and the report effect keys on the query alone). Fires once per
  // actual query transition — every keystroke, clearing the input, and
  // the resets that follow a selection (query '' in multiple mode, the
  // picked label in single mode) — including empty queries, which the
  // consumer uses to restore the full list. Never fires on mount.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  const reportedQueryRef = useRef(query);
  useEffect(() => {
    if (reportedQueryRef.current === query) return;
    reportedQueryRef.current = query;
    onSearchRef.current?.(query);
  }, [query]);

  // Typing a new query invalidates the highlight — adjust during render
  // (React-endorsed reset) so the first filtered frame already drops any
  // stale highlight, without an extra effect pass.
  if (query !== prevQuery) {
    setPrevQuery(query);
    setHighlightIndex(-1);
  }

  const isSelected = (val: string) =>
    multiple ? selected.includes(val) : value === val;

  const labelFor = (optionValue: string): ReactNode =>
    effectiveOptions.find((o) => o.value === optionValue)?.label ??
    optionValue;

  const selectOption = (val: string, labelOverride?: string) => {
    const label =
      labelOverride ??
      effectiveOptions.find((o) => o.value === val)?.label ??
      val;
    if (multiple) {
      // Toggle in place; the panel stays open for the next pick and the
      // query clears so the full list is reachable again.
      const next = selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val];
      setValue(next);
      onValuesChange?.(next);
      setQuery('');
    } else {
      setValue(val);
      onValuesChange?.(val);
      setQuery(label);
      setOpen(false);
    }
    inputRef.current?.focus();
  };

  const commitCreate = () => {
    onCreate?.(trimmedQuery);
    setCreated((prev) =>
      prev.includes(trimmedQuery) ? prev : [...prev, trimmedQuery]
    );
    selectOption(trimmedQuery, trimmedQuery);
  };

  // Click and Enter funnel through one path: the create row commits a
  // creation; anything else selects/toggles the option.
  const handleSelect = (val: string) => {
    if (showCreateItem && val === trimmedQuery) {
      commitCreate();
      return;
    }
    selectOption(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Arrows are also the keyboard open path — focus alone no longer
      // opens the list (see the trigger comment).
      setOpen(true);
      setHighlightIndex((i) => Math.min(i + 1, listItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (
      e.key === 'Enter' &&
      highlightIndex >= 0 &&
      listItems[highlightIndex]
    ) {
      e.preventDefault();
      handleSelect(listItems[highlightIndex].value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (
      // Keyboard parity for the chips' pointer ×: Backspace on an empty
      // query drops the most recently selected value.
      e.key === 'Backspace' &&
      multiple &&
      query === '' &&
      selected.length > 0
    ) {
      e.preventDefault();
      const next = selected.slice(0, -1);
      setValue(next);
      onValuesChange?.(next);
    }
  };

  // One option row, shared by the plain sections and the virtualized
  // renderItem so both paths stay in lockstep (aria ids, set semantics,
  // highlight, matching-mark children).
  const renderRow = (o: ComboboxOptionData, i: number, virtual: boolean) => (
    <ComboboxOption
      key={o.value}
      ref={!virtual && i === highlightIndex ? activeRowRef : undefined}
      value={o.value}
      id={optionId(i)}
      setSize={listItems.length}
      posInSet={i + 1}
      highlighted={i === highlightIndex}
      selected={isSelected(o.value)}
      onSelect={handleSelect}
      className={virtual ? virtualRow : undefined}
    >
      {showCreateItem && i === 0
        ? createText
        : highlightMatches
          ? highlightLabel(o.label, query)
          : o.label}
    </ComboboxOption>
  );

  // The shared combobox input. In single mode it is the trigger itself;
  // in multiple mode it sits chromeless inside the chip box, which owns
  // the pointer open/toggle path (an input click must not double-fire
  // through both elements).
  const triggerInput = (
    <input
      ref={setInputRef}
      role="combobox"
      style={multiple ? undefined : floating.triggerStyle}
      aria-expanded={open}
      aria-controls={id}
      aria-autocomplete="list"
      aria-activedescendant={activeDescendant}
      aria-busy={loading || undefined}
      className={multiple ? multiInput : input}
      value={query}
      placeholder={placeholder}
      onChange={(e) => {
        setQuery(e.target.value);
        setOpen(true);
      }}
      onPointerDown={multiple ? undefined : floating.onTriggerPointerDown}
      onClick={multiple ? undefined : floating.onTriggerClick}
      onKeyDown={handleKeyDown}
    />
  );

  return (
    <div x-class={[wrapper, className]}>
      {multiple ? (
        <div
          ref={boxRef}
          style={floating.triggerStyle}
          x-class={multiBox}
          // Open on click (via the suppression-aware toggle), never on
          // pointer-driven focus — the same race the single input avoids.
          onPointerDown={floating.onTriggerPointerDown}
          onClick={() => {
            floating.onTriggerClick();
            inputRef.current?.focus();
          }}
        >
          {selected.map((v) => (
            <span
              key={v}
              // Swallow the box's toggle so removing a chip never closes
              // (or opens) the panel. Pointerdown still bubbles: floating
              // attributes the gesture to the trigger, keeping light
              // dismiss away from chip removals.
              onClick={(e) => e.stopPropagation()}
            >
              <Chip color="primary" onClose={() => {
                const next = selected.filter((x) => x !== v);
                setValue(next);
                onValuesChange?.(next);
              }}>
                {labelFor(v)}
              </Chip>
            </span>
          ))}
          {triggerInput}
        </div>
      ) : (
        triggerInput
      )}
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement="bottom-span"
        id={id}
        role="listbox"
        aria-multiselectable={multiple ? 'true' : undefined}
        visualClass={virtualized ? listboxVirtual : listbox}
        style={
          maxHeight !== undefined && !virtualized
            ? { maxHeight: `${maxHeight}px` }
            : undefined
        }
      >
        {loading ? (
          <div
            role="option"
            aria-selected={false}
            aria-disabled="true"
            x-class={[stateRow]}
          >
            <Spinner size="sm" />
          </div>
        ) : listItems.length === 0 ? (
          <div
            role="option"
            aria-selected={false}
            aria-disabled="true"
            x-class={[stateRow]}
          >
            {empty ?? strings.noResults}
          </div>
        ) : virtualized ? (
          <VirtualList
            ref={listRef}
            data-virtualized
            items={listItems}
            height={Math.min(
              maxHeight ?? VIRTUAL_LIST_HEIGHT,
              listItems.length * rowHeight
            )}
            itemHeight={rowHeight}
            overscan={overscan}
            groups={
              hasGroups
                ? sections
                    .filter((s) => s.label !== undefined)
                    .map((s) => ({
                      startIndex: s.rows[0]?.index ?? 0,
                      key: s.key,
                      render: () => (
                        <div x-class={[groupHeadingText]}>{s.label}</div>
                      ),
                    }))
                : undefined
            }
            renderItem={(o, i) => renderRow(o, i, true)}
          />
        ) : (
          sections.flatMap((section) =>
            section.label === undefined
              ? section.rows.map(({ option, index }) =>
                  renderRow(option, index, false)
                )
              : [
                  <ComboboxGroup key={section.key} label={section.label}>
                    {section.rows.map(({ option, index }) =>
                      renderRow(option, index, false)
                    )}
                  </ComboboxGroup>,
                ]
          )
        )}
      </FloatingPanel>
    </div>
  );
}

export type { ComboboxProps, ComboboxVirtualizedConfig, ComboboxOptionData };
