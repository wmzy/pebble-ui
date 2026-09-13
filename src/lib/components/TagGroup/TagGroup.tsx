import type { ReactNode } from 'react';

import { group } from './tag-group-styles';

type TagGroupProps = {
  children: ReactNode;
  className?: string;
};

/** Plain non-draggable tag row. For drag-and-drop reordering use
 * SortableTagGroup (which statically imports the @dnd-kit runtime);
 * this base component stays free of the dnd runtime. */
export default function TagGroup({ children, className }: TagGroupProps) {
  return (
    <div data-slot="tag-group" x-class={[group, className]} role="group">
      {children}
    </div>
  );
}

export type { TagGroupProps };
