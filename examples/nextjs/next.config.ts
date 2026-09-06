import type { NextConfig } from 'next';

// haze-ui is consumed from dist/ via its package exports map
// (`import` -> dist ESM, `./styles.css` -> dist/haze-ui.css), already
// compiled — no JSX/TS reaches the consumer. That is why no
// `transpilePackages: ['haze-ui']` entry is needed even though the
// package is linked with `link:../..`: Next bundles the prebuilt
// ESM and CSS as-is. If you ever point the link at an unbuilt
// checkout (src/ instead of dist/), add transpilePackages here.
const nextConfig: NextConfig = {
  // The host machine may have unrelated lockfiles above this repo (Next
  // walks up and picks the wrong workspace root). Pin the root here.
  outputFileTracingRoot: import.meta.dirname,
  // Next's build-time lint inherits the repo root eslint config, whose
  // react-refresh rules flag the standard `export const metadata` +
  // default component layout pattern. This example proves SSR/hydration,
  // not lint policy — `pnpm lint` at the repo root owns that.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
