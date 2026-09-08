import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { Transform } from '@dnd-kit/utilities';

import { css } from '@linaria/core';
import { createContext, useContext } from 'react';

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Non-component drag-and-drop primitives shared by the opt-in `sortable`
 * modes (TagInput, TagGroup) and the sortable wrappers in `sortable.tsx`.
 * Split from the component file per the react-refresh sibling-file
 * convention (Button/styles.ts, Chart/chart-elements.tsx precedents) —
 * not part of the public barrel; consumers needing custom sortable
 * surfaces should compose @dnd-kit directly.
 *
 * The @dnd-kit packages are optional peers following the Chart/recharts
 * contract: these helpers import them statically, so under preserveModules
 * only bundles that actually reach a `sortable` component resolve the
 * dependency.
 */

/** Sensors shared by every sortable surface: pointer drags with a small
 * distance threshold (so clicks never start a drag) plus the sortable
 * keyboard coordinate getter — Space lifts, arrows walk one item per
 * press, Space drops, Escape cancels. */
export function useSortableSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

/** Inline transform style for a sortable node; `transition` animates the
 * snap-back after a cancelled or completed drag. */
export function sortableItemStyle(
  transform: Transform | null,
  transition: string | null | undefined
) {
  return {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? undefined,
  };
}

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
