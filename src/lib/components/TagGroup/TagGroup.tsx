import type { ReactNode } from 'react';

import { Children } from 'react';

import { css } from '@linaria/core';
import { arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';

import { SortableItem, SortableRegion } from '../../utils/sortable';

type TagGroupProps = {
  children: ReactNode;
  className?: string;
  /**
   * Opt-in drag-and-drop reordering (@dnd-kit optional peers). Each chip
   * becomes draggable; keyboard: focus a chip, Space lifts, arrows move,
   * Space drops, Escape cancels.
   */
  sortable?: boolean;
  /**
   * Receives `nextOrder` — the new sequence of original child indices —
   * after a completed drag. Reorder the children you pass accordingly;
   * without a handler a drop only animates back to the source position.
   */
  onReorder?: (nextOrder: number[]) => void;
};

const group = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
  font-family: var(--haze-font-sans);
`;

export default function TagGroup({
  children,
  className,
  sortable = false,
  onReorder,
}: TagGroupProps) {
  // The sortable mode needs positional indices over the child list, so it
  // renders through Children.toArray; the plain path hands `children`
  // straight through, untouched.
  const items = Children.toArray(children);
  const ids = items.map((_, index) => index);

  return (
    <div x-class={[group, className]} role="group">
      {sortable ? (
        <SortableRegion
          ids={ids}
          strategy={rectSortingStrategy}
          onMove={(from, to) => onReorder?.(arrayMove(ids, from, to))}
        >
          {items.map((child, index) => (
            <SortableItem key={index} id={index}>
              {child}
            </SortableItem>
          ))}
        </SortableRegion>
      ) : (
        children
      )}
    </div>
  );
}

export type { TagGroupProps };
