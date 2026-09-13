import type {
  ComponentPropsWithoutRef,
  KeyboardEvent as ReactKeyboardEvent,
  Ref,
  SetStateAction,
} from 'react';
import type { Control, ControlOrValue } from 'react-use-control';
import type { TreeNodeData, TreeVirtualizedConfig } from '../Tree/types';

import { css } from '@linaria/core';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { isControl, useControl, useThru, watch } from 'react-use-control';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { useFocusScope } from '../../utils/focus-scope';
import { mergeRefs } from '../../utils/refs';
import Chip from '../Chip/Chip';
import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';
import Tree from '../Tree/Tree';
import { findNodeByKey, mergeLoadedChildren } from '../Tree/utils';

/**
 * react-use-control's state tuple shape (the `State<T>` alias is not
 * exported): `[value, setter]`.
 */
type StatePair<T> = [T, (next: SetStateAction<T>) => void];

type TreeSelectProps = {
  /**
   * Full node tree rendered in the panel — `Tree`'s data shape
   * (`{ key, title, children?, disabled?, … }`).
   */
  treeData: TreeNodeData[];
  /**
   * `string` in single mode, `string[]` when `multiple` is set. In
   * cascading multiple mode (`multiple` without `checkStrictly`) a
   * value containing a parent key checks its whole subtree, and the
   * committed value is the normalized fully-checked set (parents
   * included only while every descendant is checked) — Ant Design's
   * default checked strategy.
   */
  value?: ControlOrValue<string | string[]>;
  /**
   * Value callback (the Cascader contract — the trigger is a button,
   * not a native input, so there is no native change event): `string`
   * in single mode, `string[]` when `multiple` is set. Fired after
   * every commit: tree selection (single), checkbox cascades and chip
   * removal (multiple), and clears.
   */
  onChange?: (value: string | string[]) => void;
  /** Trigger label while no value is committed (falls back to the
   *  `treeSelect.placeholder` locale string). */
  placeholder?: string;
  /**
   * Checkbox selection: the panel tree renders checkboxes with
   * parent→child cascade (unless `checkStrictly`) and the value is a
   * `string[]`. Single mode (default) renders a selectable tree and
   * commits one key per selection.
   */
  multiple?: boolean;
  /** Multiple mode only: parent and child checkboxes are independent
   *  (no cascade); the value holds exactly the checked keys. */
  checkStrictly?: boolean;
  /**
   * A pointer-only × revealed on trigger hover/focus-within empties the
   * value (`''` / `[]`) without toggling the panel.
   */
  allowClear?: boolean;
  /**
   * Embeds a filter input in the panel: typing filters the tree to the
   * matching nodes plus their ancestor paths (Tree's `searchValue`),
   * with match highlighting and the localized no-match state.
   */
  showSearch?: boolean;
  /** Expand every parent node on first open (evaluated against the
   *  initial `treeData`). */
  treeDefaultExpandAll?: boolean;
  /** Controlled panel-tree expansion (Tree's `expandedKeys`). */
  treeExpandedKeys?: ControlOrValue<string[]>;
  /** Fired with the panel tree's next expanded keys on every toggle. */
  onTreeExpand?: (
    expandedKeys: string[],
    info: { expanded: boolean; node: TreeNodeData }
  ) => void;
  /**
   * Multiple mode only: cap the rendered chips; the rest collapse into
   * a `+N` badge whose `title` lists the hidden labels.
   */
  maxTagCount?: number;
  /**
   * Render the panel tree through `VirtualList` so large trees mount
   * only the visible window (plus overscan). `false`/omitted (default)
   * keeps the plain nested DOM path; an object customizes row metrics
   * (see `Tree.virtualized`).
   */
  virtualized?: boolean | TreeVirtualizedConfig;
  /**
   * Async child loading, forwarded to the panel tree: called when a
   * childless non-leaf node is expanded; resolved children are cached
   * (collapsing does not re-request) and also participate in the
   * trigger's label resolution.
   */
  loadData?: (node: TreeNodeData) => Promise<TreeNodeData[]>;
  /** Disables the trigger and the panel tree. */
  disabled?: boolean;
  className?: string;
  /**
   * Forwarded to the trigger `<button>` (not the root div) — the
   * element form bridges and `ref.current.focus()` reach. The
   * `role="combobox"` trigger is name-from-author, so consumers label
   * it through these native attributes (`aria-label` and friends) —
   * the Select trigger contract.
   */
  ref?: Ref<HTMLButtonElement>;
} & Omit<
  ComponentPropsWithoutRef<'button'>,
  'value' | 'onChange' | 'type' | 'children' | 'className' | 'disabled'
>;

const wrapper = css`
  position: relative;
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
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
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  padding: var(--haze-space-2) var(--haze-space-3);
  text-align: start;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &:hover {
    border-color: var(--haze-color-border-hover);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** Single-mode label: truncates instead of growing the trigger. */
const triggerValue = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: start;
`;

const placeholderText = css`
  color: var(--haze-color-text-muted);
`;

/** One selected value: the Chip capsule plus its pointer-only ×. */
const chipItem = css`
  display: inline-flex;
  align-items: center;
`;

/**
 * Pointer-only remove affordance. A real button here would nest
 * interactive controls inside the trigger button — invalid HTML, an
 * axe nested-interactive violation, and a screen-reader mess. The span
 * is aria-hidden and unreachable by Tab on purpose: keyboard users
 * remove values through the panel checkboxes or the clear affordance
 * (the same trade-off Select's multiple trigger makes).
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
 * The +N overflow badge of maxTagCount: presentational (selection
 * lives in the value, removal through the panel or the clear ×), with
 * the full overflow label list in the native title tooltip.
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
 * chipRemove), revealed on trigger hover/focus-within through the
 * data-clearable ancestor selector (Select's trigger pattern).
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

const triggerCaret = css`
  display: inline-flex;
  flex-shrink: 0;
  margin-inline-start: auto;
  color: var(--haze-color-text-muted);
  pointer-events: none;
`;

/**
 * Panel skin: same chrome as Cascader's panel. The min-width cascade
 * re-pins the panel to the trigger's width on the anchored tier (100%
 * would resolve against the viewport-wide position-area region) and
 * drops as invalid on engines without anchor positioning, leaving the
 * fallback — the trigger-width wrapper — intact.
 */
const panel = css`
  box-sizing: border-box;
  min-width: 100%;
  min-width: anchor-size(width);
  padding: var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  box-shadow: var(--haze-shadow-lg);

  /* Author display outranks the UA sheet's closed-popover rule
     (display none on non-open popovers) — the Cascader panel note;
     scoped so the exit animation (running while still open) plays. */
  &[popover]:not(:popover-open) {
    display: none;
  }
`;

/** Search input heading the panel (showSearch). */
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

/**
 * Panel-tree chrome: a width floor so short labels do not collapse
 * the panel under the trigger, and the scroll cap — Tree's own root
 * owns the overflow, so a max-height here turns into its scrollbar.
 * Virtualized trees size their own scrollport and ignore the cap.
 */
const treeHost = css`
  min-width: 180px;
  max-height: 280px;
`;

const ChevronDown = () => (
  <svg
    viewBox='0 0 12 12'
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

/** Every parent (non-leaf) key of the tree, for treeDefaultExpandAll. */
function parentKeysOf(data: TreeNodeData[]): string[] {
  const keys: string[] = [];
  const walk = (nodes: TreeNodeData[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        keys.push(node.key);
        walk(node.children);
      }
    }
  };
  walk(data);
  return keys;
}

/** All keys strictly below `node` (its whole subtree). */
function descendantKeysOf(node: TreeNodeData): string[] {
  const keys: string[] = [];
  const walk = (nodes: TreeNodeData[]) => {
    for (const child of nodes) {
      keys.push(child.key);
      walk(child.children ?? []);
    }
  };
  walk(node.children ?? []);
  return keys;
}

/**
 * Consumer value → Tree's string[] key set. In cascading multiple mode
 * a value containing a parent key checks its whole subtree (Ant
 * Design's value semantics), so parent keys expand to include their
 * descendants.
 */
function toKeys(
  value: string | string[] | undefined,
  data: TreeNodeData[],
  multiple: boolean,
  checkStrictly: boolean
): string[] {
  if (value === undefined || value === '') return [];
  const raw = Array.isArray(value) ? value : [value];
  if (!multiple || checkStrictly) return raw;
  const out = new Set<string>();
  for (const key of raw) {
    out.add(key);
    const node = findNodeByKey(data, key);
    if (node) {
      for (const descendant of descendantKeysOf(node)) out.add(descendant);
    }
  }
  return [...out];
}

/**
 * Re-hosts the consumer's string | string[] state in Tree's string[]
 * shape: reads project through toKeys, writes convert back to the
 * consumer's shape before reaching the underlying state. The watch
 * layer applied outside this adapter then reports commits in the
 * consumer's shape.
 */
function adaptConsumerState(
  state: StatePair<string | string[]>,
  options: { multiple: boolean; checkStrictly: boolean; data: TreeNodeData[] }
): StatePair<string[]> {
  const [value, setValue] = state;
  const read = () =>
    toKeys(value, options.data, options.multiple, options.checkStrictly);
  return [
    read(),
    (next: SetStateAction<string[]>) => {
      const nextKeys = typeof next === 'function' ? next(read()) : next;
      setValue(options.multiple ? nextKeys : nextKeys[0] ?? '');
    },
  ];
}

export default function TreeSelect({
  treeData,
  value: valueControl,
  onChange,
  placeholder,
  multiple = false,
  checkStrictly = false,
  allowClear = false,
  showSearch = false,
  treeDefaultExpandAll = false,
  treeExpandedKeys,
  onTreeExpand,
  maxTagCount,
  virtualized,
  loadData,
  disabled = false,
  className,
  ref,
  ...rest
}: TreeSelectProps) {
  const strings = useStrings('treeSelect');
  const [open, setOpen] = useControl(false, false);

  // Lazy children mirrored from loadData responses: Tree caches loaded
  // children internally, but the trigger's label resolution below runs
  // on TreeSelect's own data view, so the wrapper records them too
  // (one request — the passthrough returns the same promise's result).
  const [loadedChildren, setLoadedChildren] = useState<
    Record<string, TreeNodeData[]>
  >({});
  const handleLoadData = useMemo(
    () =>
      loadData
        ? (node: TreeNodeData) =>
            loadData(node).then((children) => {
              setLoadedChildren((prev) => ({ ...prev, [node.key]: children }));
              return children;
            })
        : undefined,
    [loadData]
  );
  const labelData = useMemo(
    () => mergeLoadedChildren(treeData, loadedChildren),
    [treeData, loadedChildren]
  );
  const nodeByKey = useMemo(() => {
    const map = new Map<string, TreeNodeData>();
    const walk = (nodes: TreeNodeData[]) => {
      for (const node of nodes) {
        map.set(node.key, node);
        walk(node.children ?? []);
      }
    };
    walk(labelData);
    return map;
  }, [labelData]);

  // The committed key set in Tree's shape. The consumer's control (or
  // uncontrolled initial value) is adapted through useThru: the panel
  // Tree receives the resulting control and stays synchronized with
  // commits in both directions, while onChange reports in the
  // consumer's shape (string single, string[] multiple — the Cascader
  // value-callback contract).
  const controlled = isControl(valueControl);
  const [keys, setKeys, keysControl] = useControl<string[]>(
    useThru<string[]>(
      // Type-level lie on purpose: the control really carries the
      // consumer's string | string[] shape — adaptConsumerState
      // re-hosts it in Tree's string[] shape below (the runtime
      // contract lives there).
      controlled ? (valueControl as unknown as Control<string[]>) : undefined,
      (state: StatePair<string[]>) =>
        watch((next: string[]) =>
          onChange?.(multiple ? next : next[0] ?? '')
        )(
          adaptConsumerState(
            state as unknown as StatePair<string | string[]>,
            {
              multiple,
              checkStrictly,
              data: labelData,
            }
          )
        )
    ),
    controlled
      ? []
      : toKeys(
          valueControl,
          labelData,
          multiple,
          checkStrictly
        )
  );

  // Panel search query: internal panel UI state (never a prop), reset
  // on close so a stale filter never survives to the next open (the
  // render-time reset Select/Cascader use).
  const [query, setQuery] = useState('');
  if (!open && query !== '') {
    setQuery('');
  }

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

  const floating = useFloating({
    open,
    setOpen,
    triggerRef,
    panelRef,
    animated: true,
  });

  // Focus scope: no auto focus (the target below is chosen explicitly,
  // gated on shown) — its job is returning focus to the trigger when
  // the panel closes while a tree row holds it.
  const setScope = useFocusScope({
    enabled: open,
    autoFocus: false,
    returnFocus: true,
  });
  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      setScope(node);
    },
    [panelRef, setScope]
  );

  // Panel focus on open: the search input when showSearch is set
  // (typing filters straight away, ArrowDown roams into the tree),
  // else the selected row (single mode) falling back to the first
  // treeitem. Gated on shown — on the native path the popover is
  // display:none until showPopover() runs, and focus on a hidden
  // element is silently dropped.
  const focusedOpenRef = useRef(false);
  useEffect(() => {
    if (!open) {
      focusedOpenRef.current = false;
      return;
    }
    if (!floating.shown || focusedOpenRef.current) return;
    focusedOpenRef.current = true;
    if (showSearch) {
      searchRef.current?.focus();
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(
      panel.querySelectorAll<HTMLElement>('[role="treeitem"]')
    );
    const selectedKey = !multiple && keys.length > 0 ? keys[0] : undefined;
    const target =
      (selectedKey !== undefined
        ? items.find((el) => el.dataset.treeKey === selectedKey)
        : undefined) ?? items[0];
    target?.focus();
  }, [open, floating.shown, showSearch, multiple, keys]);

  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handlePanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      // Tab closes instead of tabbing out of the tree; focus returns
      // to the trigger through the focus scope. (Escape on the native
      // tier is also handled by the popover's light-dismiss — this is
      // the fallback-tier and echo path.)
      e.preventDefault();
      setOpen(false);
    }
  };

  const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'ArrowDown') return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      '[role="treeitem"]:not([aria-disabled="true"])'
    );
    if (!first) return;
    e.preventDefault();
    first.focus();
  };

  // Single mode: the commit itself traveled through the shared control
  // (Tree's selection state IS TreeSelect's value); selecting closes
  // the panel and returns focus to the trigger.
  const handleTreeSelect = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const clearValue = () => {
    setKeys([]);
    triggerRef.current?.focus();
  };

  /** Chip removal: cascading mode drops the key plus its subtree
   *  (removing a parent tag unchecks its children, Ant Design
   *  semantics); strict mode drops exactly the key. */
  const removeKey = (key: string) => {
    if (checkStrictly) {
      setKeys(keys.filter((k) => k !== key));
      return;
    }
    const node = nodeByKey.get(key);
    const drop = new Set([key, ...(node ? descendantKeysOf(node) : [])]);
    setKeys(keys.filter((k) => !drop.has(k)));
  };

  const selectedNode = !multiple && keys.length > 0 ? nodeByKey.get(keys[0] ?? '') : undefined;

  const chips = multiple ? keys : [];
  const visibleChips =
    maxTagCount === undefined ? chips : chips.slice(0, Math.max(maxTagCount, 0));
  const overflowKeys =
    maxTagCount === undefined ? [] : chips.slice(Math.max(maxTagCount, 0));

  const showClear = allowClear && !disabled && keys.length > 0;

  /** String form of a title, for chips and the overflow tooltip. */
  const labelText = (key: string): string => {
    const node = nodeByKey.get(key);
    if (!node) return key;
    return typeof node.title === 'string' ? node.title : node.key;
  };

  const allParentKeys = useMemo(() => parentKeysOf(treeData), [treeData]);

  const triggerBody = multiple ? (
    keys.length === 0 ? (
      <span data-slot='placeholder' x-class={placeholderText}>
        {placeholder ?? strings.placeholder}
      </span>
    ) : (
      <>
        {visibleChips.map((key) => (
          <span data-slot='item' x-class={chipItem} key={key}>
            <Chip color='primary'>{labelText(key)}</Chip>
            <span
              aria-hidden='true'
              data-slot='item-remove'
              x-class={chipRemove}
              onClick={(e) => {
                // Removing a chip must not toggle the panel.
                e.stopPropagation();
                removeKey(key);
              }}
            >
              ×
            </span>
          </span>
        ))}
        {overflowKeys.length > 0 && (
          <span
            data-slot='overflow-badge'
            x-class={overflowBadge}
            title={overflowKeys.map(labelText).join(', ')}
          >
            {formatString(strings.moreTags, { count: overflowKeys.length })}
          </span>
        )}
      </>
    )
  ) : selectedNode ? (
    <span data-slot='value' x-class={triggerValue}>{selectedNode.title ?? selectedNode.key}</span>
  ) : (
    <span data-slot='placeholder' x-class={[triggerValue, placeholderText]}>
      {placeholder ?? strings.placeholder}
    </span>
  );

  const clearAffordance = showClear ? (
    <span
      aria-hidden='true'
      data-slot='clear-button'
      title={strings.clear}
      x-class={clearBtn}
      onClick={(e) => {
        // Clearing must not flip the panel either way.
        e.stopPropagation();
        clearValue();
      }}
    >
      ×
    </span>
  ) : undefined;

  return (
    <div x-class={wrapper}>
      <button
        // Spread first — the floating handlers below must win over a
        // spread, or a stray onClick could disable the open toggle
        // entirely (the SelectFloating ordering rationale).
        {...rest}
        ref={setTriggerRef}
        data-slot='trigger'
        type='button'
        disabled={disabled}
        style={floating.triggerStyle}
        role='combobox'
        aria-haspopup='tree'
        aria-expanded={open}
        aria-controls={id}
        data-clearable={allowClear || undefined}
        onPointerDown={floating.onTriggerPointerDown}
        onClick={floating.onTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        x-class={[trigger, className]}
      >
        {triggerBody}
        {clearAffordance}
        <span data-slot='icon' x-class={triggerCaret} aria-hidden='true'>
          <ChevronDown />
        </span>
      </button>
      <FloatingPanel
        ref={setPanelRef}
        behavior={floating}
        placement='bottom'
        visualClass={panel}
        onKeyDown={handlePanelKeyDown}
      >
        <div id={id}>
          {showSearch && (
            <input
              ref={searchRef}
              data-slot='input'
              type='text'
              aria-label={strings.searchLabel}
              placeholder={strings.searchPlaceholder}
              x-class={searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          )}
          <Tree
            className={treeHost}
            treeData={treeData}
            checkable={multiple}
            checkStrictly={checkStrictly}
            selectable={!multiple}
            blockNode
            disabled={disabled}
            virtualized={virtualized}
            loadData={handleLoadData}
            searchValue={showSearch && query !== '' ? query : undefined}
            selectedKeys={multiple ? undefined : keysControl}
            checkedKeys={multiple ? keysControl : undefined}
            expandedKeys={
              treeExpandedKeys ?? (treeDefaultExpandAll ? allParentKeys : undefined)
            }
            onExpand={onTreeExpand}
            onSelect={multiple ? undefined : handleTreeSelect}
          />
        </div>
      </FloatingPanel>
    </div>
  );
}

export type { TreeSelectProps, TreeVirtualizedConfig };
