# Haze UI Design Tokens

This item is an onboarding guide for the haze-ui design tokens. The token
stylesheet itself is **not** vendored here — it is generated at build time
and consumed from the published `haze-ui` npm package (see [Why this file is
a guide, not a stylesheet](#why-this-file-is-a-guide-not-a-stylesheet)).

## What the tokens are

`tokens.css` is the single source of truth for every visual value in
haze-ui: a 12-step OKLCH color scale per hue, semantic aliases
(`--haze-color-primary`, `--haze-color-border`, …), interaction-state
formulas via CSS relative colors
(`oklch(from var(--haze-color-primary) calc(l - 0.045) c h)`), spacing,
radius, shadow, typography and motion tokens. All tokens are plain CSS
custom properties prefixed `--haze-*`.

The generator pipeline:

```
src/lib/tokens/palette.ts   (source of truth — OKLCH math + scales)
  → scripts/split-css.mjs   (pnpm build, groups Linaria output)
  → dist/css/tokens.css     (published inside the npm package)
```

## How to consume it

The `haze-ui` package (installed as a dependency of this item) exposes the
stylesheet through package exports:

```js
// Full sheet: tokens + every component (~12kB gzipped)
import 'haze-ui/styles.css';

// or tokens only, then each component you use:
import 'haze-ui/css/tokens.css';
```

Without a bundler, the same file is available from any npm CDN:

```
https://unpkg.com/haze-ui@latest/dist/css/tokens.css
```

Then activate the tokens on a container — usually `<body>` or `<html>`:

```jsx
import { lightTheme, spacing, typography } from 'haze-ui';

<body className={`${lightTheme} ${spacing} ${typography}`}>
```

Use `darkTheme` for dark mode, or both toggled by your theme switcher. The
classes are stable Linaria class names; theme overrides are as simple as
setting `--haze-color-primary` (and friends) inline on the element that
carries the theme class — interaction states re-derive at runtime via CSS
relative colors, with no rebuild.

## Why this file is a guide, not a stylesheet

shadcn GitHub registries resolve every `files[].path` **from the repository
itself** — the CLI rejects remote file paths (`registry validate` fails with
"remote file paths are not supported"). `tokens.css` only exists as a build
artifact (`dist/css/`), and committing a copy of generated CSS here would
drift from `src/lib/tokens/palette.ts`. So this item ships the pointer, and
the npm package remains the single distribution channel for the stylesheet.

## Tailwind interop

The tokens are plain CSS custom properties, so they interoperate with a
Tailwind v4 `@theme` block:

```css
@import 'tailwindcss';

:root {
  --color-primary: var(--haze-color-primary);
}
```

Full documentation: <https://github.com/wmzy/haze-ui#readme>
