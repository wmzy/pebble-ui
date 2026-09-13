import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEventHandler,
  ReactNode,
} from 'react';
import type {
  CollisionDetection,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';

import type { SortableTreeMoveInfo } from './sortable-tree-utils';
import type { TreeNodeData, TreeProps } from './types';

import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useMemo, useRef, useState } from 'react';

import { SortableHandleContext, useSortableHandle } from '../../utils/sortable-handle';
import { sortableItemStyle, useSortableSensors } from '../../utils/sortable-shared';

import Tree from './Tree';
import { filterTreeByQuery, findNodeByKey, flattenVisibleTree } from './utils';
import { resolveTreeMove, subtreeKeys } from './sortable-tree-utils';
import {
  grip,
  row,
  rowDraggable,
  rowDragging,
  rowInSubtree,
} from './sortable-tree-styles';

/**
 * Props for `SortableTree` — the full `TreeProps` field set (the tree
 * keeps all of its expand/select/check/keyboard/virtual behavior) plus
 * the drag contract. The internal injection seams are hidden: drag
 * reordering owns them.
 */
export type SortableTreeProps = {
  /**
   * Reports a completed drag: the dragged `key` should become the child
   * at `index` of `parentKey` (`null` = root level), computed after
   * removing the node from its old spot — splice it right in. Update
   * `treeData` accordingly (controlled, one-way — the same philosophy as
   * `SortableTagGroup`); without a handler a drop only animates back to
   * the source position. The node's whole subtree travels with it.
   */
  onMove?: (info: SortableTreeMoveInfo) => void;
  /**
   * `false` (default): the whole row is the drag activator — an 8px
   * pointer move threshold keeps clicks, expands and checks untouched.
   * `true`: only the leading grip icon starts pointer drags; keyboard
   * drags (Space lifts on the focused row) work either way.
   */
  dragHandle?: boolean;
} & Omit<TreeProps, 'rowWrap' | 'keyboardNavigation'>;

/** Six-dot grip svg — decorative (aria-hidden on the span). */
const GripIcon = () => (
  <svg viewBox='0 0 10 16' fill='currentColor'>
    <circle cx='2.5' cy='2.5' r='1.5' />
    <circle cx='7.5' cy='2.5' r='1.5' />
    <circle cx='2.5' cy='8' r='1.5' />
    <circle cx='7.5' cy='8' r='1.5' />
    <circle cx='2.5' cy='13.5' r='1.5' />
    <circle cx='7.5' cy='13.5' r='1.5' />
  </svg>
);

/**
 * The pointer-only drag grip rendered ahead of the title when
 * `dragHandle` is on. It picks the activator listeners up through the
 * same handle seam the sortable tag components use — dnd's keyboard
 * lift stays on the treeitem row, so the grip itself is aria-hidden.
 */
function TreeDragGrip() {
  const handle = useSortableHandle();
  if (!handle) return null;
  const onPointerDown = handle.listeners?.onPointerDown as
    | PointerEventHandler<HTMLSpanElement>
    | undefined;
  return (
    <span aria-hidden='true' data-slot='drag-handle' x-class={[grip]} onPointerDown={onPointerDown}>
      <GripIcon />
    </span>
  );
}

type SortableRowProps = {
  node: TreeNodeData;
  treeDisabled: boolean;
  /** Drag active and this row sits inside the dragged subtree. */
  inDraggedSubtree: boolean;
  /** `dragHandle` mode: pointer drags start on the grip only. */
  handleMode: boolean;
  children: ReactNode;
};

/**
 * The sortable node around one treeitem row. In row mode the wrapper is
 * also the drag activator (pointer via spread listeners, keyboard via
 * bubbled keydowns from the focused treeitem); in handle mode pointer
 * activation moves to the grip while keyboard stays on the row.
 */
function SortableRow({
  node,
  treeDisabled,
  inDraggedSubtree,
  handleMode,
  children,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.key, disabled: treeDisabled || !!node.disabled });

  // dnd-kit's activator onKeyDown is the keyboard lift. When it fires it
  // preventDefaults the event; stop propagation right there so the same
  // keydown cannot also run the tree's keymap (Space would toggle a
  // checkbox on lift). The `keyboardNavigation` seam only kicks in from
  // the next keydown on — the drag state flushes after this dispatch.
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const lift = listeners?.onKeyDown as
      | ((event: ReactKeyboardEvent<HTMLDivElement>) => void)
      | undefined;
    lift?.(event);
    if (event.defaultPrevented) event.stopPropagation();
  }

  return (
    <SortableHandleContext.Provider value={{ attributes, listeners }}>
      <div
        ref={setNodeRef}
        data-slot='sortable-row'
        data-sortable-row=''
        style={sortableItemStyle(transform, transition)}
        x-class={[
          row,
          !handleMode && rowDraggable,
          isDragging && rowDragging,
          inDraggedSubtree && rowInSubtree,
        ]}
        {...(handleMode ? undefined : listeners)}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </SortableHandleContext.Provider>
  );
}

/**
 * Drag-and-drop reorderable variant of Tree — built on the @dnd-kit
 * dependency (the plain `Tree` never touches it): same-level reorders
 * and cross-parent moves, the dragged node's whole subtree follows, and
 * keyboard sortable works with Space / arrows / Space / Escape on the
 * focused row. Dropping onto a row inserts right after it, so a drop on
 * a child of another parent reparents; nodes never drop into their own
 * subtree. All tree state stays controlled — `onMove` reports
 * `{ key, parentKey, index }` and the consumer updates `treeData`.
 */
export default function SortableTree({
  treeData,
  disabled = false,
  dragHandle = false,
  titleRender,
  searchValue,
  expandedKeys,
  onExpand,
  onMove,
  className,
  ...rest
}: SortableTreeProps) {
  const sensors = useSortableSensors();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const draggedSubtreeRef = useRef<Set<string>>(new Set());

  // Mirror of the tree's expansion, so the SortableContext item list
  // tracks the visible rows: uncontrolled toggles leave through onExpand
  // (wrapped below), an array-valued controlled `expandedKeys` is used
  // directly. Search auto-expanded ancestors are folded in the same way
  // the tree itself does.
  const [mirrorExpanded, setMirrorExpanded] = useState<string[]>([]);
  const handleExpand = useCallback<
    NonNullable<TreeProps['onExpand']>
  >(
    (keys, info) => {
      setMirrorExpanded(keys);
      onExpand?.(keys, info);
    },
    [onExpand]
  );

  const filtered = useMemo(
    () => filterTreeByQuery(treeData, searchValue),
    [treeData, searchValue]
  );
  const baseExpanded = Array.isArray(expandedKeys)
    ? expandedKeys
    : mirrorExpanded;
  const effectiveExpandedKeys = useMemo(() => {
    if (!filtered || filtered.ancestorKeys.length === 0) return baseExpanded;
    return Array.from(new Set([...baseExpanded, ...filtered.ancestorKeys]));
  }, [baseExpanded, filtered]);

  const displayData = filtered ? filtered.tree : treeData;
  const items = useMemo(
    () =>
      flattenVisibleTree(displayData, effectiveExpandedKeys, false).map(
        (visibleRow) => visibleRow.key
      ),
    [displayData, effectiveExpandedKeys]
  );

  // The dragged subtree travels as one block: its descendants are never
  // drop targets, so they leave the collision candidate set. The dragged
  // row itself stays a candidate — dnd-kit's keyboard getter is sticky
  // over the current target, and a resting drag must read as "over
  // itself" (a no-op drop) rather than already over its next sibling,
  // or the first arrow press would skip that sibling.
  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const containers =
        activeKey !== null
          ? args.droppableContainers.filter(
              (container) =>
                String(container.id) === activeKey ||
                !draggedSubtreeRef.current.has(String(container.id))
            )
          : args.droppableContainers;
      return closestCenter({ ...args, droppableContainers: containers });
    },
    [activeKey]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const key = String(event.active.id);
      const node = findNodeByKey(treeData, key);
      draggedSubtreeRef.current = node ? subtreeKeys(node) : new Set();
      setActiveKey(key);
    },
    [treeData]
  );

  const endDrag = useCallback(() => {
    draggedSubtreeRef.current = new Set();
    setActiveKey(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      endDrag();
      if (!event.over) return;
      const info = resolveTreeMove(
        treeData,
        String(event.active.id),
        String(event.over.id)
      );
      if (info) onMove?.(info);
    },
    [endDrag, onMove, treeData]
  );

  const wrapRow = useCallback(
    (rowNode: ReactNode, node: TreeNodeData) => (
      <SortableRow
        node={node}
        treeDisabled={disabled}
        handleMode={dragHandle}
        inDraggedSubtree={
          activeKey !== null &&
          activeKey !== node.key &&
          draggedSubtreeRef.current.has(node.key)
        }
      >
        {rowNode}
      </SortableRow>
    ),
    [activeKey, disabled, dragHandle]
  );

  // dragHandle mode injects the grip ahead of the title; a consumer
  // titleRender keeps rendering. Without either, no titleRender is
  // passed so the base tree (and its search highlighting) is untouched.
  const mergedTitleRender =
    dragHandle || titleRender
      ? (node: TreeNodeData) => (
          <>
            {dragHandle && <TreeDragGrip />}
            {titleRender ? titleRender(node) : node.title}
          </>
        )
      : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={endDrag}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <Tree
          treeData={treeData}
          disabled={disabled}
          searchValue={searchValue}
          titleRender={mergedTitleRender}
          expandedKeys={expandedKeys}
          onExpand={handleExpand}
          rowWrap={wrapRow}
          keyboardNavigation={activeKey === null}
          className={className}
          {...rest}
        />
      </SortableContext>
    </DndContext>
  );
}

export type { SortableTreeMoveInfo };
