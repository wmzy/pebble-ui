import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';

import { forwardRef } from 'react';

import { css } from '@linaria/core';

/**
 * Extends the native `<a>` attributes. Everything not listed below is spread
 * onto the rendered anchor, so callers (and routers composing NavLink via
 * their `as` prop) can inject `target`, `rel`, `aria-*`, and friends.
 */
type NavLinkProps = {
  href?: string;
  /**
   * Explicit active state. Falls back to `aria-current="page"` when omitted,
   * letting routers drive highlighting through the standard aria attribute.
   */
  active?: boolean;
  children: ReactNode;
  /**
   * Native click handler: receives the underlying mouse event. Whether to
   * call `event.preventDefault()` is up to the caller (an SPA router Link
   * does so itself), except for placeholder hrefs where NavLink keeps
   * button semantics (see the onClick handler below).
   */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'children' | 'onClick' | 'className'>;

const link = css`
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text-muted);
  text-decoration: none;
  padding: var(--haze-space-1) var(--haze-space-2);
  border-radius: var(--haze-radius-sm);
  cursor: pointer;
  transition: color var(--haze-duration-fast), background var(--haze-duration-fast);

  &:hover {
    color: var(--haze-color-text);
    background: var(--haze-color-bg-muted);
  }
`;

const activeLink = css`
  color: var(--haze-color-primary);
  font-weight: var(--haze-weight-medium);
`;

export default forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { href = '#', active, children, onClick, className, 'aria-current': ariaCurrent, ...rest },
  ref,
) {
  const isActive = active ?? ariaCurrent === 'page';

  return (
    <a
      ref={ref}
      x-class={[link, isActive && activeLink, className]}
      href={href}
      aria-current={isActive ? 'page' : ariaCurrent}
      onClick={(event) => {
        // A missing or '#' href means button semantics (e.g. a Logout
        // action): keep suppressing the default so the page does not jump
        // to '#'. Real hrefs pass through untouched and the caller decides
        // whether to prevent navigation (SPA router Links do).
        if (href === '#') {
          event.preventDefault();
        }
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </a>
  );
});

export type { NavLinkProps };
