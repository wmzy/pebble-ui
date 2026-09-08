import type { ReactNode } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { SortingStrategy } from '@dnd-kit/sortable';

import { css } from '@linaria/core';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';

import {
  SortableHandleContext,
  sortableItemStyle,
  useSortableSensors,
} from './sortable-shared';

/**
 * Internal sortable wrapper components (the non-component primitives live
 * in `sortable-shared.ts`). Not part of the public barrel — see the header
 * comment there for the optional-peer contract.
 */

type SortableRegionProps = {
  /** Stable sortable ids, one per item (both call sites use indices). */
  ids: (string | number)[];
  /** Layout strategy — rectSortingStrategy for wrapping chip rows,
   * verticalListSortingStrategy for stacked lists. */
  strategy: SortingStrategy;
  /** Index move resolved from a completed drag; never called when the drop
   * lands back on the origin item. */
  onMove: (from: number, to: number) => void;
  children: ReactNode;
};

/** DndContext + SortableContext wiring with the shared sensors and
 * closest-center collision. Renders no DOM of its own, so it can wrap a
 * ul or a chip row without changing layout or semantics. */
export function SortableRegion({ ids, strategy, onMove, children }: SortableRegionProps) {
  const sensors = useSortableSensors();

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMove(ids.indexOf(active.id), ids.indexOf(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={strategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

const sortableNode = css`
  display: inline-flex;
`;

const sortableNodeDragging = css`
  /* Stack the translated item above its siblings while dragging. */
  position: relative;
  z-index: 1;
`;

type SortableItemProps = {
  id: string | number;
  className?: string;
  children: ReactNode;
};

/**
 * Non-semantic wrapper span that turns its child into a sortable item. The
 * wrapper itself stays free of interactive semantics (axe nested-interactive
 * stays clean even when the child contains buttons); the child picks up the
 * drag handle via useSortableHandle. List-semantic parents (TagInput's ul)
 * inline useSortable directly so the li keeps its listitem role.
 */
export function SortableItem({ id, className, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <SortableHandleContext.Provider value={{ attributes, listeners }}>
      <span
        ref={setNodeRef}
        style={sortableItemStyle(transform, transition)}
        x-class={[sortableNode, isDragging && sortableNodeDragging, className]}
      >
        {children}
      </span>
    </SortableHandleContext.Provider>
  );
}
