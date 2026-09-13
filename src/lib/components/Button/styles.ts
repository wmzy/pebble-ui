import {css} from '@linaria/core';

/**
 * Shared Button skin — the base, variant and size classes `Button` and
 * `ButtonLink` both wear. Living in their own module keeps the two
 * components' visual contract in one place (one edit re-skins both) and
 * keeps component files free of style internals; split-css groups the
 * emitted CSS into `haze-ui/css/button.css` with them.
 *
 * ## Component-level tokens
 *
 * The skin exposes component-scoped custom properties for per-component
 * theming. The library never *defines* them — every usage below is a
 * fallback chain, so the shipped look is the fallback until a consumer
 * sets the variable on `:root` or any ancestor (scoping is plain CSS
 * inheritance: set it on a wrapper to retheme only that subtree):
 *
 * - `--haze-button-height-sm` / `-md` / `-lg` — height per size
 *   (fallback `auto`: content-driven, the unchanged shipped look)
 * - `--haze-button-font-size-sm` / `-md` / `-lg` — label size per size
 *   (fallbacks `--haze-text-sm` / `--haze-text-sm` / `--haze-text-base`)
 * - `--haze-button-radius` — corner radius (fallback `--haze-radius-md`)
 *
 * `Button`, `ButtonLink`, `Toggle` and the Toolbar items all wear this
 * skin, so one variable rethemes the whole family.
 */

export const base = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-2);
  border: 1px solid transparent;
  border-radius: var(--haze-button-radius, var(--haze-radius-md));
  font-family: var(--haze-font-sans);
  font-weight: var(--haze-weight-medium);
  line-height: var(--haze-leading-tight);
  cursor: pointer;
  transition:
    background var(--haze-duration-fast),
    color var(--haze-duration-fast),
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);
  user-select: none;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Windows high contrast (forced-colors): the UA squashes every
     author color, drops box-shadows and forces existing borders to the
     text color. The base's transparent 1px border therefore survives
     as a ButtonText boundary already — restating it keeps ghost/link
     buttons deterministic instead of relying on the UA default. The
     box-shadow focus ring is dropped by the UA, so keyboard focus
     moves to a real outline in the Highlight system color. Disabled
     surfaces render in GrayText at full opacity (the 0.5 dim reads as
     noise against a two-color canvas). */
  @media (forced-colors: active) {
    border-color: ButtonText;

    &:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 1;
      color: GrayText;
    }
  }
`;

export const variants = {
  solid: css`
    background: var(--haze-color-primary);
    color: var(--haze-color-text-inverse);

    &:hover {
      background: var(--haze-color-primary-hover);
    }

    &:active {
      background: var(--haze-color-primary-active);
    }
  `,
  outline: css`
    background: transparent;
    border-color: var(--haze-color-border);
    color: var(--haze-color-text);

    &:hover {
      border-color: var(--haze-color-border-hover);
      background: var(--haze-color-bg-subtle);
    }

    &:active {
      background: var(--haze-color-bg-muted);
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--haze-color-text);

    &:hover {
      background: var(--haze-color-bg-subtle);
    }

    &:active {
      background: var(--haze-color-bg-muted);
    }
  `,
} as const;

export const sizeSm = css`
  height: var(--haze-button-height-sm, auto);
  padding: var(--haze-space-1) var(--haze-space-3);
  font-size: var(--haze-button-font-size-sm, var(--haze-text-sm));
`;

export const sizeMd = css`
  height: var(--haze-button-height-md, auto);
  padding: var(--haze-space-2) var(--haze-space-4);
  font-size: var(--haze-button-font-size-md, var(--haze-text-sm));
`;

export const sizeLg = css`
  height: var(--haze-button-height-lg, auto);
  padding: var(--haze-space-3) var(--haze-space-6);
  font-size: var(--haze-button-font-size-lg, var(--haze-text-base));
`;

export const squareSm = css`
  height: var(--haze-button-height-sm, auto);
  padding: var(--haze-space-1);
  font-size: var(--haze-button-font-size-sm, var(--haze-text-sm));
`;

export const squareMd = css`
  height: var(--haze-button-height-md, auto);
  padding: var(--haze-space-2);
  font-size: var(--haze-button-font-size-md, var(--haze-text-sm));
`;

export const squareLg = css`
  height: var(--haze-button-height-lg, auto);
  padding: var(--haze-space-3);
  font-size: var(--haze-button-font-size-lg, var(--haze-text-base));
`;

export const sizes = {
  sm: sizeSm,
  md: sizeMd,
  lg: sizeLg,
} as const;

export const squareSizes = {
  sm: squareSm,
  md: squareMd,
  lg: squareLg,
} as const;
