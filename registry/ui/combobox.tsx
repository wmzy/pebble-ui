/**
 * haze-ui Combobox — thin re-export wrapper for the shadcn CLI.
 *
 * Input + filtered option list, with a controllable `value`
 * (`Control<string | null> | string | null` — one prop covers controlled
 * and uncontrolled usage).
 *
 * Docs:    https://github.com/wmzy/haze-ui#readme
 * Source:  https://github.com/wmzy/haze-ui/tree/main/src/lib/components/Combobox
 *
 * Styles — import once in your app entry (haze-ui ships JS and CSS separately):
 *
 *   import 'haze-ui/styles.css';           // full sheet (~12kB gzipped)
 *   // or per-component:
 *   import 'haze-ui/css/tokens.css';
 *   import 'haze-ui/css/combobox.css';
 *
 * Then activate the design tokens on a container (usually <body>):
 *
 *   import { lightTheme, spacing, typography } from 'haze-ui';
 *   <body className={`${lightTheme} ${spacing} ${typography}`}>
 */
export { Combobox } from 'haze-ui';
export type { ComboboxProps } from 'haze-ui';
