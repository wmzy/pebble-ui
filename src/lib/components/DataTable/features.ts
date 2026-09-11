import type { ReactNode } from 'react';

import {
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  metaHelper,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table';

/**
 * Props handed to a custom cell editor (`meta.editor` as a function): the
 * current cell value, the row and column (structural views of the TanStack
 * objects), and the two exit channels. The editor is uncontrolled UI inside
 * the cell — call `onSave` with the next value (routed to `onCellEdit`,
 * which owns the data) or `onCancel` to leave the value untouched. After
 * either, move focus yourself if needed (e.g. back onto the cell) —
 * DataTable cannot know where a custom editor's focusables live.
 */
type DataTableCellEditorProps = {
  /** Current cell value (`row.getValue(column.id)`), untyped. */
  value: unknown;
  /** Structural view of the TanStack row being edited. */
  row: {
    id: string;
    index: number;
    depth: number;
    original: unknown;
    getValue: (columnId: string) => unknown;
  };
  /** Structural view of the column being edited. */
  column: { id: string };
  /** Exits edit mode and reports the next value through `onCellEdit`. */
  onSave: (value: unknown) => void;
  /** Exits edit mode leaving the value untouched. */
  onCancel: () => void;
};

/** Per-column metadata understood by DataTable. */
type DataTableColumnMeta = {
  /** Column-level sorting switch — overrides the table-level `sortable` default. */
  sortable?: boolean;
  /**
   * Column width, applied through a `<colgroup>` shared by every table in
   * the layout: a number is px, strings pass through as CSS lengths
   * (`'25%'`, `'12rem'`). Wins over the native TanStack `size` field, which
   * is read as a px fallback. Columns without any width keep their previous
   * sizing — content-driven in normal mode, an equal share of the remainder
   * when `virtualized`.
   */
  width?: number | string;
  /**
   * Pin the column to the scroll area's left/right edge so it stays visible
   * while the table scrolls horizontally. Normal mode only — ignored when
   * `virtualized`, where each row is its own table with no shared
   * scrollport. The sticky offset sums the widths of the preceding fixed
   * columns on the same side, starting from the selection column, so fixed
   * columns should declare numeric px widths; non-numeric widths contribute
   * nothing to the offset math. Honored on leaf columns.
   */
  fixed?: 'left' | 'right';
  /**
   * Column-level resizing switch — overrides the table-level `resizable`
   * default (`false` hides this column's handle when the table is
   * resizable; `true` is the per-column default). The native TanStack
   * `enableResizing` field wins over this.
   */
  resizable?: boolean;
  /**
   * `false` pins the column in the visibility menu — it renders without a
   * toggle and can never be hidden. The native TanStack `enableHiding`
   * field wins over this.
   */
  hideable?: boolean;
  /**
   * Column-level filtering switch — overrides the table-level `filterable`
   * default, deciding whether the filter row renders an input for this
   * column. The native TanStack `enableColumnFilter` field wins over this.
   */
  filterable?: boolean;
  /**
   * `true` keeps the column out of `dataTableToCsv` exports — the flag for
   * columns whose cells are presentation-only (badges, action buttons) or
   * internal (row ids) and meaningless in a spreadsheet.
   */
  excludeFromExport?: boolean;
  /**
   * Cell editor for this column while the table-level `editable` switch is
   * on. `'text'` and `'number'` render the built-in inline editor (an
   * `InputCore`; the number variant parses the draft on save and reports
   * `null` when cleared); a function renders a fully custom editor through
   * `DataTableCellEditorProps`; `false` opts the column out. Defaults to
   * `'text'` — every column is editable unless switched off here.
   */
  editor?:
    | false
    | 'text'
    | 'number'
    | ((props: DataTableCellEditorProps) => ReactNode);
};

/**
 * The feature set stitched into every DataTable instance — TanStack v9's
 * tree-shaking contract: only the row models and registries the component
 * actually drives are registered. `columnMeta` is a type-only slot that
 * types `meta` on column definitions.
 *
 * The resizing, expanding, visibility and filtering features are registered
 * unconditionally but stay inert until their table-level props opt in —
 * with empty state and no `getSubRows` wired their row-model steps are
 * identities, so the default render path is unchanged. The column-sizing
 * feature's `size: 150` column-def default is neutralized through
 * `defaultColumn` (see there). */
const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  columnVisibilityFeature,
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  columnSizingFeature,
  columnResizingFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export { dataTableFeatures };
export type { DataTableCellEditorProps, DataTableColumnMeta };
