import type { ComponentPropsWithoutRef } from 'react';

import { forwardRef } from 'react';

import { css } from '@linaria/core';

import { base, sizes, squareSizes, variants } from './styles';

/**
 * A real `<a>` with the full Button appearance — for navigation that
 * must look like a button. Rendering `as={Button}` puts `href` on a
 * `<button>` (an invalid attribute: no ⌘/middle-click, no crawlable
 * link); ButtonLink keeps the anchor semantics and wears Button's skin
 * (same `variant`/`size`/`square` props, same focus/disabled visual
 * states).
 *
 * Extends the native `<a>` attributes — everything not listed below is
 * spread onto the anchor, so routers composing their own `Link` through
 * an `as` prop can inject `href`, `onClick`, `target`, `rel` and
 * friends (NavLink-style).
 *
 * Anchors have no `disabled` attribute: report the state with
 * `aria-disabled` (and `tabIndex={-1}` to drop it from the focus
 * order) — ButtonLink styles `aria-disabled` exactly like Button's
 * `:disabled`.
 *
 * Component-level theming tokens (`--haze-button-*`) apply here too —
 * this anchor wears the exact same skin as Button (see ./styles).
 */
type ButtonLinkProps = {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  square?: boolean;
} & ComponentPropsWithoutRef<'a'>;

const link = css`
  /* anchors bring a UA underline; a button-looking link resets it
   * (variants already own the color) */
  text-decoration: none;

  /* anchor-shaped disabled: Button's :disabled, driven by the state
   * attribute callers report (pair with tabIndex={-1}) */
  &[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

export default forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    { variant = 'solid', size = 'md', square = false, className, ...rest },
    ref
  ) {
    const sizeClass = square ? squareSizes[size] : sizes[size];
    return (
      <a
        ref={ref}
        x-class={[base, variants[variant], sizeClass, link, className]}
        {...rest}
      />
    );
  }
);

export type { ButtonLinkProps };
