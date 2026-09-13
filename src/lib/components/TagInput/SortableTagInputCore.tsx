import type { TagInputCoreProps } from './TagInputCore';

import { rectSortingStrategy, useSortable } from '@dnd-kit/sortable';

import { SortableRegion } from '../../utils/sortable';
import { sortableItemStyle } from '../../utils/sortable-shared';

import TagInputCore from './TagInputCore';
import { tag, removeBtn, tagHandle, tagDragging } from './tag-input-styles';

/**
 * Props for `SortableTagInputCore` — the full `TagInputCoreProps` field
 * set (value/onChange/placeholder/maxTags/disabled/className/id/aria/ref)
 * minus the internal injection seams, which drag reordering replaces.
 */
type SortableTagInputCoreProps = Omit<
  TagInputCoreProps,
  'renderTag' | 'wrapTagList'
>;

type SortableTagProps = {
  id: number;
  label: string;
  removeLabel: string;
  onRemove: () => void;
};

/** One sortable tag listitem. The li itself stays a plain listitem (axe
 * aria-required-children: ul children must be listitems); the label span
 * is the drag handle with dnd-kit's button semantics. */
function SortableTag({ id, label, removeLabel, onRemove }: SortableTagProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <li
      ref={setNodeRef}
      data-slot="item"
      style={sortableItemStyle(transform, transition)}
      x-class={[tag, isDragging && tagDragging]}
    >
      <span data-slot="handle" x-class={[tagHandle]} {...attributes} {...listeners}>
        {label}
      </span>
      <button
        data-slot="remove-button"
        x-class={[removeBtn]}
        type="button"
        onClick={onRemove}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault();
            onRemove();
          }
        }}
        aria-label={removeLabel}
      >
        x
      </button>
    </li>
  );
}

/**
 * Drag-and-drop tag reordering over the @dnd-kit dependency. This
 * component statically imports `@dnd-kit/core`, `@dnd-kit/sortable` and
 * `@dnd-kit/utilities` (the plain `TagInputCore` never touches them).
 * Reorders leave through `onChange`
 * with the new array — the same single exit as add/remove. Keyboard:
 * focus a tag's label, Space lifts, arrows move, Space drops, Escape
 * cancels.
 */
export default function SortableTagInputCore(props: SortableTagInputCoreProps) {
  const { disabled } = props;
  // A disabled input must not offer drag handles either.
  return (
    <TagInputCore
      {...props}
      renderTag={
        disabled
          ? undefined
          : (slot) => (
              <SortableTag
                key={slot.index}
                id={slot.index}
                label={slot.tag}
                removeLabel={slot.removeLabel}
                onRemove={slot.onRemove}
              />
            )
      }
      wrapTagList={
        disabled
          ? undefined
          : (list, { count, onMove }) => (
              <SortableRegion
                ids={Array.from({ length: count }, (_, i) => i)}
                strategy={rectSortingStrategy}
                onMove={onMove}
              >
                {list}
              </SortableRegion>
            )
      }
    />
  );
}

export type { SortableTagInputCoreProps };
