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

/**
 * Case-insensitive `[start, end)` ranges of every non-overlapping
 * occurrence of `query` inside `text`, left to right. Empty when the
 * query is empty or absent.
 */
export function matchRanges(
  text: string,
  query: string
): [number, number][] {
  if (!query) return [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const ranges: [number, number][] = [];
  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    ranges.push([index, index + lowerQuery.length]);
    index = lowerText.indexOf(lowerQuery, index + lowerQuery.length);
  }
  return ranges;
}

/** Does the node's own title match? Only string titles can match —
 *  ReactNode titles stay searchable through their descendants. */
export function nodeTitleMatches(
  node: TreeNodeData,
  query: string
): boolean {
  return (
    typeof node.title === 'string' && matchRanges(node.title, query).length > 0
  );
}

/** Result of `filterTreeByQuery`. */
export type FilteredTree = {
  /** The pruned tree: matched nodes plus the ancestors leading to them. */
  tree: TreeNodeData[];
  /** Keys whose own title matched the query. */
  matchedKeys: string[];
  /** Keys of the strict ancestors of matches — auto-expanded while the
   *  search is active so every hit stays visible. */
  ancestorKeys: string[];
};

/**
 * Filters the tree to the nodes whose own title matches `query`
 * (case-insensitive) plus every ancestor on the path to them. Returns
 * `null` when the query is empty (search inactive) so callers can keep
 * the unfiltered data by reference.
 */
export function filterTreeByQuery(
  data: TreeNodeData[],
  query: string | undefined
): FilteredTree | null {
  if (!query) return null;

  const matchedKeys: string[] = [];
  const ancestorKeys: string[] = [];

  const walk = (nodes: TreeNodeData[]): TreeNodeData[] => {
    const kept: TreeNodeData[] = [];
    for (const node of nodes) {
      const keptChildren = node.children?.length
        ? walk(node.children)
        : [];
      const selfMatch = nodeTitleMatches(node, query);
      if (selfMatch) matchedKeys.push(node.key);
      if (!selfMatch && keptChildren.length === 0) continue;
      // A kept child only exists on a match path, so any node with kept
      // children is an ancestor of at least one match.
      if (keptChildren.length > 0) {
        ancestorKeys.push(node.key);
        kept.push({ ...node, children: keptChildren });
      } else {
        kept.push(node);
      }
    }
    return kept;
  };

  return { tree: walk(data), matchedKeys, ancestorKeys };
}

/**
 * Overlays lazy-loaded children onto the controlled data: a childless
 * node with a cache entry adopts the loaded array; an empty load marks
 * the node as a leaf (the server said "no children"). Returns `data`
 * untouched (same reference) when nothing is cached, so memoized
 * downstream work stays stable.
 */
export function mergeLoadedChildren(
  data: TreeNodeData[],
  loaded: Record<string, TreeNodeData[]>
): TreeNodeData[] {
  if (Object.keys(loaded).length === 0) return data;

  const merge = (nodes: TreeNodeData[]): TreeNodeData[] =>
    nodes.map((node) => {
      if (node.children?.length) {
        return { ...node, children: merge(node.children) };
      }
      const cached = loaded[node.key];
      if (!cached) return node;
      return cached.length
        ? { ...node, children: cached }
        : { ...node, isLeaf: true };
    });

  return merge(data);
}

/**
 * Drops cache entries that no longer map onto the controlled data: keys
 * that vanished, or nodes that now ship children of their own
 * (controlled data wins over a stale load). Keeps the same reference
 * when nothing is pruned.
 */
export function pruneLoadedChildren(
  loaded: Record<string, TreeNodeData[]>,
  data: TreeNodeData[]
): Record<string, TreeNodeData[]> {
  const entries = Object.entries(loaded);
  if (entries.length === 0) return loaded;

  const kept: Record<string, TreeNodeData[]> = {};
  let pruned = false;
  for (const [key, children] of entries) {
    const node = findNodeByKey(data, key);
    if (node && !node.children?.length) {
      kept[key] = children;
    } else {
      pruned = true;
    }
  }
  return pruned ? kept : loaded;
}
