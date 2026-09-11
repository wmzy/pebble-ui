import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';

import { css } from '@linaria/core';
import { createContext, useContext } from 'react';

/**
 * Dnd-free seam for the drag-handle contract. The @dnd-kit imports here are
 * type-only and erased at runtime, so consumers that must stay free of the
 * @dnd-kit runtime (TagGroupItem) import from this module; the provider
 * side (SortableItem in utils/sortable.tsx) imports the same context from
 * here. Split from sortable-shared.ts so the base components never reach
 * the dnd runtime. Not part of the public barrel.
 */

export type SortableHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

/**
 * Handle props for the item's drag activator. SortableItem provides it so
 * the item component (e.g. TagGroupItem) can place the interactive handle
 * on its label span — a sibling of any close button — instead of letting
 * dnd-kit's role=button land on an ancestor of interactive content (axe
 * nested-interactive). Null outside a SortableItem.
 */
export const SortableHandleContext = createContext<SortableHandle | null>(null);

export function useSortableHandle() {
  return useContext(SortableHandleContext);
}

/** Drag-affordance styles for the element that carries the handle props
 * (cursor + letting PointerSensor own touch drags instead of scrolling). */
export const sortableHandle = css`
  cursor: grab;
  touch-action: none;
  user-select: none;
`;
