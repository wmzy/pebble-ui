import {css} from '@linaria/core';

/**
 * Shared TagInput skin — the tag list, chip, remove-button and drag classes
 * `TagInputCore` and `SortableTagInputCore` both wear. Component-prefixed
 * basename (never bare `styles.ts`): Linaria derives class slugs from the
 * file basename, so two bare-named sibling style files would collide into
 * the same `haze-styles__*` classes (Badge/Button e2e precedent).
 */

/* Tags flow inline with the input: the list itself wraps while staying a
   flex participant of the container. */
export const listWrap = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const tag = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-0) var(--haze-space-2);
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
`;

export const removeBtn = css`
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  padding: var(--haze-space-1);
  min-width: 1.5rem;
  min-height: 1.5rem;

  &:hover {
    color: var(--haze-color-text);
  }
`;

/* The sortable mode's drag handle: the label text span inside the li. The
   li keeps its listitem role, so the handle carries the interactive bits. */
export const tagHandle = css`
  cursor: grab;
  touch-action: none;
  user-select: none;
`;

export const tagDragging = css`
  /* Stack the translated tag above its siblings while dragging. */
  position: relative;
  z-index: 1;
`;
