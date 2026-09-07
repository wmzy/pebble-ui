/**
 * haze-ui DataTable — thin re-export wrapper for the shadcn CLI.
 *
 * TanStack Table (headless core, v9) with haze styling: sorting, pagination,
 * loading and empty states on the `Table` primitives. Column definitions are
 * TanStack `ColumnDef`s, so `@tanstack/react-table` is installed alongside
 * this item (it is a peer dependency of haze-ui).
 *
 * Docs:    https://github.com/wmzy/haze-ui#readme
 * Source:  https://github.com/wmzy/haze-ui/tree/main/src/lib/components/DataTable
 *
 * Styles — import once in your app entry (haze-ui ships JS and CSS separately):
 *
 *   import 'haze-ui/styles.css';           // full sheet (~12kB gzipped)
 *   // or per-component:
 *   import 'haze-ui/css/tokens.css';
 *   import 'haze-ui/css/data-table.css';
 *
 * Then activate the design tokens on a container (usually <body>):
 *
 *   import { lightTheme, spacing, typography } from 'haze-ui';
 *   <body className={`${lightTheme} ${spacing} ${typography}`}>
 */
export { DataTable } from 'haze-ui';
export type {
  DataTableProps,
  DataTableColumnDef,
  DataTableColumnMeta,
} from 'haze-ui';
