import {css} from '@linaria/core';

/**
 * Shared Badge skin — the base, variant and size classes the `Badge`
 * component wears. Living in their own module keeps the component file
 * free of style internals (react-refresh boundary) and lets the
 * variants/sizes maps ship as public constants (`badgeVariants` /
 * `badgeSizes`, the shadcn `buttonVariants` precedent) for consumers
 * composing custom elements with the same skin; split-css groups the
 * emitted CSS into `haze-ui/css/badge.css` with them.
 */

export const base = css`
  display: inline-flex;
  align-items: center;
  border-radius: var(--haze-radius-full);
  font-family: var(--haze-font-sans);
  font-weight: var(--haze-weight-medium);
  line-height: var(--haze-leading-tight);
  white-space: nowrap;
`;

export const variants = {
  default: css`
    background: var(--haze-color-bg-muted);
    color: var(--haze-color-text-secondary);
  `,
  success: css`
    background: var(--haze-color-success-subtle);
    color: var(--haze-color-success);
  `,
  warning: css`
    background: var(--haze-color-warning-subtle);
    color: var(--haze-color-warning);
  `,
  danger: css`
    background: var(--haze-color-danger-subtle);
    color: var(--haze-color-danger);
  `,
  info: css`
    background: var(--haze-color-info-subtle);
    color: var(--haze-color-info);
  `,
} as const;

export const sizes = {
  sm: css`
    padding: var(--haze-space-0) var(--haze-space-2);
    font-size: var(--haze-text-xs);
  `,
  md: css`
    padding: var(--haze-space-1) var(--haze-space-3);
    font-size: var(--haze-text-sm);
  `,
} as const;
