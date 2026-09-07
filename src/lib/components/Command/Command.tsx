import type { ReactNode, RefObject } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { createContext, useContext, useId, useMemo, useRef } from 'react';
import { useControl } from 'react-use-control';

import {
  getEnabledMenuItems,
  useMenuKeyboard,
  useRovingTabindex,
} from '../../utils/menuKeyboard';

type CommandContextValue = {
  query: string;
  setQuery: (q: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
  /** Id of the listbox element — wires the container's aria-controls. */
  listId: string;
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
  query?: ControlOrValue<string>;
  children: ReactNode;
  className?: string;
};

const base = css`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  font-family: var(--haze-font-sans);
  overflow: hidden;
  width: 100%;
  max-width: 400px;
`;

export default function Command({ query: queryControl, children, className }: CommandProps) {
  const [query, setQuery] = useControl(queryControl, '');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const value = useMemo(
    () => ({ query, setQuery, inputRef, listRef, listId }),
    [query, setQuery, listId]
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

export function CommandInput({ placeholder, className }: CommandInputProps) {
  const { query, setQuery, inputRef, listRef } = useCommandContext();
  return (
    <input
      ref={inputRef}
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
  className?: string;
};

const listStyle = css`
  max-height: 300px;
  overflow-y: auto;
  padding: var(--haze-space-1);
`;

export function CommandList({ children, className }: CommandListProps) {
  const { inputRef, listRef, listId } = useCommandContext();

  useRovingTabindex({ menuRef: listRef, active: true, selector: OPTION_SELECTOR });
  const handleKeyDown = useMenuKeyboard({
    menuRef: listRef,
    selector: OPTION_SELECTOR,
    // The palette is always rendered — "closing" it means handing focus
    // back to the input (Escape/Tab from the list).
    onClose: () => inputRef.current?.focus(),
  });

  return (
    <div
      ref={listRef}
      x-class={[listStyle, className]}
      role="listbox"
      id={listId}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

// CommandItem
type CommandItemProps = {
  children: ReactNode;
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

export function CommandItem({ children, className, onSelect }: CommandItemProps) {
  const { query } = useCommandContext();
  const text = typeof children === 'string' ? children : '';
  const visible = !query || text.toLowerCase().includes(query.toLowerCase());

  if (!visible) return null;

  return (
    <div
      x-class={[itemStyle, className]}
      role="option"
      tabIndex={-1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        // Options are divs, not buttons — activate from the keyboard here.
        e.preventDefault();
        onSelect?.();
      }}
    >
      {children}
    </div>
  );
}

export type { CommandProps, CommandInputProps, CommandListProps, CommandItemProps };
