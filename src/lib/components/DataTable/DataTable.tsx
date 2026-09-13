import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type {
  Column,
  ColumnDef,
  ColumnVisibilityState,
  ExpandedState,
  Header,
  Row,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';

import type { DataTableCellEditorProps, DataTableColumnMeta } from './features';

import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTable } from '@tanstack/react-table';
import { css } from '@linaria/core';
import { useControl, useThru, watch, isControl } from 'react-use-control';

import { getDirection, useDirection } from '../../utils/direction';

import { CheckboxCore } from '../Checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../DropdownMenu';
import { Empty } from '../Empty';
import { Input } from '../Input';
import { useStrings } from '../LocaleProvider';
import { Pagination } from '../Pagination';
import { Skeleton } from '../Skeleton';
import { TableBody, TableCell, TableHead } from '../Table';
import { VirtualList } from '../VirtualList';

import CellEditor from './CellEditor';
import { dataTableFeatures } from './features';

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

/** Column definition accepted by DataTable — a TanStack Table column def
 * bound to DataTable's feature set and column meta. The native `size`
 * field doubles as a static px width hint (read as the colgroup width
 * fallback after `meta.width`) and seeds the resize math when `resizable`
 * is on. */
type DataTableColumnDef<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData
> & { size?: number };

/** One cell of a summary row: a static string or number (`undefined`
 * renders an empty cell — `dataTableAvg` of no numeric values), or a
 * function of the summarized rows (the place `dataTableSum` & co. plug
 * in). */
type DataTableSummaryCell<TData extends RowData = RowData> =
  | string
  | number
  | undefined
  | ((rows: Row<typeof dataTableFeatures, TData>[]) => ReactNode);

/** One `<tfoot>` row produced by the `summary` callback: an optional
 * accessible label for the whole row (rendered as its `aria-label`) and
 * one cell per leaf column, in column order. */
type DataTableSummary<TData extends RowData = RowData> = {
  label?: string;
  cells: DataTableSummaryCell<TData>[];
};

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
  /**
   * Server-driven mode: sorting and pagination stop being computed
   * locally. TanStack's `manualSorting` / `manualPagination` under the
   * hood — the table renders `data` exactly as received (no reordering,
   * no page slicing), so the consumer fetches each page pre-sorted and
   * pre-sliced. Sort-header clicks still toggle the `sorting` state (and
   * `aria-sort`), and the footer still tracks the `page` state; the
   * consumer observes both through the `onSortChange` / `onPageChange`
   * callbacks (or the `sorting` / `page` controls) and refetches. Pass
   * `pageCount` so the footer knows the server-side page total — without
   * it the footer falls back to `data.length`, i.e. one full page.
   * Composes with `rowSelection`, `loading`, `virtualized` and the
   * skeleton exactly as in local mode.
   */
  manual?: boolean;
  /**
   * Total number of pages, overriding the footer's page math in `manual`
   * mode (locally derived from `data.length` otherwise). Only meaningful
   * together with `pageSize`.
   */
  pageCount?: number;
  /**
   * Fires with the next 1-based page whenever the page changes — footer
   * clicks and programmatic updates alike, in local and `manual` mode.
   * The `manual`-mode refetch trigger; pairs with `pageCount`.
   */
  onPageChange?: (page: number) => void;
  /**
   * Fires with the next TanStack `SortingState` whenever sorting changes
   * — header clicks (including multi-sort) and programmatic updates
   * alike, in local and `manual` mode. In `manual` mode this is the
   * server refetch trigger; the table itself keeps rendering `data`
   * untouched.
   */
  onSortChange?: (sorting: SortingState) => void;
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
  /**
   * Enable column resizing: every leaf header cell (except those switched
   * off per column) grows a drag handle on its inline-end edge. Dragging
   * commits widths live (TanStack `columnResizeMode: 'onChange'`); the
   * handle is a focusable `separator` widget — ArrowLeft/ArrowRight nudge
   * the width by 5px (mirrored under RTL, read from the DOM at event
   * time), double-click resets the column to its declared width.
   * Per-column `meta.resizable` (or native `enableResizing`) overrides per
   * column. Defaults to `false` — no handles, no colgroup change.
   */
  resizable?: boolean;
  /**
   * Expanded-row state (TanStack `ExpandedState`: `true` for all, or a map
   * keyed by row id). Drives both expansion flavors: custom panels
   * (`getRowCanExpand` + `renderExpandedRow`) and tree data (`subRows`).
   */
  expanded?: ControlOrValue<ExpandedState>;
  /**
   * Decides which rows offer an expander button in the first content
   * column. Without it, providing `renderExpandedRow` alone makes every
   * row expandable. Explicit expansion props win over tree data: when
   * either this or `renderExpandedRow` is given, `subRows` fields are
   * ignored and rows never nest.
   */
  getRowCanExpand?: (row: Row<typeof dataTableFeatures, TData>) => boolean;
  /**
   * Renders the expansion panel: a full-width row (`colSpan` across every
   * visible column) directly below each expanded row. Called with the
   * TanStack row (`.original` carries the data). Providing it (or
   * `getRowCanExpand`) switches the table to custom-panel expansion and
   * disables tree mode.
   */
  renderExpandedRow?: (row: Row<typeof dataTableFeatures, TData>) => ReactNode;
  /**
   * The field DataTable reads tree children from, when rows carry nested
   * data — `'subRows'` by default. Tree mode turns on by itself when some
   * top-level row holds a non-empty array there: parent rows grow expander
   * buttons in the first content column, expanded children render as
   * indented rows (one `--haze-space-4` per depth level) in document
   * order, and the `expanded` state keeps its TanStack semantics (keyed by
   * row id — sub-row ids default to `parentId.index`, so pass `getRowId`
   * for stable ids). Works with sorting, filtering, selection, pagination
   * and `virtualized` (the expanded row model already yields the flat
   * display order the window slices). Explicit `getRowCanExpand` /
   * `renderExpandedRow` take priority — with either present, `subRows`
   * data is not read at all.
   */
  subRowsKey?: string;
  /**
   * Column visibility state (TanStack `ColumnVisibilityState`): a map keyed by
   * column id, `true` (or absent) meaning visible. Hidden columns drop
   * from header, body and colgroup.
   */
  columnVisibility?: ControlOrValue<ColumnVisibilityState>;
  /**
   * Render the column-settings trigger opening a `DropdownMenu` of
   * checkboxes — one per hideable column (`meta.hideable: false` pins a
   * column out of the menu). With `pageSize` the trigger sits in the
   * pagination row (pagination keeps the end edge); without it a toolbar
   * row appears above the table's inline-end corner. Defaults to `false`.
   */
  columnToggle?: boolean;
  /**
   * Render a filter row directly below the header: one `Input` per
   * filterable column, typing filters rows through TanStack's
   * case-insensitive `includesString` (empty input clears the filter).
   * Per-column `meta.filterable` (or native `enableColumnFilter`)
   * overrides per column; a columnDef `filterFn` replaces the default
   * filter function. Defaults to `false`.
   */
  filterable?: boolean;
  /**
   * Renders summary rows in a `<tfoot>` below the body: one row per entry,
   * one cell per leaf column (`cells[i]` aligns with column `i`; the
   * selection column, when present, renders an empty cell first). Cell
   * functions receive the rows being summarized — every row of the
   * filtered data (all pages, tree sub-rows included), so totals stay
   * stable across pagination; `label` names the row accessibly. Skipped
   * while `loading` or when no rows render. When `virtualized`, the
   * summary renders in its own table below the scrolling window — pinned
   * by construction, `stickyFooter` is unnecessary there.
   */
  summary?: (
    rows: Row<typeof dataTableFeatures, TData>[]
  ) => DataTableSummary<TData>[];
  /**
   * Keep the summary footer visible while the body scrolls vertically —
   * the tfoot cells stick to the bottom of the scroll area (needs a
   * height-bounded table: `stickyHeader`'s scroll area or a consumer
   * `max-height`). No effect when `virtualized` (already pinned) or
   * without `summary`. Defaults to `false`.
   */
  stickyFooter?: boolean;
  /**
   * Enable inline cell editing: cells become focusable and enter edit mode
   * on double-click or Enter; the built-in editors (an `InputCore`) save
   * on Enter or blur and cancel on Escape. The editor kind is chosen per
   * column through `meta.editor` (`'text'` by default, `'number'` parses
   * the draft — reporting `null` when cleared — a function renders a
   * custom editor, `false` opts the column out). DataTable never mutates
   * `data`: committed values are reported through `onCellEdit`, and the
   * cell keeps rendering the current value until the consumer updates the
   * data. Note `onRowClick` still fires for the clicks of a double-click.
   */
  editable?: boolean;
  /**
   * Reports a committed cell edit: the row id, the column id, the next
   * value and the previous one. Called after Enter/blur/custom-editor
   * saves, only when the value actually changed (`Object.is`). The
   * consumer owns the data — update it to make the edit visible.
   */
  onCellEdit?: (
    rowId: string,
    columnId: string,
    nextValue: unknown,
    prevValue: unknown
  ) => void;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'table'>, 'children' | 'summary'>;

/** Per-column feature switches resolved from the table-level props. */
type ColumnFlags = {
  sortable: boolean;
  resizable: boolean;
  filterable: boolean;
};

/** Resolves the effective per-column feature switches: an explicit native
 * TanStack field wins, then the column `meta` override, then the table-level
 * default. Also defaults the filter function to the registered
 * `includesString` (inert while no filter value is set) and, when resizing
 * is on, feeds a declared numeric `meta.width` into the native `size` so
 * drag deltas and keyboard nudges start from the rendered width. Recurses
 * into grouped columns. */
function resolveColumn<TData extends RowData>(
  column: DataTableColumnDef<TData>,
  flags: ColumnFlags
): DataTableColumnDef<TData> {
  const resolved: DataTableColumnDef<TData> = {
    ...column,
    enableSorting:
      column.enableSorting ?? column.meta?.sortable ?? flags.sortable,
    enableResizing: column.enableResizing ?? column.meta?.resizable ?? true,
    enableHiding: column.enableHiding ?? column.meta?.hideable !== false,
    enableColumnFilter:
      column.enableColumnFilter ?? column.meta?.filterable ?? flags.filterable,
    filterFn: column.filterFn ?? 'includesString',
    size:
      flags.resizable && typeof column.meta?.width === 'number'
        ? column.meta.width
        : column.size,
  };
  if ('columns' in resolved && resolved.columns) {
    return {
      ...resolved,
      columns: resolved.columns.map((child) => resolveColumn(child, flags)),
    };
  }
  return resolved;
}

/** Human label for a column in generated UI (resize handles, filter inputs,
 * the visibility menu): the header string when one was given, else the
 * column id. */
function columnLabel<TData extends RowData>(
  column: Column<typeof dataTableFeatures, TData>
): string {
  const header = column.columnDef.header;
  return typeof header === 'string' ? header : column.id;
}

/** Resolves a column def's effective width: `meta.width` wins, then the
 * native TanStack `size` as a px fallback. Returns a CSS length string, or
 * undefined when neither is declared. Read off the resolved column def —
 * the sizing feature's `size: 150` default is neutralized through the
 * `defaultColumn` option, so "unspecified" stays distinguishable. */
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

/* Column-settings toolbar (no pagination): a right-aligned strip above the
 * table. */
const toolbar = css`
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--haze-space-3);
`;

/* The menu wrapper inside the pagination row: consumes the free space so
 * the trigger pins to the start edge and Pagination keeps the end edge. */
const footerMenu = css`
  margin-inline-end: auto;
`;

const columnsTrigger = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1) var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);

  &:hover {
    border-color: var(--haze-color-border-hover);
    background: var(--haze-color-bg-subtle);
  }
`;

/* One visibility toggle row inside the menu. The label element is generic
 * to ARIA ownership, so the checkbox input below carries the
 * `menuitemcheckbox` role the menu requires. */
const toggleRow = css`
  display: flex;
  align-items: center;
  padding: var(--haze-space-1) var(--haze-space-2);
  border-radius: var(--haze-radius-sm);
  cursor: pointer;
  font-size: var(--haze-text-sm);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }
`;

/* Resizable header cells anchor the absolutely positioned drag handle.
 * `position: relative` only wins where the header is not sticky — under
 * `stickyHeader` the `.stickyHead th` rule (class + type specificity)
 * keeps `position: sticky`, which anchors the handle just as well. */
const resizableHead = css`
  position: relative;
`;

/* Drag handle straddling the header cell's inline-end edge: a focusable
 * `separator` widget (ARIA authoring pattern). */
const resizeHandle = css`
  position: absolute;
  top: 0;
  bottom: 0;
  inset-inline-end: -3px;
  width: 6px;
  z-index: 1;
  cursor: col-resize;
  touch-action: none;
  border-radius: var(--haze-radius-sm);

  &::after {
    content: '';
    position: absolute;
    top: 25%;
    bottom: 25%;
    inset-inline-end: 2.5px;
    width: 1px;
    background: var(--haze-color-border);
  }

  &:hover::after,
  &:focus-visible::after {
    top: 0;
    bottom: 0;
    background: var(--haze-color-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const expander = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--haze-space-5);
  height: var(--haze-space-5);
  margin-inline-end: var(--haze-space-1);
  padding: 0;
  border: none;
  background: none;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  vertical-align: middle;
  cursor: pointer;
  border-radius: var(--haze-radius-sm);

  &:hover {
    color: var(--haze-color-text);
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const expanderIcon = css`
  transition: transform var(--haze-duration-fast) var(--haze-ease);

  [aria-expanded='true'] & {
    transform: rotate(90deg);
  }
`;

/* Expansion panel cell: spans every rendered column on its own row. */
const panelCell = css`
  padding: var(--haze-space-3);
  background: var(--haze-color-bg-subtle);
`;

/* Tree indentation: an inline-block spacer in the first content cell,
 * one `--haze-space-4` per depth level (inline style carries the depth
 * multiple). aria-hidden — purely presentational shifting. */
const treeIndent = css`
  display: inline-block;
  vertical-align: middle;
`;

/* Summary footer: mirrors the body cell metrics with a heavier top rule
 * and the header's text weight. */
const summaryFoot = css`
  & td {
    padding: var(--haze-space-2) var(--haze-space-3);
    border-top: 2px solid var(--haze-color-border);
    color: var(--haze-color-text);
    font-weight: var(--haze-weight-semibold);
    white-space: nowrap;
  }
`;

/* Sticky summary footer: cells stick to the bottom of the scroll area,
 * mirroring the sticky header's elevation and stacking. */
const stickyFoot = css`
  & td {
    position: sticky;
    bottom: 0;
    z-index: 2;
    background: var(--haze-color-bg);
    box-shadow: var(--haze-shadow-sm);
  }
`;

/* Editable cell, at rest: hints at the affordance and carries the focus
 * ring for the Enter-to-edit path (the td is the tab stop). */
const editableCell = css`
  cursor: text;

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--haze-color-primary);
  }
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
  manual = false,
  pageCount,
  onPageChange,
  onSortChange,
  loading = false,
  stickyHeader = false,
  virtualized,
  getRowId,
  onRowClick,
  empty,
  resizable = false,
  expanded: expandedControl,
  getRowCanExpand,
  renderExpandedRow,
  subRowsKey = 'subRows',
  columnVisibility: columnVisibilityControl,
  columnToggle = false,
  filterable = false,
  summary,
  stickyFooter = false,
  editable = false,
  onCellEdit,
  className,
  ...rest
}: DataTableProps<TData>) {
  // Sorting and page states are threaded through a `watch` layer so every
  // mutation — header clicks (TanStack's onSortingChange), footer clicks
  // (the Pagination control) and programmatic updates — reports through
  // onSortChange / onPageChange exactly once, from outside the state
  // updater. Controlled controls keep their Control semantics; the layer
  // is inert while the callbacks are absent.
  const sortingControlled = isControl(sortingControl);
  const [sorting, setSorting] = useControl<SortingState>(
    useThru(
      sortingControlled ? sortingControl : undefined,
      watch((next) => onSortChange?.(next))
    ),
    sortingControlled ? [] : sortingControl ?? []
  );
  const [rowSelection, setRowSelection] = useControl<RowSelectionState>(
    rowSelectionControl,
    {}
  );
  const pageControlled = isControl(pageControl);
  const [page, setPage, pageCtrl] = useControl<number>(
    useThru(
      pageControlled ? pageControl : undefined,
      watch((next) => onPageChange?.(next))
    ),
    pageControlled ? 1 : pageControl ?? 1
  );
  const [expanded, setExpanded] = useControl<ExpandedState>(
    expandedControl,
    {}
  );
  const [columnVisibility, setColumnVisibility] =
    useControl<ColumnVisibilityState>(columnVisibilityControl, {});
  // Which cell is being edited, if any — purely internal UI state, keyed by
  // row/column id so it survives reorders and the virtualized window.
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);

  // Declared intent (LocaleProvider chain → document) for the drag math,
  // which TanStack resolves as a render-time option; keyboard nudges read
  // the DOM direction at event time instead.
  const dir = useDirection();
  const instanceId = useId();
  const strings = useStrings('dataTable');

  const virtual = virtualized === true || typeof virtualized === 'object';
  const rowHeight =
    typeof virtualized === 'object'
      ? virtualized.rowHeight
      : VIRTUAL_DEFAULT_ROW_HEIGHT;
  const overscan =
    typeof virtualized === 'object' ? virtualized.overscan : undefined;

  // Without `pageSize` the table renders one page holding every row, so
  // the paginated row model never slices anything — Infinity (not
  // `data.length`) because expanded tree children can outnumber the roots.
  const size = pageSize ?? Number.POSITIVE_INFINITY;

  // Custom-panel expansion is possible only when the consumer opts in; it
  // also switches the virtualized window to measured (dynamic) row
  // heights, since panels are taller than the fixed row height. Tree
  // expansion keeps the fixed window — children are ordinary rows.
  const expandable =
    getRowCanExpand !== undefined || renderExpandedRow !== undefined;

  // Tree data: when no explicit expansion prop is given and some top-level
  // row carries children under `subRowsKey`, TanStack's `getSubRows` is
  // wired and the default `getRowCanExpand` (rows with sub-rows) takes
  // over — expanders, indented children and the `expanded` state all flow
  // from there. Explicit props keep the custom-panel flavor and leave
  // nested data unread (zero-change default for existing consumers).
  const treeMode =
    getRowCanExpand === undefined &&
    renderExpandedRow === undefined &&
    data.some((row) => {
      const children = (row as Record<string, unknown>)[subRowsKey];
      return Array.isArray(children) && children.length > 0;
    });

  const tableColumns = useMemo(
    () =>
      columns.map((column) =>
        resolveColumn(column, { sortable, resizable, filterable })
      ),
    [columns, sortable, resizable, filterable]
  );

  const table = useTable({
    features: dataTableFeatures,
    columns: tableColumns,
    data,
    getRowId,
    getSubRows: treeMode
      ? (originalRow) =>
          (originalRow as Record<string, unknown>)[subRowsKey] as
            | readonly TData[]
            | undefined
      : undefined,
    state: {
      sorting,
      rowSelection,
      pagination: { pageIndex: page - 1, pageSize: size },
      expanded,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    // Server-driven mode: TanStack skips the local sort and the local
    // page slice — `data` renders exactly as received while the sorting
    // and page state keep flowing (the consumer refetches off
    // onSortChange / onPageChange). manualPagination also turns off
    // TanStack's data-change auto page reset, as a server table expects.
    manualSorting: manual,
    manualPagination: manual,
    // `renderExpandedRow` alone means "every row expands"; `getRowCanExpand`
    // refines which ones. Neither given falls through to TanStack's default
    // — "rows with subRows" — which is what drives tree mode.
    getRowCanExpand:
      getRowCanExpand ??
      (renderExpandedRow !== undefined ? () => true : undefined),
    enableColumnFilters: filterable,
    enableColumnResizing: resizable,
    columnResizeMode: 'onChange',
    columnResizeDirection: dir,
    // The registered column-sizing feature defaults every column def to
    // `size: 150`; re-overriding it with `undefined` keeps "no width
    // declared" distinguishable to `columnWidthCss` (an explicit object key
    // with an undefined value survives the option merge). TanStack's own
    // size math falls back to 150 through its `??` chain, so resizing
    // behavior is unaffected.
    defaultColumn: { size: undefined },
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
  const columnSizing = table.state.columnSizing;

  // Per-column widths: a committed resize wins, then `meta.width`, then the
  // native `size`. In normal mode a colgroup is only emitted once some
  // column declares a width (or resizing is on, so a resized `<col>` has a
  // home) — without one the rendering stays exactly as before; virtualized
  // mode always emits it, since the mirrored col sequence is how the header
  // table and the per-row sibling tables stay aligned.
  const leafWidths = leafHeaders.map((header) => {
    const resized = columnSizing[header.column.id];
    if (resized !== undefined) return `${resized}px`;
    return columnWidthCss(header.column.columnDef);
  });
  const hasColumnWidths = leafWidths.some((width) => width !== undefined);

  // Keyboard nudge for one resize handle: ±5px off the committed size (or
  // the resolved current one), clamped to the column's min/max size.
  const nudgeColumnSize = (
    header: Header<typeof dataTableFeatures, TData>,
    delta: number
  ) => {
    const def = header.column.columnDef;
    const min = def.minSize ?? 20;
    const max = def.maxSize ?? Number.MAX_SAFE_INTEGER;
    const current = columnSizing[header.column.id] ?? header.column.getSize();
    const next = Math.min(Math.max(Math.round(current + delta), min), max);
    table.setColumnSizing((old) => ({ ...old, [header.column.id]: next }));
  };

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
    virtual || hasColumnWidths || resizable ? (
      <colgroup data-slot="colgroup">
        {selectable && (
          <col data-slot="col" style={{ width: SELECTION_COL_WIDTH }} />
        )}
        {leafHeaders.map((header, index) => (
          <col
            key={header.id}
            data-slot="col"
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
    virtual || hasColumnWidths || resizable ? checkCellCol : checkCell;

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
        <tr key={headerGroup.id} data-slot="row">
          {selectable && groupIndex === 0 && (
            <TableCell
              as='th'
              data-slot="select-cell"
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
                  aria-label={strings.selectAll}
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
                  data-slot="cell"
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
            const canResize =
              resizable &&
              header.subHeaders.length === 0 &&
              header.column.getCanResize();
            return (
              <TableCell
                as='th'
                key={header.id}
                data-slot="cell"
                colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                rowSpan={header.rowSpan > 1 ? header.rowSpan : undefined}
                x-class={[
                  fixedSpec && fixedCell,
                  fixedSpec && fixedHeadCell,
                  canResize && resizableHead,
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
                    data-slot="sort-button"
                    x-class={[sortButton]}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <table.FlexRender header={header} />
                    <span data-slot="icon" x-class={[sortIcon]} aria-hidden='true'>
                      {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
                    </span>
                  </button>
                ) : (
                  <table.FlexRender header={header} />
                )}
                {canResize && (
                  <div
                    role='separator'
                    data-slot="resize-handle"
                    aria-orientation='vertical'
                    aria-label={`Resize ${columnLabel(header.column)}`}
                    tabIndex={0}
                    x-class={[resizeHandle]}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      header.getResizeHandler()(event);
                    }}
                    onDoubleClick={() => header.column.resetSize()}
                    onKeyDown={(event) => {
                      if (
                        event.key !== 'ArrowLeft' &&
                        event.key !== 'ArrowRight'
                      ) {
                        return;
                      }
                      event.preventDefault();
                      // Arrows mirror under RTL, read from the DOM at
                      // event time so the keys follow the painted
                      // direction (same contract as Calendar).
                      const rtl = getDirection(event.currentTarget) === 'rtl';
                      const grow = (event.key === 'ArrowRight') !== rtl;
                      nudgeColumnSize(header, grow ? 5 : -5);
                    }}
                  />
                )}
              </TableCell>
            );
          })}
        </tr>
      ))}
    </TableHead>
  );

  // Expansion panel row id, referenced by the expander's `aria-controls`.
  // Row ids are consumer-defined, so stray whitespace is neutralized.
  const panelId = (rowId: string) =>
    `${instanceId}-${rowId.replace(/\s+/g, '-')}-panel`;

  const renderRow = (row: (typeof rows)[number]) => (
    // Keyed fragment (not a bare fragment) — row identity across reorders
    // (sorting, filtering) must reconcile by row id, not by position.
    <Fragment key={row.id}>
      <tr
        key={row.id}
        data-slot="row"
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
            data-slot="select-cell"
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
        {row.getVisibleCells().map((cell, cellIndex) => {
          const fixedSpec = fixedById.get(cell.column.id);
          // Editing is resolved per leaf column: the table-level switch
          // gates it, `meta.editor` picks the kind (`'text'` default,
          // `false` opts out).
          const editor: DataTableColumnMeta['editor'] = editable
            ? (cell.column.columnDef.meta?.editor ?? 'text')
            : false;
          const canEdit = editor !== false;
          const isEditing =
            editingCell !== null &&
            editingCell.rowId === row.id &&
            editingCell.columnId === cell.column.id;
          const commitEdit = (next: unknown) => {
            setEditingCell(null);
            const prev = cell.getValue();
            if (!Object.is(next, prev)) {
              onCellEdit?.(row.id, cell.column.id, next, prev);
            }
          };
          return (
            <TableCell
              key={cell.id}
              data-slot="cell"
              x-class={[
                fixedSpec && fixedCell,
                fixedSpec?.edge &&
                  (fixedSpec.side === 'left' ? fixedLeftEdge : fixedRightEdge),
                row.getIsSelected() && fixedCellSelected,
                canEdit && editableCell,
              ]}
              style={fixedOffsetStyle(fixedSpec)}
              tabIndex={canEdit ? 0 : undefined}
              onDoubleClick={
                canEdit && !isEditing
                  ? () =>
                      setEditingCell({
                        rowId: row.id,
                        columnId: cell.column.id,
                      })
                  : undefined
              }
              onKeyDown={
                canEdit && !isEditing
                  ? (event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      setEditingCell({
                        rowId: row.id,
                        columnId: cell.column.id,
                      });
                    }
                  : undefined
              }
            >
              {isEditing && canEdit ? (
                typeof editor === 'function' ? (
                  editor({
                    value: cell.getValue(),
                    row,
                    column: cell.column,
                    onSave: commitEdit,
                    onCancel: () => setEditingCell(null),
                  })
                ) : (
                  <CellEditor
                    kind={editor === 'number' ? 'number' : 'text'}
                    value={cell.getValue()}
                    ariaLabel={`Edit ${columnLabel(cell.column)} in row ${row.id}`}
                    onSave={commitEdit}
                    onCancel={() => setEditingCell(null)}
                  />
                )
              ) : (
                <>
                  {cellIndex === 0 && row.depth > 0 && (
                    <span
                      aria-hidden='true'
                      x-class={[treeIndent]}
                      style={{ width: `calc(var(--haze-space-4) * ${row.depth})` }}
                    />
                  )}
                  {cellIndex === 0 && row.getCanExpand() && (
                    <button
                      type='button'
                      data-slot="expand-button"
                      x-class={[expander]}
                      aria-expanded={row.getIsExpanded()}
                      aria-controls={
                        renderExpandedRow !== undefined
                          ? panelId(row.id)
                          : undefined
                      }
                      aria-label={
                        row.getIsExpanded()
                          ? `Collapse row ${row.id}`
                          : `Expand row ${row.id}`
                      }
                      onClick={row.getToggleExpandedHandler()}
                    >
                      <span data-slot="icon" x-class={[expanderIcon]} aria-hidden='true'>
                        ▸
                      </span>
                    </button>
                  )}
                  <table.FlexRender cell={cell} />
                </>
              )}
            </TableCell>
          );
        })}
      </tr>
      {renderExpandedRow !== undefined &&
        row.getCanExpand() &&
        row.getIsExpanded() && (
          <tr key={`${row.id}-panel`} data-slot="panel-row">
            <TableCell
              colSpan={columnCount}
              data-slot="panel-cell"
              x-class={[panelCell]}
              id={panelId(row.id)}
            >
              {renderExpandedRow(row)}
            </TableCell>
          </tr>
        )}
    </Fragment>
  );

  const renderSkeletonRow = (rowIndex: number) => (
    <tr key={`skeleton-${rowIndex}`} data-slot="row">
      {selectable && (
        <TableCell
          data-slot="select-cell"
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
            data-slot="cell"
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
    <tr data-slot="row">
      <TableCell colSpan={columnCount} data-slot="cell" x-class={[emptyCell]}>
        {empty ?? <Empty />}
      </TableCell>
    </tr>
  );

  // Filter row: rendered as the first body section directly below the
  // header, one input per filterable leaf column (an empty cell keeps the
  // columns aligned elsewhere). A dedicated tbody keeps the inputs out of
  // the header's `columnheader` semantics; under `stickyHeader` it scrolls
  // away with the body, and in virtualized mode it stays pinned with the
  // header table above the scrolling rows.
  const filterBody = filterable ? (
    <TableBody>
      <tr data-slot="filter-row">
        {selectable && <TableCell data-slot="select-cell">{null}</TableCell>}
        {leafHeaders.map((header) => (
          <TableCell key={`filter-${header.id}`} data-slot="cell">
            {header.column.getCanFilter() ? (
              <Input
                size='sm'
                aria-label={`Filter ${columnLabel(header.column)}`}
                placeholder={strings.filterPlaceholder}
                value={(header.column.getFilterValue() as string | undefined) ?? ''}
                onChange={(event) =>
                  header.column.setFilterValue(event.target.value)
                }
              />
            ) : null}
          </TableCell>
        ))}
      </tr>
    </TableBody>
  ) : undefined;

  // Summary footer: the callback summarizes the filtered data (every row,
  // all pages, tree sub-rows included) — never the skeleton or empty state.
  // Rendered as the table's tfoot in normal mode; in virtualized mode as
  // its own sibling table below the scrolling window (outside the virtual
  // area by construction), sharing the same colgroup for column alignment.
  const summaryRowsArguments = table.getFilteredRowModel().flatRows;
  const summaryRows =
    summary !== undefined && !loading && rows.length > 0
      ? summary(summaryRowsArguments)
      : undefined;
  const summaryTfoot =
    summaryRows !== undefined && summaryRows.length > 0 ? (
      <tfoot data-slot="summary" x-class={[summaryFoot, stickyFooter && stickyFoot]}>
        {summaryRows.map((summaryRow, rowIndex) => (
          <tr key={`summary-${rowIndex}`} data-slot="row" aria-label={summaryRow.label}>
            {selectable && <TableCell data-slot="select-cell">{null}</TableCell>}
            {leafHeaders.map((header, cellIndex) => {
              const cell = summaryRow.cells[cellIndex];
              return (
                <TableCell key={header.id} data-slot="cell">
                  {typeof cell === 'function'
                    ? cell(summaryRowsArguments)
                    : cell}
                </TableCell>
              );
            })}
          </tr>
        ))}
      </tfoot>
    ) : undefined;

  // Column-settings menu: every hideable leaf column, hidden ones included
  // (so they can come back). The checkbox inputs carry `menuitemcheckbox` —
  // the role a `menu` must own — while the wrapping labels stay generic, so
  // the structure is both axe-valid and operable (Space toggles, Tab walks).
  const columnMenu = columnToggle ? (
    <DropdownMenu className={pageSize !== undefined ? footerMenu : undefined}>
      <DropdownMenuTrigger x-class={[columnsTrigger]}>
        Columns
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {table
          .getAllLeafColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <label key={column.id} data-slot="column-toggle-item" x-class={[toggleRow]}>
              <CheckboxCore
                role='menuitemcheckbox'
                aria-checked={column.getIsVisible()}
                checked={column.getIsVisible()}
                onChange={() => column.toggleVisibility()}
                aria-label={`Show ${columnLabel(column)}`}
              />
              <span data-slot="label">{columnLabel(column)}</span>
            </label>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : undefined;

  return (
    <div data-slot="data-table" x-class={[root, className]}>
      {columnMenu && pageSize === undefined && (
        <div data-slot="toolbar" x-class={[toolbar]}>{columnMenu}</div>
      )}
      {virtual ? (
        <div ref={virtualAreaRef} data-slot="scroll-area" x-class={[virtualArea]}>
          <table data-slot="table" x-class={[tableBase, fixedLayout]} {...rest}>
            {colgroup}
            {header}
            {filterBody}
          </table>
          {loading ? (
            <table data-slot="table" x-class={[tableBase, fixedLayout]}>
              {colgroup}
              <TableBody>{skeletonRows}</TableBody>
            </table>
          ) : rows.length > 0 ? (
            <VirtualList
              items={rows}
              height={viewportHeight}
              itemHeight={rowHeight}
              // Expansion panels are taller than the fixed row height, so
              // switch the window to measured heights once expanding is
              // possible; plain rows measure back to `rowHeight`.
              estimatedItemHeight={expandable ? rowHeight : undefined}
              overscan={overscan}
              renderItem={(row) => (
                <table data-slot="table" x-class={[tableBase, fixedLayout, virtualRowTable]}>
                  {colgroup}
                  <TableBody>{renderRow(row)}</TableBody>
                </table>
              )}
            />
          ) : (
            <table data-slot="table" x-class={[tableBase, fixedLayout]}>
              {colgroup}
              <TableBody>{emptyRow}</TableBody>
            </table>
          )}
          {summaryTfoot !== undefined && (
            <table data-slot="table" x-class={[tableBase, fixedLayout]}>
              {colgroup}
              {summaryTfoot}
            </table>
          )}
        </div>
      ) : (
        <div data-slot="scroll-area" x-class={[stickyHeader ? stickyScrollArea : scrollArea]}>
          <table data-slot="table" x-class={[tableBase]} {...rest}>
            {colgroup}
            {header}
            {filterBody}
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
            {summaryTfoot}
          </table>
        </div>
      )}
      {pageSize !== undefined && (
        <div data-slot="pagination" x-class={[footer]}>
          {columnMenu}
          {/* Manual mode: the server owns the row total, so the footer's
           * page math must come from `pageCount` (fed as
           * pageCount × pageSize items — Pagination derives pages from
           * `total`). Locally the total stays `data.length`. */}
          <Pagination
            page={pageCtrl}
            total={
              manual && pageCount !== undefined
                ? Math.max(0, pageCount) * pageSize
                : data.length
            }
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
  DataTableSummary,
  DataTableSummaryCell,
  DataTableCellEditorProps,
};
