import type { ReactNode } from 'react';

import { css } from '@linaria/core';
import { useId } from 'react';

type ComboboxGroupProps = {
  /**
   * Heading rendered above the group's options. Sticky while the
   * listbox scrolls: pinned to the scrollport top until the next
   * group's heading pushes past it (cmdk's form).
   */
  label: ReactNode;
  className?: string;
  /** The group's `role="option"` rows. */
  children: ReactNode;
};

/**
 * Sticky group heading inside the plain (non-virtualized) combobox
 * listbox. `box-sizing` keeps the heading's declared padding inside
 * its own box when the wrapper stretches it; `z-index` keeps the
 * pinned heading above the option rows scrolling beneath it. The
 * virtualized path composes the same text style on VirtualList's
 * absolutely-positioned header wrapper instead (chrome lives there).
 */
const groupHeading = css`
  position: sticky;
  top: 0;
  z-index: 1;
  box-sizing: border-box;
  background: var(--haze-color-bg);
  border-bottom: 1px solid var(--haze-color-border);
  padding: var(--haze-space-1) var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

/**
 * One labelled section of combobox options: `role="group"` named by
 * its heading (`aria-labelledby`), the cmdk `CommandGroup` shape.
 * Combobox clusters consecutive options sharing a `group` label into
 * one section; groups whose every option was filtered out are not
 * rendered at all, and keyboard navigation stays continuous across
 * sections (the highlight lives in the flat option order).
 */
export default function ComboboxGroup({
  label,
  className,
  children,
}: ComboboxGroupProps) {
  const headingId = useId();
  return (
    <div data-slot='group' role="group" aria-labelledby={headingId} x-class={[className]}>
      <div id={headingId} data-slot='group-label' x-class={[groupHeading]}>
        {label}
      </div>
      {children}
    </div>
  );
}

export type { ComboboxGroupProps };
