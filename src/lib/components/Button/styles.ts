import {css} from '@linaria/core';

/**
 * Shared Button skin — the base, variant and size classes `Button` and
 * `ButtonLink` both wear. Living in their own module keeps the two
 * components' visual contract in one place (one edit re-skins both) and
 * keeps component files free of style internals; split-css groups the
 * emitted CSS into `haze-ui/css/button.css` with them.
 */

export const base = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-2);
  border: 1px solid transparent;
  border-radius: var(--haze-radius-md);
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
  padding: var(--haze-space-1) var(--haze-space-3);
  font-size: var(--haze-text-sm);
`;

export const sizeMd = css`
  padding: var(--haze-space-2) var(--haze-space-4);
  font-size: var(--haze-text-sm);
`;

export const sizeLg = css`
  padding: var(--haze-space-3) var(--haze-space-6);
  font-size: var(--haze-text-base);
`;

export const squareSm = css`
  padding: var(--haze-space-1);
  font-size: var(--haze-text-sm);
`;

export const squareMd = css`
  padding: var(--haze-space-2);
  font-size: var(--haze-text-sm);
`;

export const squareLg = css`
  padding: var(--haze-space-3);
  font-size: var(--haze-text-base);
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
