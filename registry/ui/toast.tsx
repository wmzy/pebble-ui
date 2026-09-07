/**
 * haze-ui Toast — thin re-export wrapper for the shadcn CLI.
 *
 * Family: `Toast` + `ToastContainer` (mount once, near the app root),
 * `useToast` hook and the imperative `toast()` function. Consumers of
 * `useToast` must render below `ToastContainer`.
 *
 * Docs:    https://github.com/wmzy/haze-ui#readme
 * Source:  https://github.com/wmzy/haze-ui/tree/main/src/lib/components/Toast
 *
 * Styles — import once in your app entry (haze-ui ships JS and CSS separately):
 *
 *   import 'haze-ui/styles.css';           // full sheet (~12kB gzipped)
 *   // or per-component:
 *   import 'haze-ui/css/tokens.css';
 *   import 'haze-ui/css/toast.css';
 *
 * Then activate the design tokens on a container (usually <body>):
 *
 *   import { lightTheme, spacing, typography } from 'haze-ui';
 *   <body className={`${lightTheme} ${spacing} ${typography}`}>
 */
/* eslint-disable react-refresh/only-export-components --
   re-export shim for the haze-ui Toast family (components + hook +
   imperative function); consumers who edit this file copy in their own
   JSX, at which point the disable should be revisited. */
export { Toast, ToastContainer, useToast, toast } from 'haze-ui';
export type {
  ToastProps,
  ToastContainerProps,
  ToastOptions,
  ToastVariant,
} from 'haze-ui';
