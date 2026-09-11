import { css } from '@linaria/core';

/**
 * Shared skin of the TagGroup family: the plain passthrough (TagGroup) and
 * the dnd-backed variant (SortableTagGroup) render the same wrapper, so
 * the class lives in one prefixed sibling file (Linaria slugs derive from
 * the file basename — bare `styles.ts` siblings collide across families).
 */

export const group = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
  font-family: var(--haze-font-sans);
`;
