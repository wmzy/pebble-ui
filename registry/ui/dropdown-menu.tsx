/**
 * haze-ui DropdownMenu — thin re-export wrapper for the shadcn CLI.
 *
 * Compound family: `DropdownMenu` (root), `DropdownMenuTrigger`,
 * `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`.
 * Built on the native Popover API with tiered positioning
 * (CSS anchor positioning → JS fallback).
 *
 * Docs:    https://github.com/wmzy/haze-ui#readme
 * Source:  https://github.com/wmzy/haze-ui/tree/main/src/lib/components/DropdownMenu
 *
 * Styles — import once in your app entry (haze-ui ships JS and CSS separately):
 *
 *   import 'haze-ui/styles.css';           // full sheet (~12kB gzipped)
 *   // or per-component:
 *   import 'haze-ui/css/tokens.css';
 *   import 'haze-ui/css/dropdown-menu.css';
 *
 * Then activate the design tokens on a container (usually <body>):
 *
 *   import { lightTheme, spacing, typography } from 'haze-ui';
 *   <body className={`${lightTheme} ${spacing} ${typography}`}>
 */
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'haze-ui';
export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuSeparatorProps,
} from 'haze-ui';
