import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { css } from '@linaria/core';

/**
 * One key→value pair. `span` is measured in description columns
 * (label+value pairs per row), matching AntD: `span: 2` stretches the
 * value across a second column pair on the same row.
 */
type DescriptionsItem = {
  /** Stable identity for the pair within `items`. */
  key: string;
  /** The term (`<dt>`). */
  label: ReactNode;
  /** The description (`<dd>`). */
  children: ReactNode;
  /** Columns the item occupies; clamped to `columns`. Default 1. */
  span?: number;
};

type DescriptionsProps = {
  /** Ordered pairs to display — the list is data-driven (no children). */
  items: DescriptionsItem[];
  /** Description columns (label+value pairs per row). Default 3. */
  columns?: number;
  /** Bordered variant: full grid lines plus a shaded label column. */
  bordered?: boolean;
  /** Cell padding density. Default 'md'. */
  size?: 'sm' | 'md';
  /** Heading rendered above the list (outside the `<dl>`). */
  title?: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title'>;

/* dl/dt/dd over a table: a definition list is the semantic match for
 * name→value groups — assistive tech announces it as a description list
 * (each dt paired with its dd), whereas a table implies a data grid with
 * row/column header semantics these static pairs do not have. CSS Grid
 * on the dl (items opt out of their group wrapper via display: contents)
 * still gives column alignment and spanning, so semantics cost nothing. */

const root = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

const titleStyle = css`
  margin: 0 0 var(--haze-space-3);
  font-size: var(--haze-text-base);
  font-weight: var(--haze-weight-semibold);
`;

/* One description column = one auto label track + one flexible value
 * track. Auto label tracks align every label in a column; the track
 * count comes from the inline grid-template-columns (a var() inside
 * repeat() is not portable across engines). */
const listDefault = css`
  display: grid;
  column-gap: var(--haze-space-3);
  row-gap: var(--haze-space-1);
  margin: 0;
`;

/* Bordered uses the gap-line technique: a 1px grid gap over a
 * border-colored background paints every internal grid line (including
 * the label|value separators), while dt/dd carry solid fills. */
const listBordered = css`
  display: grid;
  column-gap: 1px;
  row-gap: 1px;
  margin: 0;
  background: var(--haze-color-border);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  overflow: hidden;
`;

/* Group wrapper keeps the dt/dd pairing valid HTML (dl > div > dt+dd)
 * while contributing no box of its own. */
const group = css`
  display: contents;
`;

const labelCell = css`
  color: var(--haze-color-text-secondary);
  font-weight: var(--haze-weight-medium);
`;

const valueCell = css`
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const labelCellBordered = css`
  background: var(--haze-color-bg-subtle);
`;

const valueCellBordered = css`
  background: var(--haze-color-bg);
`;

const sizeSm = css`
  padding: var(--haze-space-1) var(--haze-space-2);
`;

const sizeMd = css`
  padding: var(--haze-space-2) var(--haze-space-3);
`;

export default function Descriptions({
  items,
  columns = 3,
  bordered = false,
  size = 'md',
  title,
  className,
  style,
  ...rest
}: DescriptionsProps) {
  const columnCount = Math.max(1, Math.floor(columns));
  const sizeClass = size === 'sm' ? sizeSm : sizeMd;

  return (
    <div data-slot="descriptions" x-class={[root, className]} style={style} {...rest}>
      {title && <div data-slot="title" x-class={[titleStyle]}>{title}</div>}
      <dl
        data-slot="list"
        x-class={[bordered ? listBordered : listDefault]}
        style={{ gridTemplateColumns: `repeat(${columnCount}, auto minmax(0, 1fr))` }}
      >
        {items.map(({ key, label, children, span = 1 }) => {
          const spanned = Math.min(Math.max(span, 1), columnCount);
          return (
            <div data-slot="group" x-class={[group]} key={key}>
              <dt data-slot="label" x-class={[labelCell, sizeClass, bordered && labelCellBordered]}>
                {label}
              </dt>
              <dd
                data-slot="content"
                x-class={[valueCell, sizeClass, bordered && valueCellBordered]}
                style={{ gridColumn: `span ${spanned * 2 - 1}` }}
              >
                {children}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export type { DescriptionsProps, DescriptionsItem };
