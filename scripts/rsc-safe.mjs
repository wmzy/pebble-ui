/**
 * RSC-safe module manifest — source modules whose dist output is free of
 * the 'use client' banner so they can be imported directly from React
 * Server Components (same idea as shadcn's RSC-safe static components).
 *
 * A module qualifies only when ALL of the following hold (verified by
 * reading the compiled dist output, not just the source):
 *   - no React hook calls anywhere in the module — useControl/useState/
 *     useEffect/useRef/useCallback and custom `use*` hooks alike. That is
 *     why Tag/Empty/Breadcrumb/AvatarGroup/Progress/Chip (they all call the
 *     useStrings context hook) and Avatar (useState for img error
 *     fallback) are NOT on the list;
 *   - no top-level DOM/window access (module side effects must be
 *     server-safe);
 *   - every in-package import stays inside this set — the transitive
 *     closure is part of the contract, because a server bundler that
 *     reaches a 'use client' module through a safe module turns that
 *     import into a client reference and the render throws. Bare imports
 *     (react/jsx-runtime) are externalized and always fine.
 *
 * Keys are paths relative to src/lib/. Consumed by vite.config.mts (banner
 * suppression during the lib build) and src/lib/dist-esm-contract.test.ts
 * (published-artifact assertions, including the transitive closure check).
 *
 * Keep additions conservative: a 'use client' banner on a server-safe
 * module is harmless, the reverse breaks RSC imports.
 */
export const RSC_SAFE_MODULES = new Set([
  // The x-class runtime every styled component compiles against: a pure
  // function with zero imports. Must be banner-free because every safe
  // component's dist output imports it.
  'utils/classnames.ts',
  // Design tokens: pure constants plus OKLCH math. In-package imports stay
  // within the group (palette -> oklch, registry -> oklch + palette,
  // brands -> palette, density -> spacing types only, erased at emit).
  'tokens/colors.ts',
  'tokens/brands.ts',
  'tokens/spacing.ts',
  'tokens/density.ts',
  'tokens/typography.ts',
  'tokens/motion.ts',
  'tokens/palette.ts',
  'tokens/oklch.ts',
  'tokens/registry.ts',
  'tokens/index.ts',
  // Pure presentational components (verified hook-free, react/linaria
  // imports only). Directories are atomic: a dir joins the list only when
  // every module its barrel re-exports is safe.
  'components/AspectRatio/AspectRatio.tsx',
  'components/AspectRatio/index.ts',
  'components/Badge/Badge.tsx',
  'components/Badge/index.ts',
  'components/Badge/badge-styles.ts',
  'components/Card/Card.tsx',
  'components/Card/index.ts',
  'components/CodeBlock/CodeBlock.tsx',
  'components/CodeBlock/index.ts',
  'components/Container/Container.tsx',
  'components/Container/index.ts',
  'components/Divider/Divider.tsx',
  'components/Divider/index.ts',
  'components/Flex/Flex.tsx',
  'components/Flex/index.ts',
  'components/Grid/Grid.tsx',
  'components/Grid/GridItem.tsx',
  'components/Grid/grid-item-styles.ts',
  'components/Grid/index.ts',
  'components/Icon/Icon.tsx',
  'components/Icon/index.ts',
  'components/Kbd/Kbd.tsx',
  'components/Kbd/index.ts',
  'components/Skeleton/Skeleton.tsx',
  'components/Skeleton/index.ts',
  'components/Stat/Stat.tsx',
  'components/Stat/index.ts',
  'components/Typography/Typography.tsx',
  'components/Typography/index.ts',
]);

/**
 * Relativize an absolute module id (rollup `facadeModuleId` etc.) against
 * src/lib. Returns undefined for ids outside src/lib or with no id at all
 * (shared chunks without a module facade).
 */
export function libRelativeModuleId(moduleId) {
  if (!moduleId) return undefined;
  const normalized = moduleId.replaceAll('\\', '/').split('?')[0];
  const marker = '/src/lib/';
  const at = normalized.lastIndexOf(marker);
  return at === -1 ? undefined : normalized.slice(at + marker.length);
}

/** True when the module id is one of the RSC-safe source modules. */
export function isRscSafeModule(moduleId) {
  const rel = libRelativeModuleId(moduleId);
  return rel !== undefined && RSC_SAFE_MODULES.has(rel);
}

/** The safe list mapped to dist paths ('components/Badge/Badge.tsx' -> '.../Badge.js'). */
export const rscSafeDistPaths = () =>
  new Set([...RSC_SAFE_MODULES].map((key) => key.replace(/\.tsx?$/, '.js')));
