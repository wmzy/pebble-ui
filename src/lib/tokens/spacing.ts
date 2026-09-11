import { css } from '@linaria/core';

/*
 * Spacing defaults live in SPACING_DEFAULTS so the css template below, the
 * compact density class (./density) and the token tests all read one source
 * of truth (same pattern as colors.ts deriving its themes from palette.ts).
 *
 * Indirect addressing: every --haze-space-N the spacing class declares
 * resolves through a --haze-density-space-N reference with the default as
 * fallback. Unregistered custom properties substitute their var() eagerly
 * at the element that declares them, so a --haze-density-* value cascaded
 * onto that same element is what the scale resolves to there — while the
 * spacing class and a density class never declare the same property name,
 * so neither can win or lose by stylesheet emission order (see ./density).
 * Radius and shadow stay direct: they are not density-adjusted.
 */

const SPACE_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as const;

export type SpaceStep = (typeof SPACE_STEPS)[number];
export type SpaceTokenName = `--haze-space-${SpaceStep}`;
export type DensitySpaceTokenName = `--haze-density-space-${SpaceStep}`;

export const SPACING_DEFAULTS: Record<SpaceTokenName, string> = {
  '--haze-space-1': '4px',
  '--haze-space-2': '8px',
  '--haze-space-3': '12px',
  '--haze-space-4': '16px',
  '--haze-space-5': '20px',
  '--haze-space-6': '24px',
  '--haze-space-8': '32px',
  '--haze-space-10': '40px',
  '--haze-space-12': '48px',
  '--haze-space-16': '64px',
};

/**
 * The space declarations the spacing class emits, one per overridable step:
 * `--haze-space-N: var(--haze-density-space-N, <default>);`. Exported for
 * the token tests — the css template interpolates this exact function, and
 * Linaria evaluates it at build time (colors.ts interpolation precedent).
 */
export function spacingDeclarations(): string {
  return SPACE_STEPS.map((step) => {
    const token: SpaceTokenName = `--haze-space-${step}`;
    return `${token}: var(--haze-density-space-${step}, ${SPACING_DEFAULTS[token]});`;
  }).join('\n');
}

export const spacing = css`
  --haze-space-0: 0;
${spacingDeclarations()}

  --haze-radius-none: 0;
  --haze-radius-sm: 4px;
  --haze-radius-md: 6px;
  --haze-radius-lg: 8px;
  --haze-radius-xl: 12px;
  --haze-radius-2xl: 16px;
  --haze-radius-full: 9999px;

  --haze-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --haze-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --haze-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --haze-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
`;
