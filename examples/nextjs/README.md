# Haze UI — Next.js App Router example

A minimal, hand-written Next.js 15 project (no `create-next-app`) exercising
`Button`, `ButtonLink`, `Switch`, `Datepicker`, and `Toast` from haze-ui.

## Run it

```bash
# 1. build the library first — the example consumes dist/, not src/
cd <repo root>
pnpm install
pnpm build

# 2. install and run the example (it is an independent install root)
cd examples/nextjs
pnpm install
pnpm dev        # http://localhost:3000
```

`pnpm build` + `pnpm start` inside `examples/nextjs` for a production run.

## How it is wired

- `app/layout.tsx` imports `haze-ui/styles.css` once (global CSS lives in the
  root layout) and applies the same `lightTheme` / `spacing` / `typography`
  class combination the docs app uses to `<body>`.
- `app/page.tsx` is a `'use client'` component — haze-ui ships no
  `'use client'` directives, the consumer owns the client boundary.
  Components render on the server and hydrate cleanly; see
  `src/lib/ssr-render.node.test.tsx` and `src/lib/ssr-hydration.test.tsx`
  in the repository root.
- `next.config.ts` needs no `transpilePackages`: the `link:../..` dependency
  is a live symlink to the repository root, exposing haze-ui's prebuilt
  ESM + CSS through its package exports map.

## Known limitations

- `haze-ui` is linked with `link:../..` — a live symlink. Re-running
  `pnpm build` in the repo root immediately changes what the example
  serves; no reinstall is needed (`dist/` must exist: run the root build
  once after cloning).
- The comment-only `pnpm-workspace.yaml` in this directory makes it an
  isolated install root. Without it, `pnpm install` here walks up to the
  repository root and silently installs the parent project instead
  (verified with pnpm 11).
- `@linaria/core` and `react-f0rm` are declared as direct dependencies:
  they are haze-ui peers, and the `haze-ui` barrel re-exports `FormItem`,
  so bundlers must resolve them even though this page never uses forms.
- Requires Node >= 18.18 (Next 15). `next-env.d.ts`, `.next/`, and the
  lockfile are generated on first install/dev run; `next-env.d.ts` and
  `.next/` are git-ignored, the lockfile is not — commit it if you want
  reproducible installs.
- Turbopack (`next dev --turbopack`) is not configured or tested here.
