/**
 * haze-ui Button — thin re-export wrapper for the shadcn CLI.
 *
 * The implementation lives in the `haze-ui` npm package (installed as a
 * dependency of this registry item). This wrapper keeps the familiar
 * `npx shadcn add wmzy/haze-ui/button` workflow while the component stays
 * versioned, tree-shaken and CSS-split through npm.
 *
 * Docs:    https://github.com/wmzy/haze-ui#readme
 * Source:  https://github.com/wmzy/haze-ui/tree/main/src/lib/components/Button
 *
 * Styles — import once in your app entry (haze-ui ships JS and CSS separately):
 *
 *   import 'haze-ui/styles.css';           // full sheet (~12kB gzipped)
 *   // or per-component:
 *   import 'haze-ui/css/tokens.css';
 *   import 'haze-ui/css/button.css';
 *
 * Then activate the design tokens on a container (usually <body>):
 *
 *   import { lightTheme, spacing, typography } from 'haze-ui';
 *   <body className={`${lightTheme} ${spacing} ${typography}`}>
 */
export { Button, ButtonLink } from 'haze-ui';
export type { ButtonProps, ButtonLinkProps } from 'haze-ui';
