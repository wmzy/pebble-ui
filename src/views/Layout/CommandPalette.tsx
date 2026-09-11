import { useCallback, useEffect, useMemo, useRef } from 'react';

import { navigate } from '@native-router/core';
import { useRouter } from '@native-router/react';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';
import { Search } from 'lucide-react';

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  Icon,
  Kbd,
  useHotkeys,
} from '@/lib';

import { MatchText } from './SidebarSearch';
import { ALIASES, COMPONENT_GROUPS, type ComponentItem } from './component-groups';
import { filterComponents } from './search-score';

/*
 * Global ⌘K/Ctrl+K command palette for the docs header: opens via the
 * search button or the `mod+k` hotkey, fuzzy-filters every component by
 * name/alias (same 4-tier scoring as the sidebar search — ./search-score)
 * and navigates to the component's doc route through the app router.
 *
 * Filtering is external (`shouldFilter={false}` on Command) so the ranked
 * order survives: an empty query keeps the grouped sidebar structure,
 * a query renders one flat rank-ordered list with the group as trailing
 * label on each row.
 */

type PaletteEntry = { item: ComponentItem; group: string };

const ENTRIES: PaletteEntry[] = COMPONENT_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ item, group: group.group }))
);

/* filterComponents 的词法拆分按小写词典工作（侧边栏同款约定）：候选
 * 键用小写展示名，命中后经此映射回显示条目（小写不改变字符位置，
 * 高亮 indices 对显示名同样成立）。 */
const ENTRY_BY_NAME = new Map(
  ENTRIES.map((entry) => [entry.item.name.toLowerCase(), entry])
);

/* ALIASES is keyed by route; filterComponents keys by search name. */
const ALIASES_BY_NAME: Record<string, string[]> = {};
for (const entry of ENTRIES) {
  const aliases = ALIASES[entry.item.route];
  if (aliases) ALIASES_BY_NAME[entry.item.name.toLowerCase()] = aliases;
}

/* Same component-token channel CommandDialog uses: strip the Dialog
 * panel padding/width so the Command palette owns the shell shape. */
const panel = css`
  --haze-dialog-width: 640px;
  --haze-dialog-padding: 0;
  --haze-dialog-title-gap: 0;
`;

const panelTitle = css`
  box-sizing: border-box;
  padding: var(--haze-space-4) var(--haze-space-4) var(--haze-space-3);
  font-size: var(--haze-text-sm);
`;

/* Borderless, full-width Command inside the Dialog shell. */
const palette = css`
  --haze-command-width: none;
  --haze-command-border: none;
`;

const matchRow = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--haze-space-3);
`;

const matchGroup = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  white-space: nowrap;
`;

/* Mirrors CommandList's own empty option (shouldFilter={false} disables
 * the built-in one): a disabled option keeps the listbox non-empty. */
const emptyRow = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--haze-space-4) var(--haze-space-3);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  cursor: default;
`;

/* Header trigger styled like the GitHub button: icon + label + the
 * hotkey hint as a Kbd badge. */
const searchBtn = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-1) var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;

  &:hover {
    border-color: var(--haze-color-border-hover);
    color: var(--haze-color-text);
  }
`;

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen, openCtrl] = useControl(undefined, false);
  const [query, setQuery, queryCtrl] = useControl(undefined, '');
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
  }, [setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Palette chords fire even while focus is in an input (CommandDialog's
  // convention): ⌘K on macOS, Ctrl+K elsewhere.
  useHotkeys({ 'mod+k': toggle }, { allowInInput: true });

  // Fresh query + focused input on every open (Dialog's focus scope
  // already lands on the first tabbable; pin it explicitly like
  // CommandDialog does).
  useEffect(() => {
    if (!open) return;
    setQuery('');
    inputRef.current?.focus();
  }, [open, setQuery]);

  const searching = query.trim() !== '';
  const matches = useMemo(
    () =>
      filterComponents(
        ENTRIES.map((e) => e.item.name.toLowerCase()),
        query,
        ALIASES_BY_NAME
      ),
    [query]
  );

  const go = useCallback(
    (route: string) => {
      void navigate(router, `/components/${route}`);
    },
    [router]
  );

  return (
    <>
      <button
        type='button'
        className={searchBtn}
        aria-label='Search components'
        onClick={toggle}
      >
        <Icon icon={Search} size='sm' />
        <span>Search</span>
        <Kbd size='sm'>⌘K</Kbd>
      </button>
      <Dialog
        open={openCtrl}
        onClose={close}
        title='Search components'
        classNames={{ root: panel, header: panelTitle }}
      >
        <Command
          query={queryCtrl}
          shouldFilter={false}
          onItemSelect={close}
          className={palette}
        >
          <CommandInput ref={inputRef} placeholder='Search components…' />
          <CommandList>
            {searching ? (
              matches.length > 0 ? (
                matches.map((match) => {
                  const entry = ENTRY_BY_NAME.get(match.name);
                  if (!entry) return null;
                  return (
                    <CommandItem
                      key={entry.item.route}
                      onSelect={() => go(entry.item.route)}
                    >
                      <span className={matchRow}>
                        <MatchText
                          text={entry.item.name}
                          indices={match.indices}
                        />
                        <span className={matchGroup}>{entry.group}</span>
                      </span>
                    </CommandItem>
                  );
                })
              ) : (
                <div
                  role='option'
                  aria-selected={false}
                  aria-disabled='true'
                  className={emptyRow}
                >
                  No components match “{query.trim()}”
                </div>
              )
            ) : (
              COMPONENT_GROUPS.map((group) => (
                <CommandGroup key={group.group} heading={group.group}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.route}
                      onSelect={() => go(item.route)}
                    >
                      {item.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </Dialog>
    </>
  );
}
