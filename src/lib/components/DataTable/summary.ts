import type { Row, RowData } from '@tanstack/react-table';

import type { dataTableFeatures } from './features';

/** A row as DataTable hands it to the `summary` callback and editors. */
type DataTableRow<TData extends RowData> = Row<
  typeof dataTableFeatures,
  TData
>;

/** Numeric cell values of one column, in row order — non-numbers drop out. */
function numericValues<TData extends RowData>(
  rows: DataTableRow<TData>[],
  columnId: string
): number[] {
  return rows
    .map((row) => row.getValue<number | undefined>(columnId))
    .filter((value): value is number => typeof value === 'number');
}

/**
 * Sums the numeric values of one column across the given rows (the array
 * `summary` receives). Non-numeric and missing cells contribute nothing,
 * so string columns simply total `0`.
 */
export function dataTableSum<TData extends RowData>(
  rows: DataTableRow<TData>[],
  columnId: string
): number {
  return numericValues(rows, columnId).reduce((total, value) => {
    return total + value;
  }, 0);
}

/**
 * Averages the numeric values of one column across the given rows.
 * Non-numeric cells are excluded from both the total and the divisor;
 * with no numeric values at all the result is `undefined`.
 */
export function dataTableAvg<TData extends RowData>(
  rows: DataTableRow<TData>[],
  columnId: string
): number | undefined {
  const values = numericValues(rows, columnId);
  if (values.length === 0) return undefined;
  return dataTableSum(rows, columnId) / values.length;
}

/** Counts the given rows — the summary helper for non-numeric columns. */
export function dataTableCount<TData extends RowData>(
  rows: DataTableRow<TData>[]
): number {
  return rows.length;
}
