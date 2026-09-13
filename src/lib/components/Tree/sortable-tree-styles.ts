import { css } from '@linaria/core';

/**
 * Linaria classes for SortableTree — sibling file per the repo convention
 * (sortable-tree- prefix keeps the class slug distinct from every other
 * *-styles.ts, the tag-group-styles precedent). The classes land in the
 * `tree` css family automatically (same component directory).
 */

/**
 * The sortable node wrapper around every treeitem (the element that
 * carries useSortable's ref). `position: relative` anchors the dragging
 * row's z-index stack; the inline transform/transition (from
 * sortableItemStyle) animates the drag and the snap-back.
 */
export const row = css`
  position: relative;
`;

/**
 * Whole-row drag affordance (`dragHandle: false`): the wrapper grabs the
 * pointer for PointerSensor (touch-action: none) and shows the grab
 * cursor — the treeitem's own `cursor: pointer` is inherited over so the
 * row reads as draggable while the switcher/checkbox keep their cursors.
 * Clicks still work: PointerSensor's 8px distance constraint keeps plain
 * taps from ever starting a drag.
 */
export const rowDraggable = css`
  cursor: grab;
  touch-action: none;

  & [role='treeitem'] {
    cursor: inherit;
  }
`;

/** The dragged row stacks above its siblings while it flies. */
export const rowDragging = css`
  z-index: 1;
`;

/**
 * Rows inside the dragged subtree dim while their ancestor flies — the
 * subtree follows as one block, so its rows are never drop targets.
 */
export const rowInSubtree = css`
  opacity: 0.35;
`;

/**
 * The drag grip (`dragHandle: true`): pointer-activated only and hidden
 * from the accessibility tree — keyboard drags stay on the treeitem row
 * (Space lifts, arrows move, Space drops), keeping the tree's single
 * roving tab stop intact.
 */
export const grip = css`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-inline-end: var(--haze-space-1);
  color: var(--haze-color-text-muted);
  cursor: grab;
  touch-action: none;

  svg {
    width: 10px;
    height: 14px;
  }
`;
