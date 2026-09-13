import type { TreeNodeData } from './types';

/**
 * Pure move math for SortableTree — no React, no dnd, fully unit-testable.
 * The drag runtime reports a target row; these functions turn that into the
 * `onMove` payload and back into a controlled treeData update.
 */

/** Payload `SortableTree` reports after a completed drag. */
export type SortableTreeMoveInfo = {
  /** The dragged node's key. */
  key: string;
  /** The new parent's key — `null` for the root level. */
  parentKey: string | null;
  /**
   * Insertion index among the **new** parent's children, computed after
   * removing the dragged node from the tree — `splice(index, 0, node)`
   * lands exactly.
   */
  index: number;
};

/** Where a node currently sits in the tree. */
type NodeLocation = {
  node: TreeNodeData;
  parentKey: string | null;
  index: number;
};

function locateNode(
  nodes: TreeNodeData[],
  key: string,
  parentKey: string | null
): NodeLocation | null {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    if (node.key === key) return { node, parentKey, index };
    if (node.children?.length) {
      const found = locateNode(node.children, key, node.key);
      if (found) return found;
    }
  }
  return null;
}

/** Every key in the node's own subtree, including itself. */
export function subtreeKeys(node: TreeNodeData): Set<string> {
  const keys = new Set<string>([node.key]);
  const walk = (nodes: TreeNodeData[]) => {
    for (const child of nodes) {
      keys.add(child.key);
      if (child.children?.length) walk(child.children);
    }
  };
  if (node.children?.length) walk(node.children);
  return keys;
}

/**
 * Resolve a completed drag into the `onMove` payload. Dropping onto a row
 * inserts the dragged node **right after it** — as the target's next
 * sibling at the target's level — so a drop on a same-level row reorders
 * and a drop on a child of another parent reparents. Returns `null` when
 * nothing should happen: drop on itself, on one of its own descendants
 * (the subtree travels as one block and cannot move into itself), back
 * onto its own current position, or an unknown key.
 */
export function resolveTreeMove(
  data: TreeNodeData[],
  dragKey: string,
  overKey: string
): SortableTreeMoveInfo | null {
  if (dragKey === overKey) return null;
  const dragLoc = locateNode(data, dragKey, null);
  const overLoc = locateNode(data, overKey, null);
  if (!dragLoc || !overLoc) return null;
  if (subtreeKeys(dragLoc.node).has(overKey)) return null;

  let index = overLoc.index + 1;
  const sameParent = overLoc.parentKey === dragLoc.parentKey;
  // Same list: removing the dragged node first shifts the insertion point
  // down by one when it sat above the target.
  if (sameParent && dragLoc.index < index) index -= 1;
  if (sameParent && index === dragLoc.index) return null; // already there
  return { key: dragKey, parentKey: overLoc.parentKey, index };
}

/** Detach `key` (with its whole subtree) from a copy of `nodes`. */
function detachNode(
  nodes: TreeNodeData[],
  key: string
): { list: TreeNodeData[]; node: TreeNodeData | null } {
  let node: TreeNodeData | null = null;
  const list: TreeNodeData[] = [];
  for (const candidate of nodes) {
    if (candidate.key === key) {
      node = candidate;
      continue;
    }
    if (!node && candidate.children?.length) {
      const nested = detachNode(candidate.children, key);
      if (nested.node) {
        node = nested.node;
        list.push({ ...candidate, children: nested.list });
        continue;
      }
    }
    list.push(candidate);
  }
  return { list, node };
}

function containsKey(nodes: TreeNodeData[], key: string): boolean {
  return nodes.some(
    (node) =>
      node.key === key ||
      (!!node.children?.length && containsKey(node.children, key))
  );
}

function insertNode(
  nodes: TreeNodeData[],
  parentKey: string | null,
  index: number,
  node: TreeNodeData
): TreeNodeData[] {
  if (parentKey === null) {
    const list = [...nodes];
    list.splice(Math.min(Math.max(index, 0), list.length), 0, node);
    return list;
  }
  return nodes.map((candidate) => {
    if (candidate.key === parentKey) {
      const children = [...(candidate.children ?? [])];
      children.splice(
        Math.min(Math.max(index, 0), children.length),
        0,
        node
      );
      return { ...candidate, children };
    }
    if (candidate.children?.length) {
      return {
        ...candidate,
        children: insertNode(candidate.children, parentKey, index, node),
      };
    }
    return candidate;
  });
}

/**
 * Apply a reported move to a tree array — the controlled `treeData`
 * update a consumer makes in `onMove`: detach the node with its whole
 * subtree, then splice it into the new parent's children. Returns fresh
 * arrays on every changed path (originals untouched). A parent key that
 * no longer resolves falls back to appending at the root level rather
 * than dropping the node.
 */
export function applyTreeMove(
  data: TreeNodeData[],
  info: SortableTreeMoveInfo
): TreeNodeData[] {
  const { list, node } = detachNode(data, info.key);
  if (!node) return data;
  const parentKnown =
    info.parentKey === null || containsKey(list, info.parentKey);
  return insertNode(
    list,
    parentKnown ? info.parentKey : null,
    parentKnown ? info.index : list.length,
    node
  );
}
