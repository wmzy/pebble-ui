/**
 * haze-ui FormItem — thin re-export wrapper for the shadcn CLI.
 *
 * Binds any haze-ui field component into a `react-f0rm` form: validation,
 * error rendering, `as`/`asProps` element binding. `react-f0rm` is a peer
 * dependency of haze-ui and is installed alongside this item.
 *
 * Docs:    https://github.com/wmzy/haze-ui#readme
 * Source:  https://github.com/wmzy/haze-ui/tree/main/src/lib/form
 *
 * Styles — import once in your app entry (haze-ui ships JS and CSS separately):
 *
 *   import 'haze-ui/styles.css';           // full sheet (~12kB gzipped)
 *   // or per-component:
 *   import 'haze-ui/css/tokens.css';
 *   import 'haze-ui/css/form.css';
 *
 * Then activate the design tokens on a container (usually <body>):
 *
 *   import { lightTheme, spacing, typography } from 'haze-ui';
 *   <body className={`${lightTheme} ${spacing} ${typography}`}>
 */
export { FormItem } from 'haze-ui';
export type {
  FieldValidator,
  FormItemAsProps,
  FormItemBinding,
  FormItemOwnProps,
  FormItemProps,
  FormItemRawElement,
  FormItemRawElementBinding,
  FormInstance,
  PathValueOf,
} from 'haze-ui';
