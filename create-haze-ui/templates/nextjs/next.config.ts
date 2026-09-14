import type { NextConfig } from 'next';

// haze-ui ships prebuilt ESM + CSS through its package exports map, so no
// `transpilePackages` entry is needed — Next bundles the dist output as-is.
const nextConfig: NextConfig = {
  // The host machine may have unrelated projects or lockfiles above the
  // scaffolded app (Next walks up and picks the wrong root). Pin it here.
  outputFileTracingRoot: import.meta.dirname,
  // The template ships no ESLint setup on purpose (keep it minimal) —
  // `next build` skips linting instead of failing on a missing config.
  eslint: {ignoreDuringBuilds: true},
};

export default nextConfig;
