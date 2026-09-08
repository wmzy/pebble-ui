import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type {
  ColumnDef,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createPaginatedRowModel,
  createSortedRowModel,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { CheckboxCore } from '../Checkbox';
import { Empty } from '../Empty';
import { Pagination } from '../Pagination';
import { Skeleton } from '../Skeleton';
import { TableBody, TableCell, TableHead } from '../Table';
import { VirtualList } from '../VirtualList';

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
};

/** Windowing configuration for the table body, reusing `VirtualList`. */
type DataTableVirtualized =
  | boolean
  | {
      /** Fixed row height in px — must match the rendered row (custom cell
       * padding or multi-line content need this form). */
      rowHeight: number;
      /** Extra rows kept mounted above/below the visible window.
       * Defaults to `VirtualList`'s `5`. */
      overscan?: number;
    };

/** The feature set stitched into every DataTable instance — TanStack v9's
 * tree-shaking contract: only the row models and registries the component
 * actually drives are registered. `columnMeta` is a type-only slot that
 * types `meta` on column definitions. */
const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

/** Column definition accepted by DataTable — a TanStack Table column def
 * bound to DataTable's feature set and column meta. The native `size`
 * field is typed in TanStack by the column-sizing feature, which stays
 * unregistered here (no sizing state or resize APIs are driven); it is
 * re-declared so a static px width hint can be given without `meta.width`,
 * and is read as the colgroup width fallback. */
type DataTableColumnDef<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData
> & { size?: number };

type DataTableProps<TData extends RowData> = {
  /** Column definitions: accessors, headers and cell templates. */
  columns: DataTableColumnDef<TData>[];
  /** Row data — one item per row. */
  data: TData[];
  /** Enable click-to-sort headers. Defaults to `false`; per-column
   * `meta.sortable` (or native `enableSorting`) overrides per column. */
  sortable?: boolean;
  /** Render a leading checkbox column bound to `rowSelection`. */
  selectable?: boolean;
  /** Selection state keyed by row id (TanStack `RowSelectionState`). */
  rowSelection?: ControlOrValue<RowSelectionState>;
  /** Sort state (TanStack `SortingState`). */
  sorting?: ControlOrValue<SortingState>;
  /** Rows per page. Setting this enables the pagination footer. */
  pageSize?: number;
  /** Current page, 1-based, when paginating. */
  page?: ControlOrValue<number>;
  /** Render skeleton rows instead of data. */
  loading?: boolean;
  /** Keep the header visible while the table body scrolls. */
  stickyHeader?: boolean;
  /**
   * Window the table body so only rows near the viewport stay mounted,
   * reusing the library's `VirtualList`. `true` uses the default row
   * height; an object pins it explicitly (plus an optional `overscan`,
   * default 5).
   *
   * The default height is `34px` — the natural single-line row of the
   * default cell styles: 2 × `--haze-space-2` padding (16px) + a 14px
   * (`--haze-text-sm`) line box + the 1px row border.
   *
   * Limitations and tradeoffs (evaluated against keeping `<tr>`s in one
   * shared table): `VirtualList` positions rows through absolutely
   * positioned `div` wrappers, and `position: absolute` blockifies
   * `display: table-row` — so rows cannot stay in the header's table.
   * Instead each row renders as a complete sibling `<table><tbody><tr>`
   * inside the wrapper. Rows remain legal, axe-clean table structures
   * with row/cell roles. One shared `<colgroup>` — the selection column
   * plus every leaf column's `meta.width` (falling back to the native
   * `size`) — is mirrored into the header table and every row table, and
   * `table-layout: fixed` honors it identically in each sibling: columns
   * with a width are fixed at it, columns without one split the remaining
   * space equally. That mirrored sequence is the alignment contract
   * between the sibling tables — no column-width measurement pass.
   * Consequences:
   * - Fixed row height only — dynamic or wrapping row heights are not
   *   supported; content taller than `rowHeight` overlaps the next row.
   * - Column widths are declarative (`meta.width` / `size`), never
   *   content-driven: columns without a width share the remainder equally
   *   instead of auto-sizing to content.
   * - `meta.fixed` is ignored in this mode — each row is its own table
   *   inside its own absolutely positioned wrapper, so there is no shared
   *   horizontal scrollport for cells to stick against.
   * - The header sits outside the scroll window (always visible) — the
   *   `stickyHeader` behavior is implied.
   * - The root must be height-bounded by the consumer (e.g. a
   *   `className` setting `height`/`max-height`, or a sized flex
   *   parent); unbounded, the viewport degenerates to a single row.
   * - Sorting, selection, pagination and `getRowId` semantics are
   *   unchanged — the window always shows the post-sort, post-page slice.
   */
  virtualized?: DataTableVirtualized;
  /** Stable row identity; also keys the `rowSelection` state. Defaults to
   * the row's index. */
  getRowId?: (row: TData, index: number) => string;
  /** Row click handler. Clicks originating in interactive cell content
   * (checkboxes, buttons, links) are ignored. */
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  /** Custom empty-state node; defaults to the `Empty` component. */
  empty?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'table'>, 'children'>;

/** Resolves the effective sorting switch for one column: an explicit column
 * `enableSorting` wins, then `meta.sortable`, then the table-level default.
 * Recurses into grouped columns. */
function withSortable<TData extends RowData>(
  column: DataTableColumnDef<TData>,
  sortable: boolean
): DataTableColumnDef<TData> {
  const resolved: DataTableColumnDef<TData> = {
    ...column,
    enableSorting: column.enableSorting ?? column.meta?.sortable ?? sortable,
  };
  if ('columns' in resolved && resolved.columns) {
    return {
      ...resolved,
      columns: resolved.columns.map((child) => withSortable(child, sortable)),
    };
  }
  return resolved;
}

/** Resolves a column def's effective width: `meta.width` wins, then the
 * native TanStack `size` as a px fallback. Returns a CSS length string, or
 * undefined when neither is declared. Read off the raw definition — the
 * column-sizing feature is not registered, so no default size is merged in
 * and "unspecified" stays distinguishable. */
function columnWidthCss(def: {
  meta?: DataTableColumnMeta;
  size?: number;
}): string | undefined {
  const width = def.meta?.width ?? def.size;
  return typeof width === 'number' ? `${width}px` : width;
}

/** Sticky-column presentation resolved for one rendered cell: which edge,
 * the CSS length to offset it by, and whether this is the innermost column
 * of a pinned run (the one carrying the scroll-hint shadow). */
type FixedCellSpec = {
  side: 'left' | 'right';
  offset: string;
  edge: boolean;
};

/** Sums CSS length fragments into a single length expression. Fragments are
 * plain lengths (`'120px'`) or parenthesized expressions (the selection
 * column's token math), so anything non-trivial is wrapped in `calc()`. */
function sumLengths(parts: string[]): string {
  if (parts.length === 0) return '0px';
  const [first] = parts;
  if (parts.length === 1 && first !== undefined && !first.includes('(')) {
    return first;
  }
  return `calc(${parts.join(' + ')})`;
}

/** Inline style carrying a fixed cell's sticky edge offset; the position,
 * background and z-index come from the fixed-cell classes. */
function fixedOffsetStyle(spec: FixedCellSpec | undefined) {
  return spec
    ? {
        left: spec.side === 'left' ? spec.offset : undefined,
        right: spec.side === 'right' ? spec.offset : undefined,
      }
    : undefined;
}

/** Selection column width wherever a colgroup owns it: 2 × `--haze-space-3`
 * cell padding + one checkbox (`--haze-space-5`). The `calc` form keeps
 * token overrides live; the parenthesized twin is the fragment summed into
 * fixed-column offsets. */
const SELECTION_COL_WIDTH =
  'calc(var(--haze-space-3) * 2 + var(--haze-space-5))';
const SELECTION_WIDTH_PART =
  '(var(--haze-space-3) * 2 + var(--haze-space-5))';

/** Default `virtualized` row height: 2 × `--haze-space-2` cell padding
 * (16px) + one `--haze-text-sm` (14px) line box + the 1px row border. */
const VIRTUAL_DEFAULT_ROW_HEIGHT = 34;

const root = css`
  display: flex;
  flex-direction: column;
`;

const scrollArea = css`
  overflow-x: auto;
`;

/* Bounded by the consumer (height/max-height on the DataTable) — without a
 * bound the area never scrolls and the sticky header simply stays put. */
const stickyScrollArea = css`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

/* Virtualized body region: the header table above never scrolls vertically,
 * the VirtualList below owns the vertical scrollbar. `scrollbar-gutter`
 * reserves the scrollbar lane next to the header so its fixed-layout
 * columns line up with the rows inside the scroller (auto layout would
 * size each sibling table's columns independently and drift apart). */
const virtualArea = css`
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-gutter: stable;
`;

/* Shared by the header table and every virtualized row table: `table-layout:
 * fixed` honors the mirrored `<colgroup>` identically in each sibling — the
 * alignment contract between them. */
const fixedLayout = css`
  table-layout: fixed;
`;

/* Fills the VirtualList wrapper (which carries the exact `rowHeight`), so
 * the default middle vertical alignment of table cells absorbs any slack
 * between content and the fixed row height. */
const virtualRowTable = css`
  height: 100%;
`;

const tableBase = css`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

const stickyHead = css`
  & th {
    position: sticky;
    top: 0;
    /* Above sticky fixed-column body cells (z-index 1): at equal z-indexes
     * the later-in-DOM body cells would paint over the header row. */
    z-index: 2;
    background: var(--haze-color-bg);
    box-shadow: var(--haze-shadow-sm);
  }
`;

const sortButton = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-weight: inherit;
  color: inherit;
  cursor: pointer;

  &:hover {
    color: var(--haze-color-primary);
  }

  &:focus-visible {
    outline: none;
    border-radius: var(--haze-radius-sm);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const sortIcon = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
`;

const rowHover = css`
  &:hover {
    background: var(--haze-color-bg-subtle);
  }
`;

const rowSelected = css`
  &,
  &:hover {
    background: var(--haze-color-primary-subtle);
  }
`;

const clickableRow = css`
  cursor: pointer;
`;

/* Selection column without a colgroup (normal mode, no declared widths):
 * the `width: 1%` shrink-to-fit trick under auto layout. */
const checkCell = css`
  width: 1%;
  white-space: nowrap;
`;

/* Selection column under a colgroup — always in virtual mode, and in normal
 * mode once any column declares a width. The `<col>` owns the sizing
 * (`SELECTION_COL_WIDTH`), the cell keeps only `nowrap`. */
const checkCellCol = css`
  white-space: nowrap;
`;

/* Sticky fixed columns (normal mode). Opaque background so scrolled cells
 * slide beneath. The row hover/selected backgrounds live on the `tr` and
 * would be covered by the cell's own background, so they are re-created on
 * the cell itself. */
const fixedCell = css`
  position: sticky;
  z-index: 1;
  background: var(--haze-color-bg);

  tr:hover & {
    background: var(--haze-color-bg-subtle);
  }
`;

/* Selected-row background for fixed cells — defined after `fixedCell` and
 * at equal-or-higher specificity (plus the `:hover` form), so it wins over
 * the plain and hovered backgrounds above. */
const fixedCellSelected = css`
  tr &,
  tr:hover & {
    background: var(--haze-color-primary-subtle);
  }
`;

/* A fixed cell inside a sticky header is the scroll corner — it must
 * outrank both the header row (z-index 2) and fixed body cells (1). */
const fixedHeadCell = css`
  z-index: 3;
`;

/* Scroll-hint shadow on the inner edge of the outermost pinned column;
 * `clip-path` confines it to that edge. Body cells only — the header row's
 * own shadow must not be replaced. */
const fixedLeftEdge = css`
  clip-path: inset(0 -8px 0 0);
  box-shadow: 6px 0 8px -6px var(--haze-color-border);
`;

const fixedRightEdge = css`
  clip-path: inset(0 0 0 -8px);
  box-shadow: -6px 0 8px -6px var(--haze-color-border);
`;

const emptyCell = css`
  padding: 0;
`;

const footer = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: var(--haze-space-3);
`;

export default function DataTable<TData extends RowData>({
  columns,
  data,
  sortable = false,
  selectable = false,
  rowSelection: rowSelectionControl,
  sorting: sortingControl,
  pageSize,
  page: pageControl,
  loading = false,
  stickyHeader = false,
  virtualized,
  getRowId,
  onRowClick,
  empty,
  className,
  ...rest
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useControl<SortingState>(sortingControl, []);
  const [rowSelection, setRowSelection] = useControl<RowSelectionState>(
    rowSelectionControl,
    {}
  );
  const [page, setPage, pageCtrl] = useControl<number>(pageControl, 1);

  const virtual = virtualized === true || typeof virtualized === 'object';
  const rowHeight =
    typeof virtualized === 'object'
      ? virtualized.rowHeight
      : VIRTUAL_DEFAULT_ROW_HEIGHT;
  const overscan =
    typeof virtualized === 'object' ? virtualized.overscan : undefined;

  // Without `pageSize` the table renders one page holding every row, so the
  // paginated row model never slices anything.
  const size = pageSize ?? Math.max(data.length, 1);

  const tableColumns = useMemo(
    () => columns.map((column) => withSortable(column, sortable)),
    [columns, sortable]
  );

  const table = useTable({
    features: dataTableFeatures,
    columns: tableColumns,
    data,
    getRowId,
    state: {
      sorting,
      rowSelection,
      pagination: { pageIndex: page - 1, pageSize: size },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize: size })
          : updater;
      setPage(Math.max(1, next.pageIndex + 1));
    },
  });

  // React has no `indeterminate` prop (it strips the attribute), so the DOM
  // property is set on the wrapped input after every commit.
  const selectAllRef = useRef<HTMLSpanElement>(null);
  const indeterminate =
    table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
  useEffect(() => {
    const input = selectAllRef.current?.querySelector('input');
    if (input) input.indeterminate = indeterminate;
  });

  // Virtualized viewport height: measured from the consumer-bounded region
  // minus the pinned header. Floors keep every observation identical, so
  // the ResizeObserver settles instead of looping; unbounded roots bottom
  // out at one row instead of growing recursively.
  const virtualAreaRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  useEffect(() => {
    if (!virtual) return;
    const area = virtualAreaRef.current;
    const thead = area?.querySelector('thead');
    if (!area || !thead) return;
    const measure = () => {
      const areaHeight = Math.floor(area.getBoundingClientRect().height);
      const headerHeight = Math.floor(thead.getBoundingClientRect().height);
      setViewportHeight(Math.max(rowHeight, areaHeight - headerHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    observer.observe(thead);
    return () => observer.disconnect();
  }, [virtual, rowHeight]);

  const headerGroups = table.getHeaderGroups();
  const leafHeaders = table.getLeafHeaders();
  const columnCount = leafHeaders.length + (selectable ? 1 : 0);
  const rows = table.getRowModel().rows;

  // Per-column widths: `meta.width` wins over the native `size`. In normal
  // mode a colgroup is only emitted once some column declares a width —
  // without one the rendering stays exactly as before; virtualized mode
  // always emits it, since the mirrored col sequence is how the header
  // table and the per-row sibling tables stay aligned.
  const leafWidths = leafHeaders.map((header) =>
    columnWidthCss(header.column.columnDef)
  );
  const hasColumnWidths = leafWidths.some((width) => width !== undefined);

  // Fixed columns are a normal-mode feature; virtualized rows are separate
  // sibling tables with no shared horizontal scrollport to stick against.
  const leafFixed = leafHeaders.map(
    (header) => header.column.columnDef.meta?.fixed
  );
  const selectionFixedSpec: FixedCellSpec | undefined =
    !virtual && selectable && leafFixed.some((side) => side === 'left')
      ? { side: 'left', offset: '0px', edge: leafFixed[0] !== 'left' }
      : undefined;
  const fixedById = new Map<string, FixedCellSpec>();
  if (!virtual) {
    // Sticky offsets accumulate the widths of the preceding fixed columns
    // on the same side (the selection column seeds the left run). Pin
    // contiguous runs: a non-fixed column between pinned ones scrolls
    // under the block they form at the edge.
    const leftParts: string[] = selectionFixedSpec
      ? [SELECTION_WIDTH_PART]
      : [];
    leafHeaders.forEach((header, index) => {
      if (leafFixed[index] !== 'left') return;
      fixedById.set(header.column.id, {
        side: 'left',
        offset: sumLengths(leftParts),
        edge: leafFixed[index + 1] !== 'left',
      });
      const width = leafWidths[index];
      if (width) leftParts.push(width);
    });
    const rightParts: string[] = [];
    for (let index = leafHeaders.length - 1; index >= 0; index -= 1) {
      const header = leafHeaders[index];
      if (!header || leafFixed[index] !== 'right') continue;
      fixedById.set(header.column.id, {
        side: 'right',
        offset: sumLengths(rightParts),
        edge: leafFixed[index - 1] !== 'right',
      });
      const width = leafWidths[index];
      if (width) rightParts.push(width);
    }
  }

  const colgroup =
    virtual || hasColumnWidths ? (
      <colgroup>
        {selectable && <col style={{ width: SELECTION_COL_WIDTH }} />}
        {leafHeaders.map((header, index) => (
          <col
            key={header.id}
            style={
              leafWidths[index] ? { width: leafWidths[index] } : undefined
            }
          />
        ))}
      </colgroup>
    ) : undefined;

  // The selection cell keeps only `nowrap` wherever a colgroup owns its
  // width; otherwise the 1% shrink-to-fit trick sizes it under auto layout.
  const checkCellStyle =
    virtual || hasColumnWidths ? checkCellCol : checkCell;

  const handleRowClick = onRowClick
    ? (row: TData, event: MouseEvent<HTMLTableRowElement>) => {
        // Interactive content inside the cell owns the click.
        if (
          event.target instanceof Element &&
          event.target.closest('button, input, select, textarea, a')
        ) {
          return;
        }
        onRowClick(row, event);
      }
    : undefined;

  const header = (
    <TableHead className={stickyHeader ? stickyHead : undefined}>
      {headerGroups.map((headerGroup, groupIndex) => (
        <tr key={headerGroup.id}>
          {selectable && groupIndex === 0 && (
            <TableCell
              as='th'
              x-class={[
                checkCellStyle,
                selectionFixedSpec && fixedCell,
                selectionFixedSpec && fixedHeadCell,
              ]}
              rowSpan={
                headerGroups.length > 1 ? headerGroups.length : undefined
              }
              style={fixedOffsetStyle(selectionFixedSpec)}
            >
              <span ref={selectAllRef}>
                <CheckboxCore
                  checked={table.getIsAllRowsSelected()}
                  onChange={(checked) => table.toggleAllRowsSelected(checked)}
                  aria-label='Select all rows'
                />
              </span>
            </TableCell>
          )}
          {headerGroup.headers.map((header) => {
            if (header.rowSpan === 0) return null;
            if (header.isPlaceholder) {
              return (
                <TableCell
                  as='th'
                  key={header.placeholderId ?? header.id}
                >
                  {null}
                </TableCell>
              );
            }
            const sorted = header.column.getIsSorted();
            // Fixed columns are honored on leaf headers — a group header
            // spanning several columns has no single edge to stick to.
            const fixedSpec =
              header.subHeaders.length === 0
                ? fixedById.get(header.column.id)
                : undefined;
            return (
              <TableCell
                as='th'
                key={header.id}
                colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                rowSpan={header.rowSpan > 1 ? header.rowSpan : undefined}
                x-class={[
                  fixedSpec && fixedCell,
                  fixedSpec && fixedHeadCell,
                ]}
                style={fixedOffsetStyle(fixedSpec)}
                aria-sort={
                  sorted === 'asc'
                    ? 'ascending'
                    : sorted === 'desc'
                      ? 'descending'
                      : undefined
                }
              >
                {header.column.getCanSort() ? (
                  <button
                    type='button'
                    x-class={[sortButton]}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <table.FlexRender header={header} />
                    <span x-class={[sortIcon]} aria-hidden='true'>
                      {sorted === 'asc'
                        ? '↑'
                        : sorted === 'desc'
                          ? '↓'
                          : '↕'}
                    </span>
                  </button>
                ) : (
                  <table.FlexRender header={header} />
                )}
              </TableCell>
            );
          })}
        </tr>
      ))}
    </TableHead>
  );

  const renderRow = (row: (typeof rows)[number]) => (
    <tr
      key={row.id}
      x-class={[
        rowHover,
        row.getIsSelected() && rowSelected,
        onRowClick && clickableRow,
      ]}
      onClick={
        handleRowClick
          ? (event) => handleRowClick(row.original, event)
          : undefined
      }
    >
      {selectable && (
        <TableCell
          x-class={[
            checkCellStyle,
            selectionFixedSpec && fixedCell,
            selectionFixedSpec?.edge && fixedLeftEdge,
            row.getIsSelected() && fixedCellSelected,
          ]}
          style={fixedOffsetStyle(selectionFixedSpec)}
        >
          <CheckboxCore
            checked={row.getIsSelected()}
            onChange={(checked) => row.toggleSelected(checked)}
            aria-label={`Select row ${row.id}`}
          />
        </TableCell>
      )}
      {row.getAllCells().map((cell) => {
        const fixedSpec = fixedById.get(cell.column.id);
        return (
          <TableCell
            key={cell.id}
            x-class={[
              fixedSpec && fixedCell,
              fixedSpec?.edge &&
                (fixedSpec.side === 'left' ? fixedLeftEdge : fixedRightEdge),
              row.getIsSelected() && fixedCellSelected,
            ]}
            style={fixedOffsetStyle(fixedSpec)}
          >
            <table.FlexRender cell={cell} />
          </TableCell>
        );
      })}
    </tr>
  );

  const renderSkeletonRow = (rowIndex: number) => (
    <tr key={`skeleton-${rowIndex}`}>
      {selectable && (
        <TableCell
          x-class={[
            checkCellStyle,
            selectionFixedSpec && fixedCell,
            selectionFixedSpec?.edge && fixedLeftEdge,
          ]}
          style={fixedOffsetStyle(selectionFixedSpec)}
        >
          <Skeleton />
        </TableCell>
      )}
      {leafHeaders.map((header) => {
        const fixedSpec = fixedById.get(header.column.id);
        return (
          <TableCell
            key={header.id}
            x-class={[
              fixedSpec && fixedCell,
              fixedSpec?.edge &&
                (fixedSpec.side === 'left' ? fixedLeftEdge : fixedRightEdge),
            ]}
            style={fixedOffsetStyle(fixedSpec)}
          >
            <Skeleton />
          </TableCell>
        );
      })}
    </tr>
  );

  const skeletonRows = Array.from(
    { length: pageSize ?? 5 },
    (_, rowIndex) => renderSkeletonRow(rowIndex)
  );

  const emptyRow = (
    <tr>
      <TableCell colSpan={columnCount} x-class={[emptyCell]}>
        {empty ?? <Empty />}
      </TableCell>
    </tr>
  );

  return (
    <div x-class={[root, className]}>
      {virtual ? (
        <div ref={virtualAreaRef} x-class={[virtualArea]}>
          <table x-class={[tableBase, fixedLayout]} {...rest}>
            {colgroup}
            {header}
          </table>
          {loading ? (
            <table x-class={[tableBase, fixedLayout]}>
              {colgroup}
              <TableBody>{skeletonRows}</TableBody>
            </table>
          ) : rows.length > 0 ? (
            <VirtualList
              items={rows}
              height={viewportHeight}
              itemHeight={rowHeight}
              overscan={overscan}
              renderItem={(row) => (
                <table x-class={[tableBase, fixedLayout, virtualRowTable]}>
                  {colgroup}
                  <TableBody>{renderRow(row)}</TableBody>
                </table>
              )}
            />
          ) : (
            <table x-class={[tableBase, fixedLayout]}>
              {colgroup}
              <TableBody>{emptyRow}</TableBody>
            </table>
          )}
        </div>
      ) : (
        <div x-class={[stickyHeader ? stickyScrollArea : scrollArea]}>
          <table x-class={[tableBase]} {...rest}>
            {colgroup}
            {header}
            <TableBody>
              {loading ? (
                skeletonRows
              ) : (
                <>
                  {rows.map(renderRow)}
                  {rows.length === 0 && emptyRow}
                </>
              )}
            </TableBody>
          </table>
        </div>
      )}
      {pageSize !== undefined && (
        <div x-class={[footer]}>
          <Pagination
            page={pageCtrl}
            total={data.length}
            pageSize={pageSize}
            size='sm'
          />
        </div>
      )}
    </div>
  );
}

export type {
  DataTableProps,
  DataTableColumnDef,
  DataTableColumnMeta,
  DataTableVirtualized,
};
