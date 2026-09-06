import type { ControlOrValue } from 'react-use-control';

import type { VirtualListHandle } from '../VirtualList';

import { css } from '@linaria/core';
import { useEffect, useId, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { VirtualList } from '../VirtualList';

import ComboboxOption from './ComboboxOption';

type ComboboxProps = {
  value?: ControlOrValue<string>;
  open?: ControlOrValue<boolean>;
  options: { value: string; label: string }[];
  placeholder?: string;
  /**
   * Render the dropdown through VirtualList once the filtered list is
   * longer than this many options. Defaults to 100; 0 disables
   * virtualization entirely (plain DOM rendering at any length).
   */
  virtualThreshold?: number;
  className?: string;
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
 * min-width keeps the fallback/absolute tier as wide as the input, the
 * way the anchored tier's `span-left` area does for free.
 */
const listbox = css`
  min-width: 100%;
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
  min-width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);
`;

/** Scrollport height of the virtualized list — the plain listbox's
 * `max-height` cap, so both modes are equally tall at the limit. */
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

export default function Combobox({
  value: valueControl,
  open: openControl,
  options,
  placeholder,
  virtualThreshold = 100,
  className,
}: ComboboxProps) {
  const [value, setValue] = useControl(valueControl, '');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useControl(openControl, false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [prevQuery, setPrevQuery] = useState(query);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VirtualListHandle>(null);

  const floating = useFloating({
    open,
    setOpen,
    triggerRef: inputRef,
    panelRef,
    animated: true,
  });

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const virtualized =
    virtualThreshold > 0 && filtered.length > virtualThreshold;

  // The highlighted row must stay visible whenever it moves (keyboard
  // navigation) and whenever the panel (re)opens with a live highlight —
  // 'auto' alignment is a no-op for rows already on screen. Gated on
  // `shown`, not `open`: this child effect runs before the behavior
  // effect calls showPopover(), and scrollTop set on a still-hidden
  // popover is clamped away and lost.
  useEffect(() => {
    if (!virtualized || !floating.shown || highlightIndex < 0) return;
    listRef.current?.scrollToIndex(highlightIndex, 'auto');
  }, [virtualized, floating.shown, highlightIndex]);

  // Typing a new query invalidates the highlight — adjust during render
  // (React-endorsed reset) so the first filtered frame already drops any
  // stale highlight, without an extra effect pass.
  if (query !== prevQuery) {
    setPrevQuery(query);
    setHighlightIndex(-1);
  }

  const selectOption = (val: string) => {
    setValue(val);
    const label = options.find((o) => o.value === val)?.label ?? val;
    setQuery(label);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (
      e.key === 'Enter' &&
      highlightIndex >= 0 &&
      filtered[highlightIndex]
    ) {
      e.preventDefault();
      selectOption(filtered[highlightIndex].value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div x-class={[wrapper, className]}>
      <input
        ref={inputRef}
        role="combobox"
        style={floating.triggerStyle}
        aria-expanded={open}
        aria-controls={id}
        aria-autocomplete="list"
        className={input}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // A click on an already-focused input light-dismisses the panel
        // without refiring focus — reopen explicitly so the list stays up.
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement="bottom-span"
        id={id}
        role="listbox"
        visualClass={virtualized ? listboxVirtual : listbox}
      >
        {virtualized ? (
          <VirtualList
            ref={listRef}
            data-virtualized
            items={filtered}
            height={VIRTUAL_LIST_HEIGHT}
            itemHeight={OPTION_ROW_HEIGHT}
            renderItem={(o, i) => (
              <ComboboxOption
                value={o.value}
                highlighted={i === highlightIndex}
                selected={o.value === value}
                onSelect={selectOption}
                className={virtualRow}
              >
                {o.label}
              </ComboboxOption>
            )}
          />
        ) : (
          filtered.map((o, i) => (
            <ComboboxOption
              key={o.value}
              value={o.value}
              highlighted={i === highlightIndex}
              selected={o.value === value}
              onSelect={selectOption}
            >
              {o.label}
            </ComboboxOption>
          ))
        )}
      </FloatingPanel>
    </div>
  );
}

export type { ComboboxProps };
