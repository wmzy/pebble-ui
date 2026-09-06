import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type {
  ColumnDef,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';

import { useEffect, useMemo, useRef } from 'react';
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

/** Per-column metadata understood by DataTable. */
type DataTableColumnMeta = {
  /** Column-level sorting switch — overrides the table-level `sortable` default. */
  sortable?: boolean;
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
 * bound to DataTable's feature set and column meta. */
type DataTableColumnDef<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData
>;

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
    z-index: 1;
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

const checkCell = css`
  width: 1%;
  white-space: nowrap;
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

  const headerGroups = table.getHeaderGroups();
  const leafHeaders = table.getLeafHeaders();
  const columnCount = leafHeaders.length + (selectable ? 1 : 0);
  const rows = table.getRowModel().rows;

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

  return (
    <div x-class={[root, className]}>
      <div x-class={[stickyHeader ? stickyScrollArea : scrollArea]}>
        <table x-class={[tableBase]} {...rest}>
          <TableHead className={stickyHeader ? stickyHead : undefined}>
            {headerGroups.map((headerGroup, groupIndex) => (
              <tr key={headerGroup.id}>
                {selectable && groupIndex === 0 && (
                  <TableCell
                    as='th'
                    x-class={[checkCell]}
                    rowSpan={
                      headerGroups.length > 1 ? headerGroups.length : undefined
                    }
                  >
                    <span ref={selectAllRef}>
                      <CheckboxCore
                        checked={table.getIsAllRowsSelected()}
                        onChange={(checked) =>
                          table.toggleAllRowsSelected(checked)
                        }
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
                  return (
                    <TableCell
                      as='th'
                      key={header.id}
                      colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                      rowSpan={header.rowSpan > 1 ? header.rowSpan : undefined}
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
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize ?? 5 }, (_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {selectable && (
                    <TableCell x-class={[checkCell]}>
                      <Skeleton />
                    </TableCell>
                  )}
                  {leafHeaders.map((header) => (
                    <TableCell key={header.id}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </tr>
              ))
            ) : (
              <>
                {rows.map((row) => (
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
                      <TableCell x-class={[checkCell]}>
                        <CheckboxCore
                          checked={row.getIsSelected()}
                          onChange={(checked) => row.toggleSelected(checked)}
                          aria-label={`Select row ${row.id}`}
                        />
                      </TableCell>
                    )}
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <TableCell colSpan={columnCount} x-class={[emptyCell]}>
                      {empty ?? <Empty />}
                    </TableCell>
                  </tr>
                )}
              </>
            )}
          </TableBody>
        </table>
      </div>
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

export type { DataTableProps, DataTableColumnDef, DataTableColumnMeta };
