import type { ReactNode, Ref, RefObject } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { Children, createContext, useContext, useId, useMemo, useRef } from 'react';
import { useControl } from 'react-use-control';

import {
  getEnabledMenuItems,
  useMenuKeyboard,
  useRovingTabindex,
} from '../../utils/menuKeyboard';
import { mergeRefs } from '../../utils/refs';
import { useStrings } from '../LocaleProvider';
import Kbd from '../Kbd/Kbd';

import {
  collectCommandItems,
  commandItemMatches,
} from './command-filter';

type CommandContextValue = {
  query: string;
  setQuery: (q: string) => void;
  /**
   * Whether items filter themselves against `query`. Carried through
   * the context so `CommandItem`/`CommandGroup` render consistently
   * with the palette-level `shouldFilter` prop.
   */
  shouldFilter: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
  /** Id of the listbox element — wires the container's aria-controls. */
  listId: string;
  /**
   * Palette-level select hook (the CommandDialog wiring): invoked after
   * a consumer's `onSelect` when an item activates. Unset on a bare
   * `Command` — zero effect unless a composition opts in.
   */
  onItemSelect?: () => void;
};

/** Command options are listbox options, not menu items. */
const OPTION_SELECTOR = '[role="option"]';

const CommandContext = createContext<CommandContextValue | undefined>(undefined);

function useCommandContext() {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error('Command sub-components must be used within <Command>');
  return ctx;
}

type CommandProps = {
  /**
   * The palette's search query (controlled `Control<string>` or plain
   * uncontrolled initial value). Drives built-in filtering and is
   * writable through `CommandInput`; consumers may also drive it
   * themselves — filtering only reads the value.
   */
  query?: ControlOrValue<string>;
  /**
   * Whether items filter themselves against `query` (case-insensitive
   * substring over the item's `value`/children text and `keywords`).
   * Default `true` — the palette's historical behavior; pass `false`
   * when the consumer filters externally (e.g. server-side search).
   */
  shouldFilter?: boolean;
  /**
   * Palette-level select hook: invoked after any item's own `onSelect`
   * when it activates (click or Enter/Space). The composition channel
   * `CommandDialog` uses to close itself on selection; on a bare
   * `Command` it is a convenient place for logging/focus handoff.
   */
  onItemSelect?: () => void;
  children: ReactNode;
  className?: string;
};

/**
 * Component-level tokens: Command can be rethemed per-component by
 * setting `--haze-command-*` custom properties on any ancestor (the
 * `CommandDialog` palette shell uses the same channel to go borderless
 * and full-width). The library never defines them — the stylesheet
 * only carries fallback chains:
 *
 * - `--haze-command-width` — root max-width (fallback `400px`)
 * - `--haze-command-border` — root border (fallback `1px solid var(--haze-color-border)`)
 */
const base = css`
  display: flex;
  flex-direction: column;
  border: var(--haze-command-border, 1px solid var(--haze-color-border));
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  font-family: var(--haze-font-sans);
  overflow: hidden;
  width: 100%;
  max-width: var(--haze-command-width, 400px);
`;

export default function Command({
  query: queryControl,
  shouldFilter = true,
  onItemSelect,
  children,
  className,
}: CommandProps) {
  const [query, setQuery] = useControl(queryControl, '');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const value = useMemo(
    () => ({ query, setQuery, shouldFilter, onItemSelect, inputRef, listRef, listId }),
    [query, setQuery, shouldFilter, onItemSelect, listId]
  );

  return (
    <CommandContext.Provider value={value}>
      <div
        x-class={[base, className]}
        role="combobox"
        // The palette list is always rendered, so the combobox is always
        // expanded; aria-controls points at the CommandList listbox.
        aria-expanded={true}
        aria-controls={listId}
      >
        {children}
      </div>
    </CommandContext.Provider>
  );
}

// CommandInput
type CommandInputProps = {
  placeholder?: string;
  className?: string;
  /**
   * Ref to the underlying `<input>` — the palette's focusable element
   * (Wave 1 ref-channel convention); `CommandDialog` uses it to focus
   * the input on open.
   */
  ref?: Ref<HTMLInputElement>;
};

const inputStyle = css`
  width: 100%;
  padding: var(--haze-space-3) var(--haze-space-4);
  border: none;
  border-bottom: 1px solid var(--haze-color-border);
  background: transparent;
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  outline: none;

  &::placeholder {
    color: var(--haze-color-text-muted);
  }
`;

export function CommandInput({ placeholder, className, ref }: CommandInputProps) {
  const { query, setQuery, inputRef, listRef } = useCommandContext();
  return (
    <input
      ref={mergeRefs(inputRef, ref)}
      x-class={[inputStyle, className]}
      type="text"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => {
        // WAI-ARIA combobox pattern: arrows move focus into the list.
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const items = getEnabledMenuItems(listRef.current, OPTION_SELECTOR);
        const target = e.key === 'ArrowDown' ? items[0] : items[items.length - 1];
        target?.focus();
      }}
    />
  );
}

// CommandList
type CommandListProps = {
  children: ReactNode;
  /**
   * Custom no-results content for the empty filtered list. Defaults to
   * the `command.noResults` locale string.
   */
  empty?: ReactNode;
  className?: string;
};

const listStyle = css`
  max-height: 300px;
  overflow-y: auto;
  padding: var(--haze-space-1);
`;

const emptyStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--haze-space-4) var(--haze-space-3);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  cursor: default;
`;

export function CommandList({ children, empty, className }: CommandListProps) {
  const { inputRef, listRef, listId, shouldFilter, query } = useCommandContext();
  const strings = useStrings('command');

  useRovingTabindex({ menuRef: listRef, active: true, selector: OPTION_SELECTOR });
  const handleKeyDown = useMenuKeyboard({
    menuRef: listRef,
    selector: OPTION_SELECTOR,
    // The palette is always rendered — "closing" it means handing focus
    // back to the input (Escape/Tab from the list).
    onClose: () => inputRef.current?.focus(),
  });

  // Built-in filtering judges only the <CommandItem> elements it renders
  // itself: with items present but none matching, the empty row takes
  // over. Children with no items at all stay consumer-managed.
  const items = collectCommandItems(children, CommandItem);
  const showEmpty =
    shouldFilter &&
    items.length > 0 &&
    !items.some((item) => commandItemMatches(item.props, query));

  return (
    <div
      ref={listRef}
      x-class={[listStyle, className]}
      role="listbox"
      id={listId}
      onKeyDown={handleKeyDown}
    >
      {children}
      {showEmpty && (
        // Same shape as Combobox's empty row: a disabled option keeps
        // the listbox non-empty for assistive tech.
        <div role="option" aria-selected={false} aria-disabled="true" x-class={[emptyStyle]}>
          {empty ?? strings.noResults}
        </div>
      )}
    </div>
  );
}

// CommandGroup
type CommandGroupProps = {
  /**
   * Heading rendered above the group's items. Sticky while the list
   * scrolls: pinned to the scrollport top until the next group's
   * heading pushes past it (the cmdk shape). Optional — a group may
   * exist purely to opt its items into empty-group hiding.
   */
  heading?: ReactNode;
  className?: string;
  /**
   * The group's `CommandItem` rows (and any wrappers around them).
   * Optional — a childless group renders nothing (the empty-group
   * hiding contract covers zero-item groups too).
   */
  children?: ReactNode;
};

const groupHeading = css`
  position: sticky;
  top: 0;
  z-index: 1;
  box-sizing: border-box;
  background: var(--haze-color-bg);
  border-bottom: 1px solid var(--haze-color-border);
  padding: var(--haze-space-1) var(--haze-space-3);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

export function CommandGroup({ heading, children, className }: CommandGroupProps) {
  const { shouldFilter, query } = useCommandContext();
  const headingId = useId();

  // Non-empty groups only: a group whose every item was filtered out
  // renders nothing at all, keeping the list free of orphaned headers.
  // Content without any CommandItem children is consumer-managed and
  // only hides when literally empty.
  const items = collectCommandItems(children, CommandItem);
  const visible =
    items.length === 0
      ? Children.count(children) > 0
      : !shouldFilter || items.some((item) => commandItemMatches(item.props, query));
  if (!visible) return null;

  return (
    <div
      role="group"
      aria-labelledby={heading !== undefined ? headingId : undefined}
      x-class={[className]}
    >
      {heading !== undefined && (
        <div id={headingId} x-class={[groupHeading]}>
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

// CommandItem
type CommandItemProps = {
  children: ReactNode;
  /**
   * Explicit filter target. Defaults to the concatenated text of the
   * item's children (icons and wrappers are walked transparently).
   */
  value?: string;
  /**
   * Extra filter targets that should surface the item even when its
   * displayed text misses the query (e.g. synonyms, aliases).
   */
  keywords?: readonly string[];
  /**
   * Shortcut hint rendered as a `Kbd` badge on the item's inline end —
   * purely decorative, the binding itself belongs to the consumer
   * (e.g. `useHotkeys`).
   */
  shortcut?: string;
  className?: string;
  onSelect?: () => void;
};

const itemStyle = css`
  padding: var(--haze-space-2) var(--haze-space-3);
  border-radius: var(--haze-radius-md);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  cursor: pointer;
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    background: var(--haze-color-bg-subtle);
    box-shadow: inset 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

/** Row layout only while a shortcut badge is present — plain items keep the historical block flow. */
const itemWithShortcut = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--haze-space-3);
`;

export function CommandItem({
  children,
  value,
  keywords,
  shortcut,
  className,
  onSelect,
}: CommandItemProps) {
  const { shouldFilter, query, onItemSelect } = useCommandContext();
  const visible =
    !shouldFilter || commandItemMatches({ value, keywords, children }, query);

  if (!visible) return null;

  const activate = () => {
    onSelect?.();
    onItemSelect?.();
  };

  return (
    <div
      x-class={[itemStyle, shortcut !== undefined && itemWithShortcut, className]}
      role="option"
      tabIndex={-1}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        // Options are divs, not buttons — activate from the keyboard here.
        e.preventDefault();
        activate();
      }}
    >
      {children}
      {shortcut !== undefined && <Kbd size="sm">{shortcut}</Kbd>}
    </div>
  );
}

export type {
  CommandProps,
  CommandInputProps,
  CommandListProps,
  CommandGroupProps,
  CommandItemProps,
};
