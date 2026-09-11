import type { Transform } from '@dnd-kit/utilities';

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Non-component drag-and-drop primitives for the Sortable* variants and
 * the sortable wrappers in `sortable.tsx`. Split from the component file
 * per the react-refresh sibling-file convention (Button/styles.ts,
 * Chart/chart-elements.tsx precedents) — not part of the public barrel;
 * consumers needing custom sortable surfaces should compose @dnd-kit
 * directly.
 *
 * The @dnd-kit packages are optional peers following the Chart/recharts
 * contract: these helpers import them statically, so under preserveModules
 * only bundles that actually reach a Sortable* variant resolve the
 * dependency.
 *
 * Base components (TagGroup, TagGroupItem, TagInputCore) must NOT import
 * this module or utils/sortable — either would drag the @dnd-kit runtime
 * into every consumer. Only the Sortable* variants and utils/sortable.tsx
 * import from here.
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
