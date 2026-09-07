/**
 * haze-ui Dialog — thin re-export wrapper for the shadcn CLI.
 *
 * Built on the native `<dialog>` element (`showModal`), with focus trapping
 * and a controllable `open` state (`Control<boolean> | boolean` — one prop
 * covers controlled and uncontrolled usage).
 *
 * Docs:    https://github.com/wmzy/haze-ui#readme
 * Source:  https://github.com/wmzy/haze-ui/tree/main/src/lib/components/Dialog
 *
 * Styles — import once in your app entry (haze-ui ships JS and CSS separately):
 *
 *   import 'haze-ui/styles.css';           // full sheet (~12kB gzipped)
 *   // or per-component:
 *   import 'haze-ui/css/tokens.css';
 *   import 'haze-ui/css/dialog.css';
 *
 * Then activate the design tokens on a container (usually <body>):
 *
 *   import { lightTheme, spacing, typography } from 'haze-ui';
 *   <body className={`${lightTheme} ${spacing} ${typography}`}>
 */
export { Dialog } from 'haze-ui';
export type { DialogProps } from 'haze-ui';
