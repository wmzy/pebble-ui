import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';
import { sortableHandle, useSortableHandle } from '../../utils/sortable-shared';

type TagGroupItemProps = {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
};

const tag = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1) var(--haze-space-3);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text);
  border-radius: var(--haze-radius-full);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  line-height: var(--haze-leading-tight);
`;

const closeBtn = css`
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

export default function TagGroupItem({ children, onClose, className }: TagGroupItemProps) {
  const strings = useStrings('tagGroup');
  // Inside a sortable TagGroup the label becomes the drag handle (Space
  // lifts, arrows move, Space drops). Keeping the handle on the label — a
  // sibling of the close button — avoids nesting interactive roles (axe
  // nested-interactive); outside sortable groups the handle is null and
  // the DOM is exactly as before.
  const handle = useSortableHandle();
  const label = handle ? (
    <span
      x-class={[sortableHandle]}
      {...handle.attributes}
      {...handle.listeners}
    >
      {children}
    </span>
  ) : (
    children
  );

  return (
    <span x-class={[tag, className]}>
      {label}
      {onClose && (
        <button x-class={[closeBtn]} type="button" onClick={onClose} aria-label={strings.remove}>
          x
        </button>
      )}
    </span>
  );
}

export type { TagGroupItemProps };
