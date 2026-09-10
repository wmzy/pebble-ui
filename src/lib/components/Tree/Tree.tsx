import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import type { VirtualListHandle } from '../VirtualList';

import type { TreeNodeData, TreeProps, TreeVirtualizedConfig } from './types';
import type { VisibleTreeRow } from './utils';

import { useControl } from 'react-use-control';

import { css } from '@linaria/core';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getDirection } from '../../utils/direction';
import { VirtualList } from '../VirtualList';

import TreeItem from './TreeItem';
import {
  findNodeByKey,
  flattenVisibleTree,
  getChildKeys,
  getParentKey,
} from './utils';

const base = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  overflow: auto;
`;

/* Virtualized wrapper: the VirtualList scrollport owns scrolling — no
   `overflow` here, avoiding a nested scroll container that could grow a
   second scrollbar (the same trade-off as SelectFloating/Combobox). */
const virtualTree = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

/* Default virtualized scrollport height (px). */
const VIRTUAL_TREE_HEIGHT = 320;
/* Default virtualized row height: the treeitem min-height (2rem). */
const VIRTUAL_TREE_ROW_HEIGHT = 32;

const group = css`
  min-width: 0;
`;

function computeCheckedKeys(
  keys: string[],
  data: TreeNodeData[],
  checkStrictly: boolean
): { checked: string[]; halfChecked: string[] } {
  if (checkStrictly) return { checked: keys, halfChecked: [] };

  const checkedSet = new Set(keys);
  const halfCheckedSet = new Set<string>();
  const toRemove = new Set<string>();

  const walk = (nodes: TreeNodeData[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        walk(node.children);
        const allDescendants = getChildKeys(data, node.key);
        const checkedDescendants = allDescendants.filter((k) =>
          checkedSet.has(k)
        );
        if (checkedDescendants.length === 0) {
          toRemove.add(node.key);
        } else if (checkedDescendants.length < allDescendants.length) {
          halfCheckedSet.add(node.key);
          toRemove.add(node.key);
        }
      }
    }
  };
  walk(data);

  return {
    checked: keys.filter((k) => !toRemove.has(k)),
    halfChecked: Array.from(halfCheckedSet),
  };
}

export default function Tree({
  treeData,
  multiple = false,
  checkable = false,
  checkStrictly = false,
  selectable = true,
  disabled = false,
  blockNode = false,
  showLine = false,
  showIcon = false,
  switcherIcon,
  loadingIcon,
  titleRender,
  iconRender,
  virtualized,
  expandedKeys: expandedKeysControl,
  selectedKeys: selectedKeysControl,
  checkedKeys: checkedKeysControl,
  className,
  onExpand,
  onSelect,
  onCheck,
}: TreeProps) {
  const [expandedKeys, setExpandedKeys] = useControl(
    expandedKeysControl,
    []
  );
  const [selectedKeys, setSelectedKeys] = useControl(
    selectedKeysControl,
    []
  );
  const [checkedKeysRaw, setCheckedKeysRaw] = useControl(
    checkedKeysControl,
    []
  );

  const rawChecked = checkedKeysRaw;

  const derived = useMemo(
    () => computeCheckedKeys(rawChecked, treeData, checkStrictly),
    [rawChecked, treeData, checkStrictly]
  );
  const checkedKeys = derived.checked;
  const halfCheckedKeys = derived.halfChecked;

  // `virtualized` resolution: object config enables and customizes,
  // `true` enables with defaults, anything else keeps the plain DOM.
  const virtual = virtualized !== undefined && virtualized !== false;
  const virtualConfig: TreeVirtualizedConfig | undefined =
    typeof virtualized === 'object' ? virtualized : undefined;

  // Roving tabindex (WAI-ARIA tree pattern): the key of the row that
  // owns the tree's single tab stop. Purely internal focus bookkeeping —
  // never a prop — held in state only so the rendered `tabIndex`
  // follows it; `null` before the first interaction parks the stop on
  // the first focusable row.
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  // Row the next commit must focus. Keyboard focus moves resolve here so
  // virtualized targets can mount first (the window shift and this flag
  // land in the same commit).
  const [pendingFocusKey, setPendingFocusKey] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VirtualListHandle>(null);

  // Visible rows in depth-first order — the keyboard model and the
  // virtualized windowing share this one flattening.
  const visibleRows = useMemo(
    () => flattenVisibleTree(treeData, expandedKeys, disabled),
    [treeData, expandedKeys, disabled]
  );

  // The tab stop: the focused row, falling back to the first focusable
  // row (also when the focused row left the visible set — a collapsed
  // controlled subtree — so the tree never loses its stop).
  const stopKey = (() => {
    const focused = visibleRows.find(
      (row) => row.key === focusedKey && !row.disabled
    );
    if (focused) return focused.key;
    return visibleRows.find((row) => !row.disabled)?.key ?? null;
  })();

  // Apply a keyboard focus move: scroll the target row into the
  // (virtual) window, then let the effect below focus it after commit.
  function focusRow(index: number) {
    const row = visibleRows[index];
    if (!row || row.disabled) return;
    if (virtual) listRef.current?.scrollToIndex(index, 'auto');
    setFocusedKey(row.key);
    setPendingFocusKey(row.key);
  }

  /** Next focusable row from `from` stepping by `step`; `-1` when none —
   *  APG tree arrows do not wrap, so focus stays put at the ends. */
  function nextFocusableIndex(from: number, step: 1 | -1): number {
    for (
      let i = from + step;
      i >= 0 && i < visibleRows.length;
      i += step
    ) {
      const row = visibleRows[i];
      if (row && !row.disabled) return i;
    }
    return -1;
  }

  function handleFocus(event: ReactFocusEvent<HTMLDivElement>) {
    // Focus landing on a treeitem (mouse click or Tab) moves the roving
    // stop with it.
    const target = event.target as HTMLElement;
    if (target.getAttribute('role') !== 'treeitem') return;
    const key = target.dataset.treeKey;
    if (key) setFocusedKey(key);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const rows = visibleRows;
    if (rows.length === 0) return;
    const target = event.target as HTMLElement;
    if (target.getAttribute('role') !== 'treeitem') return;
    const currentKey = target.dataset.treeKey;
    const currentIndex = currentKey
      ? rows.findIndex((row) => row.key === currentKey)
      : -1;
    const current = currentIndex >= 0 ? rows[currentIndex] : undefined;
    if (!current || current.disabled) return;

    const isLeaf = current.node.isLeaf ?? !current.node.children?.length;
    // Inward/outward arrows mirror under dir="rtl", read from the DOM at
    // event time — the layout truth (Calendar's day-grid precedent).
    const rtl = getDirection(event.currentTarget) === 'rtl';
    const expandKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = rtl ? 'ArrowRight' : 'ArrowLeft';

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusRow(nextFocusableIndex(currentIndex, 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        focusRow(nextFocusableIndex(currentIndex, -1));
        return;
      case expandKey: {
        event.preventDefault();
        if (isLeaf) return; // end node: nothing (APG)
        if (expandedKeys.includes(current.key)) {
          // Open: move to the first child — the next visible row.
          focusRow(nextFocusableIndex(currentIndex, 1));
        } else {
          handleToggle(current.key); // closed: open, focus stays
        }
        return;
      }
      case collapseKey: {
        event.preventDefault();
        if (!isLeaf && expandedKeys.includes(current.key)) {
          handleToggle(current.key); // open: close, focus stays
          return;
        }
        // Closed or end node: move to the parent (root: no-op, APG).
        const parentIndex =
          current.parentKey === null
            ? -1
            : rows.findIndex((row) => row.key === current.parentKey);
        if (parentIndex >= 0) focusRow(parentIndex);
        return;
      }
      case 'Home':
        event.preventDefault();
        focusRow(nextFocusableIndex(-1, 1));
        return;
      case 'End':
        event.preventDefault();
        focusRow(nextFocusableIndex(rows.length, -1));
        return;
      case 'Enter':
        event.preventDefault();
        handleSelect(current.key);
        return;
      case ' ':
      case 'Space': {
        // user-event's {Space} reports the legacy key name — accept both.
        if (!checkable) return; // page keeps native Space scroll
        event.preventDefault();
        handleCheck(current.key);
        return;
      }
    }
  }

  // Keyboard focus moves land here, after the commit that (in virtual
  // mode) shifted the window onto the target row.
  useEffect(() => {
    if (pendingFocusKey === null) return;
    const root = rootRef.current;
    if (!root) return;
    const el = Array.from(
      root.querySelectorAll<HTMLElement>('[role="treeitem"]')
    ).find((item) => item.dataset.treeKey === pendingFocusKey);
    if (!el) return; // not mounted — retried when the rows change
    el.focus();
    setPendingFocusKey(null);
  }, [pendingFocusKey, visibleRows]);

  function handleToggle(key: string) {
    const isExpanded = expandedKeys.includes(key);
    const newKeys = isExpanded
      ? expandedKeys.filter((k) => k !== key)
      : [...expandedKeys, key];

    setExpandedKeys(newKeys);
    onExpand?.(newKeys, {
      expanded: !isExpanded,
      node: findNodeByKey(treeData, key)!,
    });
  }

  function handleSelect(key: string) {
    const node = findNodeByKey(treeData, key);
    if (!node?.selectable && node?.selectable !== undefined) return;
    if (!selectable) return;

    let newKeys: string[];
    if (multiple) {
      const idx = selectedKeys.indexOf(key);
      newKeys =
        idx >= 0
          ? selectedKeys.filter((k) => k !== key)
          : [...selectedKeys, key];
    } else {
      newKeys = selectedKeys.includes(key) ? [] : [key];
    }

    setSelectedKeys(newKeys);
    onSelect?.(newKeys, {
      selected: newKeys.includes(key),
      selectedNodes: newKeys
        .map((k) => findNodeByKey(treeData, k)!)
        .filter(Boolean),
      node: node!,
    });
  }

  function handleCheck(key: string) {
    if (!checkable) return;
    const node = findNodeByKey(treeData, key);
    if (node?.disableCheckbox) return;
    const isChecked = checkedKeys.includes(key);
    let newChecked: string[];

    if (checkStrictly) {
      newChecked = isChecked
        ? checkedKeys.filter((k) => k !== key)
        : [...checkedKeys, key];
    } else {
      const childKeys = getChildKeys(treeData, key);
      if (isChecked) {
        newChecked = checkedKeys.filter(
          (k) => k !== key && !childKeys.includes(k)
        );
        let parentKey = getParentKey(treeData, key);
        while (parentKey) {
          newChecked = newChecked.filter((k) => k !== parentKey);
          parentKey = getParentKey(treeData, parentKey);
        }
      } else {
        const toAdd = [key, ...childKeys].filter(
          (k) => !checkedKeys.includes(k)
        );
        newChecked = [...checkedKeys, ...toAdd];

        let parentKey = getParentKey(treeData, key);
        while (parentKey) {
          const siblings = getChildKeys(treeData, parentKey);
          const allSiblingsChecked = siblings.every((k) =>
            newChecked.includes(k)
          );
          if (allSiblingsChecked && !newChecked.includes(parentKey)) {
            newChecked.push(parentKey);
          }
          parentKey = getParentKey(treeData, parentKey);
        }
      }
    }

    const computed = computeCheckedKeys(newChecked, treeData, checkStrictly);

    setCheckedKeysRaw(checkStrictly ? newChecked : computed.checked);
    onCheck?.(checkStrictly ? newChecked : computed, {
      checked: !isChecked,
      checkedNodes: newChecked
        .map((k) => findNodeByKey(treeData, k)!)
        .filter(Boolean),
      node: findNodeByKey(treeData, key)!,
      halfCheckedKeys: computed.halfChecked,
    });
  }

  function renderNodes(
    nodes: TreeNodeData[],
    level: number,
    parentIsLast: boolean[]
  ) {
    return nodes.map((node, index) => {
      const hasChildren = !!node.children?.length;
      const isExpanded = expandedKeys.includes(node.key);
      const isSelected = selectedKeys.includes(node.key);
      const isChecked = checkedKeys.includes(node.key);
      const isHalfChecked = halfCheckedKeys.includes(node.key);
      const checkedState: 'checked' | 'halfChecked' | 'unchecked' = isChecked
        ? 'checked'
        : isHalfChecked
          ? 'halfChecked'
          : 'unchecked';

      const isLastAtThisLevel = index === nodes.length - 1;
      const currentIsLast = [...parentIsLast, isLastAtThisLevel];

      return (
        <div key={node.key} role='group' x-class={group}>
          <TreeItem
            node={node}
            level={level}
            expanded={isExpanded}
            selected={isSelected}
            checked={checkedState}
            disabled={disabled}
            checkable={checkable}
            selectable={selectable}
            blockNode={blockNode}
            showLine={showLine}
            showIcon={showIcon}
            switcherIcon={switcherIcon}
            loadingIcon={loadingIcon}
            loading={false}
            titleRender={titleRender}
            iconRender={iconRender}
            isLast={currentIsLast}
            tabIndex={node.key === stopKey ? 0 : -1}
            onToggle={() => handleToggle(node.key)}
            onSelect={() => handleSelect(node.key)}
            onCheck={() => handleCheck(node.key)}
          />
          {hasChildren && isExpanded && (
            <div>{renderNodes(node.children!, level + 1, currentIsLast)}</div>
          )}
        </div>
      );
    });
  }

  /** One flattened row for the virtualized window (same TreeItem props
   *  as the recursive path; the group nesting becomes aria-level on the
   *  flat rows). */
  function renderRow(row: VisibleTreeRow) {
    const isChecked = checkedKeys.includes(row.key);
    const isHalfChecked = halfCheckedKeys.includes(row.key);
    const checkedState: 'checked' | 'halfChecked' | 'unchecked' = isChecked
      ? 'checked'
      : isHalfChecked
        ? 'halfChecked'
        : 'unchecked';

    return (
      <TreeItem
        node={row.node}
        level={row.level}
        expanded={expandedKeys.includes(row.key)}
        selected={selectedKeys.includes(row.key)}
        checked={checkedState}
        disabled={disabled}
        checkable={checkable}
        selectable={selectable}
        blockNode={blockNode}
        showLine={showLine}
        showIcon={showIcon}
        switcherIcon={switcherIcon}
        loadingIcon={loadingIcon}
        loading={false}
        titleRender={titleRender}
        iconRender={iconRender}
        isLast={row.isLast}
        tabIndex={row.key === stopKey ? 0 : -1}
        onToggle={() => handleToggle(row.key)}
        onSelect={() => handleSelect(row.key)}
        onCheck={() => handleCheck(row.key)}
      />
    );
  }

  if (virtual) {
    return (
      <div
        role='tree'
        ref={rootRef}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        x-class={[virtualTree, className]}
      >
        <VirtualList
          ref={listRef}
          data-virtualized
          items={visibleRows}
          height={virtualConfig?.height ?? VIRTUAL_TREE_HEIGHT}
          itemHeight={virtualConfig?.itemHeight ?? VIRTUAL_TREE_ROW_HEIGHT}
          overscan={virtualConfig?.overscan}
          renderItem={renderRow}
        />
      </div>
    );
  }

  return (
    <div
      role='tree'
      ref={rootRef}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      x-class={[base, className]}
    >
      {renderNodes(treeData, 0, [])}
    </div>
  );
}

export type { TreeProps, TreeVirtualizedConfig };
