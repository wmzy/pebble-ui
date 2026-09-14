# create-haze-ui

Scaffold a [haze-ui](https://github.com/wmzy/haze-ui) app from the official
templates. Zero runtime dependencies — plain Node built-ins, no network
access beyond what your package manager needs to install dependencies.

## Usage

```sh
# with pnpm (or npm / yarn / bun — the printed next steps follow the
# package manager you invoke)
pnpm create haze-ui my-app

# pick a template
pnpm create haze-ui my-app --template nextjs
npm create haze-ui@latest my-app -- --template vite
```

```
Usage: create-haze-ui [target-dir] [--template <name>]

Options:
  --template, -t   Template to use: vite | nextjs (default: vite)
  --help, -h       Show help
```

The CLI creates `target-dir`, copies the template in (skipping
`node_modules`), renames the package to match the directory, and prints the
install/dev commands for your package manager.

## Templates

- **`vite`** — React 19 + Vite + TypeScript. A single-page demo of
  `Button` / `Input` / `Dialog` / `Toast` with the theme classes mounted on
  the page root, showing both uncontrolled usage and the `ControlOrValue`
  control protocol.
- **`nextjs`** — Next.js 15 App Router + React 19. The home page renders
  the RSC-safe static subset (`Badge` / `Card` / `Typography`) as a React
  Server Component, with a client island for `Button` / `Dialog` / `Toast`
  interactions.

Both templates depend on `haze-ui: latest` and build with a plain
`pnpm install && pnpm build`.

## Errors

Friendly errors are printed for a missing target directory, an unknown
template name, and a non-empty target directory.
