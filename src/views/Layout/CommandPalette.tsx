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

import { fill, useSiteLocale } from '../i18n';

import { MatchText } from './SidebarSearch';
import {
  ALIASES,
  COMPONENT_GROUPS,
  type ComponentItem,
} from './component-groups';
import { filterComponents } from './search-score';
import { MAX_DOC_RESULTS, SEARCH_INDEX, searchDocs } from './search-index';

/*
 * Global ⌘K/Ctrl+K command palette for the docs header: opens via the
 * search button or the `mod+k` hotkey and navigates through the app
 * router.
 *
 * Filtering is external (`shouldFilter={false}` on Command) so the ranked
 * order survives. An empty query keeps the grouped sidebar structure.
 * A query renders two tiers: components first — fuzzy-filtered by
 * name/alias with the same 4-tier scoring as the sidebar search
 * (./search-score) — then a trailing "Docs" group of full-text hits from
 * the build-time index (./search-index.ts: pages, demo section titles,
 * prop descriptions), substring-matched case-insensitively. Both tiers
 * are options of the single CommandList listbox, so the roving arrow
 * keys and Enter cross them seamlessly.
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

/* Localized group title: canonical English name → zh override when present. */
function groupLabel(groups: Record<string, string>, name: string): string {
  return groups[name] ?? name;
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

/* Docs-tier row: highlighted label with the owner/description context as
 * a muted, single-line-ellipsized second line. */
const docRow = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-1);
  min-width: 0;
`;

const docSub = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  const { t } = useSiteLocale();
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
  const docsMatches = useMemo(
    () => (searching ? searchDocs(SEARCH_INDEX, query, MAX_DOC_RESULTS) : []),
    [query, searching]
  );

  // Full app route ('/components/button', '/guides/dark-mode', …).
  const go = useCallback(
    (route: string) => {
      void navigate(router, route);
    },
    [router]
  );

  return (
    <>
      <button
        type='button'
        className={searchBtn}
        aria-label={t.chrome.searchComponents}
        onClick={toggle}
      >
        <Icon icon={Search} size='sm' />
        <span>{t.chrome.search}</span>
        <Kbd size='sm'>⌘K</Kbd>
      </button>
      <Dialog
        open={openCtrl}
        onClose={close}
        title={t.chrome.searchComponents}
        classNames={{ root: panel, header: panelTitle }}
      >
        <Command
          query={queryCtrl}
          shouldFilter={false}
          onItemSelect={close}
          className={palette}
        >
          <CommandInput
            ref={inputRef}
            placeholder={t.chrome.searchPlaceholder}
          />
          <CommandList>
            {searching ? (
              <>
                {matches.map((match) => {
                  const entry = ENTRY_BY_NAME.get(match.name);
                  if (!entry) return null;
                  return (
                    <CommandItem
                      key={entry.item.route}
                      onSelect={() => go(`/components/${entry.item.route}`)}
                    >
                      <span className={matchRow}>
                        <MatchText
                          text={entry.item.name}
                          indices={match.indices}
                        />
                        <span className={matchGroup}>
                          {groupLabel(t.componentGroups, entry.group)}
                        </span>
                      </span>
                    </CommandItem>
                  );
                })}
                {docsMatches.length > 0 && (
                  <CommandGroup heading={t.chrome.docs}>
                    {docsMatches.map((hit, i) => (
                      <CommandItem
                        key={`${hit.entry.route}#${hit.entry.label}#${i}`}
                        onSelect={() => go(hit.entry.route)}
                      >
                        <span className={docRow}>
                          <MatchText
                            text={hit.entry.label}
                            indices={hit.indices}
                          />
                          {hit.entry.sublabel !== undefined && (
                            <span className={docSub}>{hit.entry.sublabel}</span>
                          )}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {matches.length === 0 && docsMatches.length === 0 && (
                  <div
                    role='option'
                    aria-selected={false}
                    aria-disabled='true'
                    className={emptyRow}
                  >
                    {fill(t.chrome.noResultsMatch, { query: query.trim() })}
                  </div>
                )}
              </>
            ) : (
              COMPONENT_GROUPS.map((group) => (
                <CommandGroup
                  key={group.group}
                  heading={groupLabel(t.componentGroups, group.group)}
                >
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.route}
                      onSelect={() => go(`/components/${item.route}`)}
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
