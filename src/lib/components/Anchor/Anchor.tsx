import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useEffect } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

export type AnchorItem = {
  /** Section id — the scroll target is `document.getElementById(id)`. */
  id: string;
  /** Link content. */
  label: ReactNode;
};

type AnchorProps = {
  /** Anchor sections, in document order. */
  items: AnchorItem[];
  /** Highlighted section id. Accepts a control (controlled) or a plain value (uncontrolled initial). */
  activeId?: ControlOrValue<string>;
  /** Fires when a link is clicked, after the highlight moves and before scrolling is queued. */
  onClick?: (id: string) => void;
  /** Distance kept between the container top and the section top when scrolling (sticky header height), px. */
  offsetTop?: number;
  /** Scroll-spy trigger line, px from the container top (fallback engines only). */
  bounds?: number;
  /** Scroll container; defaults to `window`. */
  getContainer?: () => HTMLElement | Window;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'nav'>, 'className' | 'onClick' | 'children'>;

const nav = css`
  position: sticky;
  top: 0;
  font-size: var(--haze-text-sm);
`;

const list = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const link = css`
  display: block;
  padding: var(--haze-space-1) var(--haze-space-2);
  border-inline-start: var(--haze-space-1) solid transparent;
  border-radius: 0 var(--haze-radius-sm) var(--haze-radius-sm) 0;
  color: var(--haze-color-text-muted);
  text-decoration: none;
  transition:
    color var(--haze-duration-fast) var(--haze-ease),
    border-color var(--haze-duration-fast) var(--haze-ease);

  &:hover {
    color: var(--haze-color-text);
  }
`;

const linkActive = css`
  border-inline-start-color: var(--haze-color-primary);
  color: var(--haze-color-primary);
  font-weight: var(--haze-weight-medium);
`;

export default function Anchor({
  items,
  activeId: activeIdControl,
  onClick,
  offsetTop = 0,
  bounds = 5,
  getContainer,
  className,
  ...rest
}: AnchorProps) {
  const [activeId, setActiveId] = useControl(
    activeIdControl,
    () => items[0]?.id ?? ''
  );

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const container = getContainer?.() ?? window;
    if (container instanceof HTMLElement) {
      container.scrollTop =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        offsetTop;
      return;
    }
    container.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - offsetTop,
      behavior: 'smooth',
    });
  };

  // Scroll-spy: an IntersectionObserver tracks which sections intersect the
  // viewport band below `offsetTop`; the topmost visible section in document
  // order wins. Engines without IntersectionObserver get the scroll-listener
  // fallback below instead.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const visible = new Set<string>();
    const container = getContainer?.() ?? window;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const next = items.find((item) => visible.has(item.id));
        if (next) setActiveId(next.id);
      },
      {
        root: container instanceof HTMLElement ? container : null,
        rootMargin: `${-offsetTop}px 0px 0px 0px`,
      }
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // `items` identity may churn with the parent, but re-subscribing only
    // re-seeds the observer — entries re-report current positions.
  }, [items, offsetTop, getContainer, setActiveId]);

  // Fallback spy for engines without IntersectionObserver: on each scroll
  // event the active section is the last one whose top crossed `bounds`.
  // No initial run — the uncontrolled/controlled initial value already says
  // where the page is (and jsdom's zero rects would misreport).
  useEffect(() => {
    if (typeof IntersectionObserver !== 'undefined') return;
    const container = getContainer?.() ?? window;
    const scrollBox = container instanceof HTMLElement ? container : window;
    const containerTop =
      container instanceof HTMLElement
        ? container.getBoundingClientRect().top
        : 0;
    const onScroll = () => {
      let next: string | undefined;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top - containerTop <= bounds) {
          next = item.id;
        }
      }
      if (next) setActiveId(next);
    };
    scrollBox.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollBox.removeEventListener('scroll', onScroll);
  }, [items, bounds, getContainer, setActiveId]);

  return (
    <nav x-class={[nav, className]} {...rest}>
      <ul x-class={[list]}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              x-class={[link, activeId === item.id && linkActive]}
              aria-current={activeId === item.id ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                setActiveId(item.id);
                onClick?.(item.id);
                scrollToId(item.id);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type { AnchorProps };
