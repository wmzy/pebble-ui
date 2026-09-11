import type { DensitySpaceTokenName } from './spacing';

import { css } from '@linaria/core';

/*
 * Compact density: 75% of the default spacing scale (tokens/spacing.ts),
 * declared through the --haze-density-space-N indirection that the spacing
 * class resolves --haze-space-* through. The values below are exact — the
 * default scale is a 4px grid, so 75% of every step stays on an integer px.
 *
 * Why indirection instead of re-declaring --haze-space-* here: a density
 * class that wrote --haze-space-3 directly would collide with the spacing
 * class at the same specificity, leaving the winner to stylesheet emission
 * order (unstable across per-component css splits and consumer bundles).
 * Here the two classes never declare the same property name — spacing asks
 * var(--haze-density-space-3, 12px) and compact answers it — so any class
 * order on the element produces the same computed scale.
 *
 * Because unregistered custom properties substitute var() eagerly at the
 * element that declares them, compact must land on the SAME element as the
 * spacing class (or on a subtree that re-declares spacing for its island):
 *
 *   <div className={`${lightTheme} ${compact} ${spacing} ${typography}`}>
 *
 * Pure constants — no hooks, no DOM access (RSC-safe; see
 * scripts/rsc-safe.mjs). The type-only import from ./spacing is erased.
 */

export const COMPACT_OVERRIDES: Record<DensitySpaceTokenName, string> = {
  '--haze-density-space-1': '3px',
  '--haze-density-space-2': '6px',
  '--haze-density-space-3': '9px',
  '--haze-density-space-4': '12px',
  '--haze-density-space-5': '15px',
  '--haze-density-space-6': '18px',
  '--haze-density-space-8': '24px',
  '--haze-density-space-10': '30px',
  '--haze-density-space-12': '36px',
  '--haze-density-space-16': '48px',
};

const compactDeclarations = () =>
  Object.entries(COMPACT_OVERRIDES)
    .map(([token, value]) => `${token}: ${value};`)
    .join('\n');

export const compact = css`
${compactDeclarations()}
`;
