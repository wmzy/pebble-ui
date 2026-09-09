# haze-ui shadcn Registry

This directory powers the [shadcn CLI](https://ui.shadcn.com/docs/registry/github)
distribution path for [haze-ui](https://github.com/wmzy/haze-ui): the root
[`registry.json`](../registry.json) turns this GitHub repository into a
registry that `npx shadcn add` can consume directly — no registry server,
no published JSON payloads.

> **npm is the primary path.** haze-ui is an npm-distributed component
> library (`npm i haze-ui`) — versioned, tree-shakable, with per-component
> CSS subpaths. The registry items below are **thin re-export wrappers**:
> they install a one-file shim into your project so the shadcn workflow
> (`shadcn add`, `shadcn diff`, `shadcn update`) can track haze-ui
> components, while the implementation itself keeps coming from the
> `haze-ui` package. Use whichever path fits your project; you can mix both.

Everything here is **generated** by
[`scripts/generate-registry.mjs`](../scripts/generate-registry.mjs) on every
`pnpm build` (self-checking; it fails the build on schema drift). Don't edit
the generated files — edit the script. Only `README.md`, `tsconfig.json`,
`css.d.ts` and `haze-tokens/haze-tokens.md` are hand-maintained.

## Install

```bash
# the whole design system in one command — theme tokens plus a wrapper
# for every component (107 items pulled in via registryDependencies)
npx shadcn@latest add wmzy/haze-ui/base

# any single item — every styled export in the library is covered
npx shadcn@latest add wmzy/haze-ui/button

# several at once
npx shadcn@latest add wmzy/haze-ui/button wmzy/haze-ui/dialog wmzy/haze-ui/toast

# browse the catalog / inspect an item payload
npx shadcn@latest list wmzy/haze-ui
npx shadcn@latest view wmzy/haze-ui/sidebar
```

Wrappers land under your configured `components/ui` directory inside a
`haze/` namespace (from `components.json`, via the `@ui/` target
placeholder) — e.g. `components/ui/haze/button.tsx` — so they never collide
with your own components. To pin a release, append a tag or commit SHA:
`npx shadcn@latest add wmzy/haze-ui/button#v1.13.0`.

## Items

Generated coverage: **every styled export of the main barrel** — 107 css
families, one item per family — plus the `base` meta item and the
hand-curated `haze-tokens` doc (109 items total). Multi-export families
ship together (e.g. `tabs` → `Tabs`/`TabList`/`Tab`/`TabPanel`,
`resizable` → `Resizable*` plus the `Splitter*` aliases, `toast` →
`Toast`, `ToastContainer`, `useToast`, `toast()`), and the `tokens` item
wraps the theme classes (`lightTheme`/`darkTheme`/`spacing`/
`typography`).

A few examples:

| Item | What you get |
| --- | --- |
| `base` | The whole design system: theme tokens + every component wrapper (`registryDependencies` on all 107 component items) |
| `tokens` | Theme classes: `lightTheme`/`darkTheme` + `spacing` + `typography` |
| `haze-tokens` | Token onboarding guide installed as `docs/haze-tokens.md` |
| `button` | `Button`, `ButtonLink` re-exports |
| `input` | `Input`, `InputCore` (form-bindable core) |
| `dialog` | `Dialog` (native `<dialog>`, controllable `open`) |
| `select` | `Select`, `Option`, `SelectCore` |
| `tabs` | `Tabs`, `TabList`, `Tab`, `TabPanel` |
| `sidebar` | `Sidebar`, `SidebarGroup`, `SidebarItem`, `SidebarFooter`, `SidebarToggle` |
| `form` | `FormItem` (react-f0rm binding) |
| `data-table` | `DataTable` (TanStack Table + haze styles) |
| `chart` | `Chart` (recharts + haze tokens) |
| `toast` | `Toast`, `ToastContainer`, `useToast`, `toast()` |
| `chat-message` | `ChatMessage` (AI chat kit anchor) |

Each item declares `dependencies: ["haze-ui"]`, so the CLI installs the npm
package automatically. Items whose components need optional peers declare
them too (detected from the source import closure): `form` → `react-f0rm`,
`data-table` → `@tanstack/react-table`, `chart` → `recharts`,
`tag-input`/`tag-group` → `@dnd-kit/core` + `@dnd-kit/sortable` +
`@dnd-kit/utilities`.

Skipped on purpose (no css of their own — import from `haze-ui` directly):
hooks (`useMediaQuery`, `useClipboard`, …), `TOKEN_REGISTRY` /
`COMPONENT_TOKENS`, `LocaleProvider` + string packs, direction utils,
`Fullscreen`, and the `useControl` re-export.

## Item metadata: `docs`, `categories` and the `base` item

Every item carries the schema's two documentation/filter fields:

- **`docs`** — a markdown string (one-line component description,
  install command, token-activation notes) in the schema's standard
  `docs` field: it ships inside every item payload — `shadcn view
  wmzy/haze-ui/<item>` prints it — and is there for agents and registry
  tooling that read item documentation.
- **`categories`** — lowercase kebab-case tags from the schema's standard
  `categories` field, consumed by registry search/filter tooling
  (dynamic search endpoints, the MCP server): `general`, `layout`,
  `form`, `overlay`, `data-display`, `navigation`, `feedback`, `agent`
  (AI & chat), `utilities`, plus `theme`/`setup` for the non-component
  items. Mirrored from the demo sidebar grouping in
  `src/views/Layout/component-groups.ts`.

The `base` item (type `registry:base`) is the one-command path:

```bash
npx shadcn@latest add wmzy/haze-ui/base
```

It installs a token-activation wrapper (`lib/haze/base.tsx` re-exporting
`lightTheme`/`darkTheme`/`spacing`/`typography` + importing
`haze-ui/css/tokens.css`) and, through `registryDependencies`, all 107
component items. Note the dependency entries are full GitHub item
addresses (`wmzy/haze-ui/<item>`), not plain names — the CLI resolves
plain names against the official shadcn registry, which would install the
wrong components. Addresses without a `#ref` track the repo's default
branch.

## You still need the theme — but not the stylesheet imports

The generated wrappers import their own stylesheets
(`haze-ui/css/tokens.css` + the family css), so bundler-based projects need
no extra stylesheet setup. What every consumer still needs is the token
activation on a container — usually `<body>`:

```jsx
import { lightTheme, spacing, typography } from 'haze-ui';

<body className={`${lightTheme} ${spacing} ${typography}`}>
```

Swap in `darkTheme` for dark mode. The `tokens` registry item is exactly
this re-export if you prefer owning it as a file; the `haze-tokens` item
installs the full token guide (including Tailwind v4 `@theme` interop and
CDN URLs) into `docs/haze-tokens.md`.

## npm vs registry

| | npm (`npm i haze-ui`) | shadcn registry |
| --- | --- |
| What lands in your repo | nothing (dependency) | one thin wrapper file per item |
| Implementation source | `haze-ui` package | `haze-ui` package (via `dependencies`) |
| Updates | semver via package manager | re-run `shadcn add` (pin with `#tag`) |
| Tree-shaking / per-component CSS | yes | yes (same package underneath) |
| Best for | most projects | teams standardized on the shadcn CLI workflow |

## Repository layout

```
registry.json                      # shadcn registry index (repo root, generated)
registry/
├── README.md                      # this file
├── tsconfig.json                  # typechecks the wrappers (haze-ui self-reference)
├── css.d.ts                       # ambient declarations for the css side-effect imports
├── haze-tokens/haze-tokens.md     # token guide installed by the haze-tokens item
├── <item>.tsx                     # wrapper source (one per css family + base, generated)
└── <item>.json                    # flat registry-item payload with the wrapper
                                   # source embedded (direct .json address installs)
```

Note: the root `registry.json` is unrelated to the `registry.json` **export**
of the npm package (`haze-ui/registry.json` under `dist/`, also on
<https://unpkg.com/haze-ui/registry.json>) — that one carries the same items
with wrapper source embedded for URL/registry-server consumption. Both are
generated by the same script from the same data.
