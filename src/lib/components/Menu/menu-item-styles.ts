import { css } from '@linaria/core';

/**
 * Shared slot and variant skins for the Menu family's item types
 * (MenuItem, MenuCheckboxItem, MenuRadioItem). Merged after each item's
 * base class so the overrides win on equal specificity.
 */

/**
 * Danger skin for destructive actions: danger-colored text with a
 * danger-subtle interaction background.
 */
export const menuItemDanger = css`
  color: var(--haze-color-danger);

  &:hover,
  &:active {
    background: var(--haze-color-danger-subtle);
  }
`;

/**
 * Inline-start icon slot. The slot sizes bare `svg` children to 1em —
 * an svg without intrinsic dimensions collapses to 0×0 inside flex.
 */
export const menuItemIcon = css`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-inline-end: var(--haze-space-2);

  & svg {
    width: 1em;
    height: 1em;
  }
`;

/**
 * Inline-end shortcut hint (e.g. '⌘C'): muted, monospaced, pushed to
 * the item's inline end.
 */
export const menuItemKbd = css`
  margin-inline-start: auto;
  padding-inline-start: var(--haze-space-3);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
`;

/**
 * Fixed-size state indicator box (check/dot) for checkbox and radio
 * items: reserves its square whether or not the glyph renders, so
 * labels align across mixed items.
 */
export const menuItemIndicator = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1em;
  height: 1em;
  margin-inline-end: var(--haze-space-2);
`;

/** Group heading: muted, one step smaller than item text. Shared by MenuGroup and MenuRadioGroup's optional label. */
export const menuGroupLabel = css`
  padding: var(--haze-space-2) var(--haze-space-3) var(--haze-space-1);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text-muted);
`;
