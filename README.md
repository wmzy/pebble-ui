# Haze UI

> The React UI Component Library with controllable states.

English | [简体中文](./README-zh_CN.md)

[![npm](https://img.shields.io/npm/v/haze-ui)](https://www.npmjs.com/package/haze-ui)
[![downloads](https://img.shields.io/npm/dm/haze-ui.svg)](https://www.npmjs.com/package/haze-ui)
[![CI](https://github.com/wmzy/haze-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/wmzy/haze-ui/actions/workflows/ci.yml)

## Features

- Integrated [react use control](https://github.com/wmzy/react-use-control) provides component internal states
- Built for React 19+ (`ref` as a prop, `ControlOrValue<T>` state protocol) — no React 18 compatibility layer
- Keep strict, provide lightweight, composable, and easily extendable components
- Support themes customization
- Support Tree-shaking
- Tested like a product: 120+ unit test files, axe accessibility cases in
  every component test suite, ~50 Playwright e2e scenarios across
  Chromium/Firefox/WebKit, and pixel-locked visual baselines

## Why npm-distributed (not copy-paste)

**Interaction states are formulas, not values.** Every hover/active/subtle/focus-ring color is a CSS relative-color expression — `oklch(from var(--haze-color-primary) calc(l - 0.045) c h)` — baked into `tokens.css`. Override `--haze-color-primary` on a theme class and the entire interaction-state family re-derives at runtime in the browser, no rebuild, no codegen. In a copy-paste setup every pasted file owns its own copy of that formula, and each theme tweak means re-applying it by hand, file by file.

**`haze-ui/css-manifest.json` is machine-readable data.** The authoritative export → CSS-file mapping (family absorption included) is regenerated on every build, so bundler plugins and codemods read one source of truth instead of re-deriving kebab-case file names. A directory of pasted components has no equivalent — the mapping exists only in your head or your fork, and it drifts.

**The `ControlOrValue<T>` protocol needs a real runtime.** One prop — `checked?: Control<T> | T` — covers controlled *and* uncontrolled usage because `react-use-control` carries the wiring; a published package is the contract that keeps that behavior identical across every component and version. None of this is hostile to the shadcn / Base UI ecosystem: haze-ui tokens are plain CSS custom properties, so they interoperate with a Tailwind v4 `@theme` block, and haze components compose alongside copy-pasted primitives wherever each fits.

## Getting Started

### Installation

```sh
npm i haze-ui
// or
pnpm add haze-ui
```

### React 19+ by design

The peer range is `react: ^19.0.0` on purpose — haze-ui is built on
modern React rather than carrying a compatibility layer for 18:

- **`ref` as a prop.** React 19 passes `ref` to function components
  directly, so components that expose refs accept one prop instead of a
  `forwardRef` wrapper layer.
- **A modern-platform baseline.** Floating panels (Popover, DropdownMenu,
  Tooltip, ContextMenu, Combobox, Datepicker) choose between three tiers
  by feature detection — native `popover` + CSS anchor positioning,
  `popover` alone, or a JS fallback — with the newest platform features
  as the primary path, not an enhancement layered on top.
- **`ControlOrValue<T>`** — the `Control<T> | T` state protocol — is
  designed for modern React semantics throughout.

On React 18? Upgrade first. haze-ui ships no React 18 compatibility
layer, and none is planned.

#### Migrating from React 18

Once the app itself is on React 19, run through the haze-ui-relevant
checklist:

- **`ref` is a prop.** React 19 passes `ref` to function components
  directly — drop any `forwardRef` wrapper you had around haze components
  and pass `ref` like any other prop.
- **No `defaultValue` dual track.** Stateful components speak
  `ControlOrValue<T>` (`checked?: Control<T> | boolean`): one prop covers
  controlled *and* uncontrolled usage, so there is no
  `defaultChecked`/`defaultValue` pair to migrate. Where you used to pass
  `defaultValue`, pass the plain value (uncontrolled) or switch to
  controlled with `onChange`.
- **Floating panels assume the modern-platform baseline.** Popover,
  DropdownMenu, Tooltip, ContextMenu, Combobox and Datepicker
  feature-detect between native `popover` + CSS anchor positioning,
  `popover` alone, or a JS fallback — no polyfills to carry over from
  your React 18 setup, but the floor from [Browser support](#browser-support)
  applies.
- **Colors are OKLCH with runtime-derived interaction states.** Requires
  Chrome/Edge 119+, Safari 16.4+ or Firefox 128+; no HSL/hex fallbacks
  are shipped.
- **`'use client'` is pre-injected.** Every module in `dist/` starts with
  the directive, so in a Next.js App Router project you import haze-ui
  straight from your client components — no wrapper module re-exporting
  the library under its own `'use client'` banner.

### Optional peer dependencies

haze-ui's only required runtime dependency is `react-use-control` — the
engine behind `ControlOrValue<T>`. Three integrations are optional peers,
installed only when you use the components that need them:

```sh
npm i react-f0rm              # FormItem (peer range ^1.1.1)
npm i @tanstack/react-table   # DataTable (peer range ^9.2.4)
npm i recharts                # Chart (peer range ^3.10.1)
```

Everything else — `Button`, `Input`, `Dialog`, `Select`, … — runs with
nothing beyond `react` and `react-use-control`. The dist is ESM with
`preserveModules` and side-effect-free JS, so bundlers (Next.js, Vite,
webpack, Turbopack, Rollup) tree-shake the unused re-export chains and
never resolve peers you haven't installed: `import { Button } from
'haze-ui'` works without `react-f0rm`. Only bundler-less consumers
(bare Node ESM importing the barrel, which links the module graph
eagerly) must install the optional peers; the `haze-ui/form`,
`haze-ui/components/DataTable` and `haze-ui/components/Chart` subpaths
bypass the barrel entirely.

### Browser support

Since v1.13, haze-ui colors are generated in **OKLCH**, with interaction
states (hover/active/subtle/focus-ring) derived at runtime via CSS relative
color syntax. This requires Chrome/Edge 119+, Safari 16.4+, or Firefox 128+;
no HSL/hex fallbacks are shipped.

### Usage

Import the component and its CSS. Two CSS loading modes:

```jsx
// Full stylesheet (simplest, ~12kB gzipped)
import 'haze-ui/styles.css';
import { lightTheme, spacing, typography, Button } from 'haze-ui';

// …or per-component CSS (pay only for what you render).
// Always load tokens.css once, then each component you use:
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/button.css';
import { Button } from 'haze-ui';

export default function MyComponent() {
  return <Button>Start</Button>;
}
```

Component CSS files are kebab-case versions of the component name
(`OTPInput` → `haze-ui/css/otp-input.css`). Per-component files only
cover that component's rules — tokens (themes, spacing, typography)
always come from `haze-ui/css/tokens.css`.

Don't hardcode that kebab-case rule in tooling: sub-components and cores
share their directory's family file (`InputCore` → `input.css`,
`ButtonLink` → `button.css`, `Title`/`Text` → `typography.css`). The
authoritative export → css-file mapping ships as data:
`haze-ui/css-manifest.json`, generated at build time by
`scripts/split-css.mjs` from the actual CSS output (never hand-edited):

```json
{
  "families": { "Button": "button", "ButtonLink": "button", "InputCore": "input", "useToast": "toast" },
  "noCss": ["COMPONENT_TOKENS", "TOKEN_REGISTRY", "useControl", "useTitle"]
}
```

`families` covers every named export that has styles (family absorption
included); `noCss` lists pure-logic exports with no css of their own.
Bundler plugins and codemods should read this manifest instead of
re-deriving file names — the mapping changes in lockstep with the build.

### Server Components (Next.js App Router)

Every JS module in `dist/` starts with the `'use client'` directive,
injected at build time — the same convention Radix, Base UI and React
Aria ship. In an App Router project you import haze-ui straight from
your client components; there is no need for a wrapper module that
re-exports the library under its own `'use client'` banner:

```jsx
// any client component — import straight from the package
import { Button } from 'haze-ui';

export function Actions() {
  return <Button>Start</Button>;
}
```

CSS loading is unchanged from the two modes above — `haze-ui/styles.css`
in the root layout, or the `haze-ui/css/*` subpaths. A runnable Next.js
15 project lives in [`examples/nextjs`](./examples/nextjs).

## ButtonLink: a real anchor with the Button skin

Navigation that must look like a button should still *be* a link —
rendering `as={Button}` drops `href` onto a `<button>` (an invalid
attribute: no ⌘/middle-click new tab, nothing for crawlers or no-JS).
`ButtonLink` renders a native `<a>` wearing Button's full appearance —
same `variant`/`size`/`square` props, same hover/active/focus and
disabled visual states:

```jsx
import { ButtonLink } from 'haze-ui';

<ButtonLink href='/page/2' variant='outline'>Next page</ButtonLink>

// anchors have no `disabled` attribute — report the state with
// aria-disabled (+ tabIndex={-1} to leave the focus order); ButtonLink
// styles it exactly like Button's :disabled
<ButtonLink href='/prev' aria-disabled tabIndex={-1}>← Previous</ButtonLink>
```

Everything else extends the native `<a>` attributes and is spread onto
the anchor (`target`, `rel`, `download`, `aria-*`, …), with the ref
forwarded — the same composition shape `NavLink` uses, so routers can
swap their own Link element through an `as` prop:

```jsx
// with a typed router Link (href + SPA onClick injected by the router):
<TypedLink to='/articles' search={{offset: 20}} as={ButtonLink}>
  Next page
</TypedLink>
```

Both components share one skin (a styles module), so a theme tweak to
`Button` re-skins `ButtonLink` in lockstep. CSS: `haze-ui/css/button.css`
covers both.

## AsyncSection: loading / error / content in one place

`AsyncSection` collapses the three states every async view hand-rolls into
one component: `loading` renders the spinner placeholder, a non-null
`error` renders an alert box with an optional `Retry` button (an `Error`
instance contributes its `message`; `errorText` overrides), and otherwise
the children render. `loading` wins when both are set — the retry path
(loading again before the old error clears) shows the placeholder, not
the stale error. All copy is configurable; the retry button only renders
when `onRetry` is provided.

```jsx
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/async-section.css';
import { AsyncSection } from 'haze-ui';

<AsyncSection loading={loading} error={error} onRetry={refetch}>
  {data}
</AsyncSection>
```

## useTitle: view-level document.title

`useTitle(title)` sets `document.title` while the view is mounted and
restores the pre-entry title (the static `<title>` from the host page) on
unmount. Two timing pitfalls are baked into the implementation: the write
and the restore are two separate effects (a single `[title]` effect would
restore the *previous round's* title, not the entry default, on every prop
change), and the entry snapshot is taken at effect time, not render time —
a route swap is one commit, so at render time the old view's cleanup has
not run yet and `document.title` still holds the previous page.

```jsx
import { useTitle } from 'haze-ui';

function SettingsView() {
  useTitle('Settings');
  // ...
}
```

## Design tokens export (Figma)

`toDesignTokens()` converts the token registry into a [W3C Design Tokens](https://tr.designtokens.org/) JSON file — grouped by category (`color` / `font` / `spacing` / `dimension` / `shadow`), each token carrying a W3C `$type` and the source CSS variable in `$extensions['haze-ui.css-var']`, with `$value` being the resolved value of the chosen theme (`light` by default). The Theme Editor ships a one-click entry: the **Export W3C tokens (.json)** button in the toolbar downloads the file for the mode currently being edited, live edits included. The exported file can be imported directly into Figma Tokens / Tokens Studio.

```json
{
  "color": {
    "color-primary": {
      "$value": "oklch(0.563 0.241 260.8)",
      "$type": "color",
      "$extensions": { "haze-ui.css-var": "--haze-color-primary" }
    }
  },
  "spacing": {
    "space-2": {
      "$value": "8px",
      "$type": "dimension",
      "$extensions": { "haze-ui.css-var": "--haze-space-2" }
    }
  }
}
```

## AI-friendly distribution

**llms.txt** — a markdown overview of the whole library (the `ControlOrValue<T>`
state protocol, both CSS loading modes, all 104 components grouped with one-line
purposes, the token system, the floating-overlay tiers, form integration) written
for AI coding tools and crawlers. It lives at the repo root
([llms.txt](./llms.txt)) and, on the docs site, at
<https://wmzy.github.io/haze-ui/llms.txt> (`build:demo` copies it into `dist/`).

**registry.json** — an agent-installable registry shipped as the
`haze-ui/registry.json` npm artifact (regenerated by
`scripts/generate-registry.mjs` on every build), also reachable at
<https://unpkg.com/haze-ui/registry.json>. Point any registry-aware
tooling at it — the shadcn CLI works:

```sh
pnpm dlx shadcn@latest add https://unpkg.com/haze-ui/registry.json
```

Every item is a **wrapper file, not vendored source**: it re-exports the
component from the published haze-ui npm package and imports its
stylesheet, so `haze-ui` stays a normal npm dependency that keeps
updating underneath — the shadcn CLI is only the distribution channel.
That is the point: AI coding agents (and anyone who wants a fast setup
while keeping the npm update path) get working imports in one step,
without the copy-paste expectation of owning pasted source. When you
want different styles or behavior, fork the generated wrapper file — it
is your customization layer, not a source drop. Coverage, to be precise:
only the **agent components** (the AI & Chat group plus AsyncSection).

## Headless primitives (experimental)

The behavior layer the styled components are built on ships as its own
subpath: `haze-ui/headless`. Component authors assembling their own panels
get the same primitives Popover, DropdownMenu and Tooltip use internally —
with the same version, no re-implementation:

- `useFloating` — the three-tier floating engine (native `popover` + CSS
  anchor positioning → `popover` alone → JS fallback), plus
  `placeFloatingPanel`, `useFloatingPosition` and the placement/panel types
- `Presence` — mount/unmount with exit animations
- `useFocusScope` / `isTabbable` / `getTabbables` — focus trapping and
  tab-order queries
- `computeFloatingPosition` — the flip/shift collision math as a pure
  function

```jsx
import { useFloating, Presence } from 'haze-ui/headless';
```

Experimental while the API settles — additions are non-breaking, but
signatures may tighten before the surface is declared stable.

## react-f0rm Integration

react-f0rm owns form field state, and its headless `useField` hook is
the single binding layer — the same channel its built-in
`Field`/`Checkbox`/`Select` components use. haze-ui contributes the
views: controlled cores (`InputCore`, `SelectCore`, `SwitchCore`, `TextareaCore`,
`TagInputCore`, `TransferCore`, `UploadCore`, ...) take the plain `{value, onChange}`
pair with zero adapters, and `FormItem` wraps the hook's state in label,
error and aria wiring. The sugar components (`Input`, `Select`, ...)
keep their `ControlOrValue<T>` (`Control<T> | T`) API for standalone use outside forms.

### useField: field → {value, onChange}

```jsx
import { useForm, useField } from 'react-f0rm';
import { InputCore } from 'haze-ui';

function NameField({ form }) {
  const { value, onChange } = useField({ form, name: 'name' });
  return <InputCore value={value} onChange={onChange} />; // two-way bound
}
```

The hook subscribes to the field (sibling fields stay isolated), and
`onChange` writes through react-f0rm's user-change channel — a write
fires exactly the validation a user typing into the field would fire:
the field's effective `mode` (a `FormItem`/`useField` per-field override
included) and the form's `reValidateMode`. With the default
`mode: 'onSubmit'` + `reValidateMode: 'onChange'`, typing through a bound
core after a failed submit re-validates per keystroke and clears the
error as soon as the value is valid — no blur, no resubmit. `onChange`
accepts plain values only (controlled cores emit the next value, never
functional updaters; read the previous value from `value` on the next
render). `reset(form, newValues)` re-seeds every binding with no
remounting.

### FormItem: label, errors and aria wiring

```jsx
import { Form, useForm } from 'react-f0rm';
import { FormItem, InputCore } from 'haze-ui';

function ProfileForm() {
  const form = useForm({ initialValues: { email: '' } });
  return (
    <Form form={form} onSubmit={...}>
      <FormItem
        form={form}
        name="email"
        label="Email"
        validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
      >
        {({ id, errorId, invalid, value, onChange }) => (
          <InputCore id={id} value={value} onChange={onChange} aria-invalid={invalid} aria-describedby={errorId} />
        )}
      </FormItem>
    </Form>
  );
}
```

`FormItem` generates the field/error ids, renders `<label htmlFor>`, and
surfaces the first error in a `role="alert"` element — no manual
`FieldError` wiring.

#### `as`: declarative binding (react-f0rm Field-style)

Skip the render-prop: pass any component as `as` and `FormItem` wires the
id, aria attributes, `onBlur` and `onChange` itself — the same props shape
as react-f0rm's `Field`, not Radix's `asChild`. `as` and the children
render-prop are mutually exclusive.

```jsx
// text field: nothing else to wire
<FormItem form={form} name="email" label="Email" as={InputCore} />

// checkbox-style control: value lives in `checked`
<FormItem
  form={form}
  name="subscribed"
  label="Subscribe"
  as={CheckboxCore}
  valueToProps={(checked) => ({ checked: !!checked })}
/>

// DOM-element-shaped control: adapt event and value in one line each
<FormItem
  form={form}
  name="email"
  as={NativeInput}
  eventToValue={(e) => e.target.value}
  renderError={(error, id) => <em id={id}>{error}</em>}
/>
```

- `eventToValue` defaults to identity — haze cores' `onChange` emits the
  next plain value; pass `(e) => e.target.value` when `as` is a raw DOM
  element component.
- `asProps` spreads extra props onto the control before the value props,
  so `value`/`valueToProps` win conflicts (Field.tsx precedence).
- `renderError(error, id)` replaces the built-in error span's content;
  the span itself (`id`, `role="alert"`, styling) stays FormItem's.
- With a typed form, `validate`'s value argument is the field's actual
  type (`PathValueOf<TValues, P>`), not `any`.

#### `input`: declarative binding for cores and raw DOM controls (typed prop forwarding)

The ergonomic form for the controlled cores — pass the component and the
rest of the JSX goes straight to it, type-checked against its own props:

```jsx
<FormItem
  form={form}
  name="email"
  label="Email"
  input={InputCore}
  placeholder="you@x.dev"
  mode="onBlur"
  validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
/>

// JSX children forward too — a SelectCore's options:
<FormItem form={form} name="role" label="Role" input={SelectCore}>
  <option value="admin">Admin</option>
  <option value="viewer">Viewer</option>
</FormItem>

// checkbox-style controls keep the valueToProps adapter:
<FormItem
  form={form}
  name="subscribed"
  label="Subscribe"
  input={CheckboxCore}
  valueToProps={(checked) => ({ checked })}
/>
```

`input` wires the same id/aria/`onBlur`/`onChange`/value contract as `as`
— every haze core (`InputCore`, `TextareaCore`, `SelectCore`,
`TagInputCore`, `TransferCore`, `UploadCore`, `CheckboxCore`, `SwitchCore`, …)
speaks the plain `{value, onChange}` pair, so the default adapters need
nothing (`TagInputCore`'s `onChange` already emits the next `string[]`;
`TransferCore` emits the next `string[]` plus move metadata, `UploadCore`
the next `File[]`; a checkbox-style core pairs with `valueToProps`). The
differences from `as`:

- Forwarded props are **type-checked against the core's own props** —
  `input={InputCore} size="xl"` is a compile error, while `asProps` is an
  untyped bag.
- JSX **children** forward to the core (a `SelectCore`'s `<option>`s);
  the render-prop children and `input` are mutually exclusive (a
  render-prop next to `input` throws — it's a migration leftover).
- The wiring (`id`, `aria-invalid`, `aria-describedby`, `onBlur`,
  `onChange`, `value`/`checked`) and FormItem's own prop names are
  **reserved**: they are excluded from the forwarded type and always win
  at runtime. A control prop that collides with one (e.g. CheckboxCore's
  own `label`) is unreachable through `input` — use the render-prop or
  `as`/`asProps` for it.

`input` also takes raw DOM bindings — no core required. The two raw
forms are explicit about their `eventToValue` adapter, so the value
channel is never guessed:

```jsx
// a native form element: the binding pairs the tag with its adapter,
// and the rest of the JSX is type-checked against that element's own
// HTML attributes (rows on a textarea, options as a select's children)
<FormItem
  form={form}
  name="bio"
  label="Bio"
  input={{element: 'textarea', eventToValue: (e) => e.target.value}}
  rows={4}
/>

// a DOM-element-shaped component: the top-level eventToValue is the
// explicit opt-in from plain-value (core) to event-emitting (raw)
<FormItem
  form={form}
  name="email"
  label="Email"
  input={NativeInput}
  eventToValue={(e) => e.target.value}
/>
```

- The element binding accepts `'input' | 'textarea' | 'select'` and
  **requires** its `eventToValue` — `input={{element: 'input'}}` without
  the adapter is a compile error (at runtime an untyped caller that
  skips it still gets `e.target.value`, the DOM contract, never an Event
  in the store).
- The top-level `eventToValue` next to a component `input` switches that
  binding to raw semantics, mirroring the `as` channel; forwarded props
  still check against the component's own props.
- The same reserved-prop rule applies: `id`, `onBlur`, `onChange`,
  `value`/`checked`, aria-*, and FormItem's own names are never
  forwarded on the raw channel either.

#### `mode`: per-field validation timing (react-f0rm ≥ 0.6)

Pass `mode` to validate one field on its own schedule instead of the
form-wide validation mode — other fields are unaffected. It accepts
react-f0rm's `ValidationMode` values: `'onSubmit'` (default form
behavior), `'onBlur'`, `'onChange'`, `'onTouched'` or `'all'`. Omit it to
keep the form's mode.

```jsx
<FormItem
  form={form}
  name="email"
  label="Email"
  mode="onBlur"
  validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
>
  {({ id, errorId, invalid, onBlur, value, onChange }) => (
    <InputCore
      id={id}
      value={value}
      onChange={onChange}
      aria-invalid={invalid}
      aria-describedby={errorId}
      onBlur={onBlur}
    />
  )}
</FormItem>
```

With `mode="onBlur"` (and the binding's `onBlur` passed to the core, as
above) the email field is validated the moment it loses focus — no
submit needed. `mode` accepts `'onSubmit'`, `'onBlur'`, `'onChange'`,
`'onTouched'` or `'all'`; only this field's schedule changes, the rest
of the form keeps its own `mode`.

#### `validateDebounce` / `delayError` / `rules` (react-f0rm ≥ 0.6)

`FormItem` passes these field-level options straight through to
react-f0rm's `useField`:

- `validateDebounce={300}` — debounce this field's validation kicks:
  only the last kick inside the window runs the validator (e.g. keeps a
  per-keystroke async validator from firing while the user types fast).
  While the timer is pending the field counts as validating, so
  `trigger`/submit wait it out.
- `delayError={500}` — delay *showing* a newly appearing error in the
  rendered error span (and the binding's `invalid`/`errors`). The form's
  error state stays immediate — submit and `getError` still gate on it.
  An error that clears inside the window never shows.
- `rules={{ required: 'Email is required', minLength: 4, pattern: { value: /@/, message: 'Must be an email' } }}`
  — declarative constraints (a subset of react-hook-form's `register`
  rules) compiled into a validator that runs *before* `validate`; both
  sources' errors merge into the field's error list, rules errors ahead.

```jsx
<FormItem
  form={form}
  name="email"
  label="Email"
  validateDebounce={300}
  delayError={500}
  rules={{ required: 'Email is required' }}
  validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
>
  {({ id, errorId, invalid, value, onChange }) => (
    <InputCore id={id} value={value} onChange={onChange} aria-invalid={invalid} aria-describedby={errorId} />
  )}
</FormItem>
```

All three are optional; omit them and the field behaves exactly as
before (immediate validation per the form's `mode`, immediate error
display, `validate`-only).

## Accessibility & RTL

Accessibility is a baseline, not an opt-in: every component's test suite
includes axe checks, and the token sheet ships a global
`@media (prefers-reduced-motion: reduce)` block that collapses every
animation duration token to `0ms` — motion-sensitive users get instant
state changes with no per-component wiring.

haze-ui supports RTL via CSS logical properties wherever a side is
semantic (the *start/end* of reading flow), not just decorative. Set
`dir="rtl"` (or `direction: rtl`) on an ancestor and those sides mirror
automatically — no component props change. A regression smoke test
(`src/lib/rtl.test.tsx`) renders Progress, Alert, Badge, Tag and Dialog
in a `dir="rtl"` subtree asserting rendering, axe cleanliness and
unchanged aria contracts.

### Direction-responsive by construction (no physical CSS)

- **Progress (bar)** — the fill is a normal-flow block with a percentage
  `width`, so it grows from the inline-start edge (right in RTL) with no
  `left`/`right` in its CSS.
- **Slider** — a native `<input type="range">`; the browser mirrors fill
  and thumb under `dir="rtl"`.
- **Flex gap / `flex-direction: row`** — gap and row order follow the
  writing mode, so icon-to-label spacing in Tag, ChatMessage, Alert, etc.
  mirrors for free.
- **Carousel track scrolling** — uses `scrollIntoView({ inline: 'start' })`,
  a logical scroll position.

### Fixed: physical → logical conversions

| File | Change |
| --- | --- |
| `Carousel.tsx` | prev/next buttons `left`/`right` → `inset-inline-start`/`inset-inline-end`, plus a `[dir='rtl']` `scale: -1 1` mirror so the `‹`/`›` glyphs point along the reading direction |
| `ChatMessage.tsx` | bubble tail corners `border-bottom-right-radius` / `border-bottom-left-radius` → `border-end-end-radius` / `border-end-start-radius` (tail follows the bubble's anchored side) |
| `Chip.tsx` | close-button `margin-left` → `margin-inline-start` |
| `Container.tsx` | `margin-left/right: auto` → `margin-inline: auto`; `padding-left/right` → `padding-inline` |
| `ContextMenuItem.tsx`, `DropdownMenuItem.tsx`, `MenuItem.tsx`, `ConversationItem.tsx` | `text-align: left` → `text-align: start` |
| `DiffViewer.tsx` | line-number gutter `text-align: right` → `end`, `border-right` → `border-inline-end` (gutter stays on the leading side) |
| `List.tsx` | `padding-left` → `padding-inline-start` (list indent), both variants |
| `NavigationBar.tsx` | end-slot `margin-left: auto` → `margin-inline-start: auto` |
| `StepTimeline.tsx` | connector line `left` → `inset-inline-start` (stays under the inline-start marker column) |
| `Stepper/Step.tsx` | connector `left: 50%` → `inset-inline-start: 50%` (extends toward the next step) |
| `TableHead.tsx` | `th { text-align: left }` → `start` |
| `TreeItem.tsx` | checkbox/icon `margin-right` → `margin-inline-end`; indent guide `border-left` → `border-inline-start` |

Kept physical on purpose — glyph geometry or symmetric layout, not
reading-flow sides: the rotated border chevrons in Accordion/Disclosure,
Checkbox's rotated checkmark, Radio's centered dot, Affix's symmetric
`left: 0; right: 0` stretch.

### Partial support: known gaps

- **Floating panels (Popover, DropdownMenu, Tooltip, ContextMenu,
  Combobox, Datepicker)** — placements are physical sides
  (`'left'`/`'right'`/`'bottom-end'`, …). The CSS anchor-positioning
  `position-area` grid keywords and the JS collision math
  (`utils/collision.ts`, viewport coordinates) are physical; migrating to
  logical `position-area` keywords is a tracked future change. In RTL the
  panels position identically to LTR.
- **Input adornments** — `SelectCore` / `ModelPicker` chevrons
  (`background-position: right …` + `padding-right`) and
  `PasswordInputCore`'s absolute reveal button sit on the physical right
  with matching padding. Consistent under RTL, but not mirrored.
- **Progress (circle)** — SVG `stroke-dashoffset` fill runs clockwise
  regardless of direction (SVG has no inline axis).
- **Physical-by-design placement APIs** — `Drawer` `placement`
  (`'left'`/`'right'`), `Toast` placement (`'top-left'`, …),
  `SwipeAction` left/right action edges, `BackToTop`'s bottom-right
  corner, `CodeBlock`'s top-right language badge: the side is the API,
  so it stays physical.

### Workaround for remaining gaps

Wrap with `dir="rtl"` for everything above; for the physical-by-design
cases, override with logical insets through the `className` every
component accepts:

```jsx
<Drawer placement="right" className="rtl-drawer" />
```

```css
[dir='rtl'] .rtl-drawer {
  /* nudge a physical placement back to the reading-flow side */
  inset-inline-end: 0;
}
```

## Related Projects

- [react-use-control](https://github.com/wmzy/react-use-control)

## How to Contribute

Anyone and everyone is welcome to contribute. 

## License

[MIT](https://choosealicense.com/licenses/mit/)

## FAQ

### Components render without any styles

haze-ui ships styles as separate CSS subpaths — the JS entry does not
import any stylesheet. Import the full bundle once:

```js
import 'haze-ui/styles.css';
```

or import the tokens plus each component's own rules:

```js
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/button.css';
```

### Is there a CommonJS build?

No — haze-ui is ESM-only (`"type": "module"`). Use a bundler or runtime
with ESM support (Vite, webpack 5, Next.js, Node ≥ 18, …).

### Does haze-ui support React 18?

No — the peer range is `react@^19.0.0` by design (see
[React 19+ by design](#react-19-by-design)). Upgrade to React 19 first;
haze-ui ships no React 18 compatibility layer.

### How do I detect (or degrade) the relative-color syntax?

Since v1.13, theme interaction states are derived with CSS relative
colors, so the browser baseline from [Browser support](#browser-support)
applies — Chrome/Edge 119+, Safari 16.4+, Firefox 128+, with no HSL/hex
fallbacks shipped. To gate your own fallback styling on support, probe
the syntax in CSS:

```css
@supports (color: oklch(from red calc(l + 0.05) 0 h)) {
  /* relative colors available: derive custom states from tokens */
}
```

or from JS before deciding which stylesheet to load:

```js
if (CSS.supports('color: oklch(from red calc(l + 0.05) 0 h)')) {
  // relative colors available — load the v1.13+ token sheet
} else {
  // below baseline: pin a pre-OKLCH version or ship your own fallbacks
}
```

