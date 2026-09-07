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

## Install

```bash
# any single item
npx shadcn@latest add wmzy/haze-ui/button

# several at once
npx shadcn@latest add wmzy/haze-ui/button wmzy/haze-ui/dialog wmzy/haze-ui/toast
```

Wrappers land in your configured `components/ui` directory (from
`components.json`, as with any `registry:ui` item).

## Items

| Item | Install | What you get |
| --- | --- | --- |
| `haze-tokens` | `npx shadcn@latest add wmzy/haze-ui/haze-tokens` | Token onboarding guide (`docs/haze-tokens.md`): what `tokens.css` contains, where it lives, how to load and theme it |
| `button` | `npx shadcn@latest add wmzy/haze-ui/button` | `Button`, `ButtonLink` re-exports |
| `dialog` | `npx shadcn@latest add wmzy/haze-ui/dialog` | `Dialog` (native `<dialog>`, controllable `open`) |
| `dropdown-menu` | `npx shadcn@latest add wmzy/haze-ui/dropdown-menu` | `DropdownMenu` compound family |
| `combobox` | `npx shadcn@latest add wmzy/haze-ui/combobox` | `Combobox` (input + filtered list) |
| `form` | `npx shadcn@latest add wmzy/haze-ui/form` | `FormItem` (react-f0rm binding) |
| `data-table` | `npx shadcn@latest add wmzy/haze-ui/data-table` | `DataTable` (TanStack Table + haze styles) |
| `toast` | `npx shadcn@latest add wmzy/haze-ui/toast` | `Toast`, `ToastContainer`, `useToast`, `toast()` |
| `chat-message` | `npx shadcn@latest add wmzy/haze-ui/chat-message` | `ChatMessage` (AI chat kit anchor) |

Each item declares `dependencies: ["haze-ui"]`, so the CLI installs the
npm package automatically. `form` additionally installs `react-f0rm` and
`data-table` installs `@tanstack/react-table` (both peer dependencies of
haze-ui that their APIs surface).

Useful commands (see the
[GitHub registry docs](https://ui.shadcn.com/docs/registry/github)):

```bash
npx shadcn@latest list wmzy/haze-ui          # browse the catalog
npx shadcn@latest view wmzy/haze-ui/button   # inspect an item payload
npx shadcn@latest add wmzy/haze-ui/button --dry-run
```

To pin a release, append a tag or commit SHA:
`npx shadcn@latest add wmzy/haze-ui/button#v1.13.0`.

## You still need the CSS

haze-ui ships JS and CSS as separate entry points — installing a wrapper
does **not** import any stylesheet. In your app entry (e.g. `main.tsx` /
`app/layout.tsx`):

```js
// Full sheet, simplest (~12kB gzipped)
import 'haze-ui/styles.css';

// or pay only for what you render: tokens once, then each component
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/button.css';
import 'haze-ui/css/dialog.css';
```

Then activate the design tokens on a container — usually `<body>`:

```jsx
import { lightTheme, spacing, typography } from 'haze-ui';

<body className={`${lightTheme} ${spacing} ${typography}`}>
```

Swap in `darkTheme` for dark mode. The `haze-tokens` item installs the
full token guide (including Tailwind v4 `@theme` interop and CDN URLs)
into `docs/haze-tokens.md` if you want it in your project.

## npm vs registry

| | npm (`npm i haze-ui`) | shadcn registry |
| --- | --- | --- |
| What lands in your repo | nothing (dependency) | one thin wrapper file per item |
| Implementation source | `haze-ui` package | `haze-ui` package (via `dependencies`) |
| Updates | semver via package manager | re-run `shadcn add` (pin with `#tag`) |
| Tree-shaking / per-component CSS | yes | yes (same package underneath) |
| Best for | most projects | teams standardized on the shadcn CLI workflow |

## Repository layout

```
registry.json                      # shadcn registry manifest (repo root)
registry/
├── README.md                      # this file
├── haze-tokens/haze-tokens.md     # token guide installed by the haze-tokens item
└── ui/                            # thin re-export wrappers (one file per item)
    ├── button.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── combobox.tsx
    ├── form.tsx
    ├── data-table.tsx
    ├── toast.tsx
    └── chat-message.tsx
```

Note: `registry.json` here is unrelated to the `registry.json` **export** of
the npm package (`haze-ui/registry.json` under `dist/`) — that one is the
machine-readable design-token registry (`TOKEN_REGISTRY` /
`COMPONENT_TOKENS`). This one follows the
[shadcn registry.json schema](https://ui.shadcn.com/schema/registry.json).
