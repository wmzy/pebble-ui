import type { TreeNodeData } from './types';

/**
 * A visible tree row: one treeitem in the depth-first order the tree
 * renders (parents before children, expanded subtrees only). Backs both
 * the roving-tabindex keyboard navigation and the virtualized windowing,
 * which need the flat "visible rows" list rather than the recursive
 * structure.
 */
export type VisibleTreeRow = {
  key: string;
  node: TreeNodeData;
  /** Nesting depth; 0 for roots — matches TreeItem's `level` prop. */
  level: number;
  /** Parent row's key; null for roots. */
  parentKey: string | null;
  /**
   * showLine guide chain: one "is a last child" flag per ancestor level
   * (length === level), the same chain the recursive render builds.
   */
  isLast: boolean[];
  /**
   * Tree-level or per-node disabled flag. Disabled rows render (and can
   * be expanded through controlled `expandedKeys`) but are skipped as
   * keyboard focus stops.
   */
  disabled: boolean;
};

/**
 * Flatten the tree to its currently visible rows: children of a node are
 * included only while that node is expanded — the exact visibility rule
 * of the recursive render (`children?.length && expandedKeys.has(key)`).
 */
export function flattenVisibleTree(
  data: TreeNodeData[],
  expandedKeys: string[],
  treeDisabled: boolean
): VisibleTreeRow[] {
  const expanded = new Set(expandedKeys);
  const rows: VisibleTreeRow[] = [];

  const walk = (
    nodes: TreeNodeData[],
    level: number,
    parentKey: string | null,
    parentIsLast: boolean[]
  ) => {
    nodes.forEach((node, index) => {
      const isLastAtLevel = index === nodes.length - 1;
      const isLast = [...parentIsLast, isLastAtLevel];
      rows.push({
        key: node.key,
        node,
        level,
        parentKey,
        isLast,
        disabled: treeDisabled || !!node.disabled,
      });
      if (node.children?.length && expanded.has(node.key)) {
        walk(node.children, level + 1, node.key, isLast);
      }
    });
  };

  walk(data, 0, null, []);
  return rows;
}

export function flattenTreeData(data: TreeNodeData[]): TreeNodeData[] {
  const result: TreeNodeData[] = [];
  const walk = (nodes: TreeNodeData[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(data);
  return result;
}

export function findNodeByKey(
  data: TreeNodeData[],
  key: string
): TreeNodeData | null {
  for (const node of data) {
    if (node.key === key) return node;
    if (node.children?.length) {
      const found = findNodeByKey(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

export function getChildKeys(
  data: TreeNodeData[],
  parentKey: string
): string[] {
  const parent = findNodeByKey(data, parentKey);
  if (!parent?.children?.length) return [];
  const childKeys: string[] = [];
  const walk = (nodes: TreeNodeData[]) => {
    for (const node of nodes) {
      childKeys.push(node.key);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(parent.children);
  return childKeys;
}

export function getParentKey(
  data: TreeNodeData[],
  targetKey: string,
  parentKey?: string
): string | null {
  for (const node of data) {
    if (node.key === targetKey) return parentKey ?? null;
    if (node.children?.length) {
      const found = getParentKey(node.children, targetKey, node.key);
      if (found) return found;
    }
  }
  return null;
}

export function getAllLeafKeys(data: TreeNodeData[]): string[] {
  const keys: string[] = [];
  const walk = (nodes: TreeNodeData[]) => {
    for (const node of nodes) {
      if (!node.children?.length || node.isLeaf) {
        keys.push(node.key);
      } else {
        walk(node.children);
      }
    }
  };
  walk(data);
  return keys;
}
