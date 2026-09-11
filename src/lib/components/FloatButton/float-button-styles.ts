import { css } from '@linaria/core';

/**
 * Shared FloatButton skin — the button face both `FloatButton` and the
 * `FloatButtonGroup` trigger wear, plus the fixed anchor and the
 * expand/collapse menu mechanics. Split into its own module (with the
 * `float-button-` basename Linaria hashes class names from) so component
 * files stay free of style internals and no two siblings ever collide on
 * the `haze-styles__*` slug.
 *
 * ## Component-level tokens
 *
 * The skin exposes component-scoped custom properties for per-component
 * theming. The library never *defines* them — every usage below is a
 * fallback chain, so the shipped look is the fallback until a consumer
 * sets the variable on `:root` or any ancestor (plain CSS inheritance):
 *
 * - `--haze-float-button-size` — button size (fallback `2.5rem`)
 * - `--haze-float-button-offset` — screen-edge gap of the fixed anchor
 *   (fallback `--haze-space-6`); the safe-area inset is always added on
 *   top for the block-end edge
 * - `--haze-float-button-radius` — `square` shape radius
 *   (fallback `--haze-radius-lg`)
 *
 * ## Button semantics
 *
 * `variant` mirrors Button's `solid | outline | ghost` family and reads
 * the same color tokens, so a FloatButton re-themes together with
 * Buttons — only the elevation (FAB shadow) is FloatButton-specific.
 */

export const fab = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-1);
  min-width: var(--haze-float-button-size, 2.5rem);
  height: var(--haze-float-button-size, 2.5rem);
  padding-inline: var(--haze-space-3);
  border: 1px solid transparent;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  line-height: var(--haze-leading-tight);
  cursor: pointer;
  user-select: none;
  text-decoration: none;
  box-shadow: var(--haze-shadow-lg);
  transition:
    background var(--haze-duration-fast),
    color var(--haze-duration-fast),
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &:hover {
    box-shadow: var(--haze-shadow-xl);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* anchors have no :disabled — ButtonLink precedent */
  &[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

export const shapes = {
  circle: css`
    border-radius: var(--haze-radius-full);
  `,
  square: css`
    border-radius: var(--haze-float-button-radius, var(--haze-radius-lg));
  `,
} as const;

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
    background: var(--haze-color-bg);
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
    box-shadow: none;

    &:hover {
      background: var(--haze-color-bg-subtle);
    }

    &:active {
      background: var(--haze-color-bg-muted);
    }
  `,
} as const;

/**
 * Fixed screen anchor — logical insets keep the placement RTL-safe
 * (inline-end flips with direction). Only the block-end edge carries the
 * physical safe-area env, which has no logical counterpart but matches
 * block-end in every horizontal writing mode.
 */
export const anchored = css`
  position: fixed;
  inset-block-end: calc(
    var(--haze-float-button-offset, var(--haze-space-6)) + env(safe-area-inset-bottom, 0px)
  );
  inset-inline-end: var(--haze-float-button-offset, var(--haze-space-6));
`;

export const groupAnchor = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--haze-space-3);
`;

/**
 * Expand/collapse list of grouped buttons. The outer grid animates its
 * single row track 1fr↔0fr (no content-height knowledge needed); the
 * structural inner wrapper clips while shrinking. `visibility` keeps
 * collapsed items out of the tab order, delayed on close so the collapse
 * animation finishes first and immediate on open.
 */
export const menuList = css`
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows var(--haze-duration-normal) var(--haze-ease),
    visibility 0s linear 0s;

  & > * {
    overflow: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--haze-space-3);

    & > * {
      transition:
        transform var(--haze-duration-normal) var(--haze-ease),
        opacity var(--haze-duration-fast) linear;
    }
  }

  &[data-state='closed'] {
    grid-template-rows: 0fr;
    visibility: hidden;
    transition:
      grid-template-rows var(--haze-duration-normal) var(--haze-ease),
      visibility 0s linear var(--haze-duration-normal);

    & > * > * {
      opacity: 0;
      transform: translateY(30%) scale(0.4);
    }
  }
`;

export const iconBox = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--haze-duration-normal) var(--haze-ease);

  /* an intrinsic-size svg is mandatory: a viewBox-only svg contributes
   * 0×0 inside a flex box and never renders */
  & > svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

/** Plus rotates into an × as the group opens (AntD behavior). */
export const iconOpen = css`
  transform: rotate(45deg);
`;

export const descBox = css`
  white-space: nowrap;
`;
