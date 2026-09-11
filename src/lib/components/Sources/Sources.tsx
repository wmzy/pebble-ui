import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useId } from 'react';
import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

/** One cited source: a numbered entry whose title optionally links out. */
type SourceItem = {
  /** Stable identity — the list key and the unit of `expanded`. */
  id: string;
  title: ReactNode;
  /** When present the title becomes an external link (safe rel, new tab). */
  url?: string;
  /** Excerpt quoted from the source; revealed on hover/focus or `expanded`. */
  snippet?: ReactNode;
};

type SourcesProps = {
  items: SourceItem[];
  /**
   * Compact footnote form: an inline `nav` of `[1] [2] [3]` badges
   * (each linking out when `url` is set) instead of the full list.
   */
  compact?: boolean;
  /**
   * Ids of the items whose snippet stays expanded regardless of
   * hover/focus. Controllable: pass a control to own the toggle state.
   */
  expanded?: ControlOrValue<readonly string[]>;
  /** Accessible name for the list (`compact`: the nav landmark).
   * Default from `sources.label` in the locale packs. */
  label?: string;
  /** `aria-label` of a collapsed item's excerpt toggle button.
   * Default from `sources.expand`. */
  expandLabel?: string;
  /** `aria-label` of an expanded item's excerpt toggle button.
   * Default from `sources.collapse`. */
  collapseLabel?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'ol'>, 'children'>;

const list = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

const item = css`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  column-gap: var(--haze-space-2);
`;

const badge = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  flex-shrink: 0;
  user-select: none;
`;

const link = css`
  color: var(--haze-color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const title = css`
  color: var(--haze-color-text);
`;

const toggleBtn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  align-self: center;
  border: none;
  border-radius: var(--haze-radius-sm);
  background: none;
  color: var(--haze-color-text-muted);
  cursor: pointer;
  transition: color var(--haze-duration-fast) var(--haze-ease);

  &:hover {
    color: var(--haze-color-text);
  }

  &[aria-expanded='true'] svg {
    transform: rotate(90deg);
  }
`;

const snippetBase = css`
  flex-basis: 100%;
  padding: var(--haze-space-1) var(--haze-space-2);
  border-inline-start: 2px solid var(--haze-color-border);
  color: var(--haze-color-text-secondary);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  transition:
    opacity var(--haze-duration-fast) var(--haze-ease),
    visibility var(--haze-duration-fast) var(--haze-ease);
`;

/* Hidden by default; the item's hover/focus-within reveals it (the
   ChatMessage actions-row pattern — visibility participates so the
   collapsed excerpt is not announced). The hover selectors out-specify
   this plain class, so no expanded/hover conflict is possible. */
const snippetHidden = css`
  opacity: 0;
  visibility: hidden;

  [data-haze-sources-item]:hover &,
  [data-haze-sources-item]:focus-within & {
    opacity: 1;
    visibility: visible;
  }
`;

const snippetShown = css`
  opacity: 1;
  visibility: visible;
`;

const compactNav = css`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--haze-space-1);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
`;

const compactBadge = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  padding: 0 var(--haze-space-1);
  border-radius: var(--haze-radius-sm);
  color: var(--haze-color-text-muted);
  text-decoration: none;
  user-select: none;

  &:hover {
    color: var(--haze-color-primary);
    background: var(--haze-color-primary-subtle);
  }
`;

/** Explicit width/height: a viewBox-only inline svg contributes zero
 * content size in flex containers and collapses to 0×0. */
const ChevronGlyph = () => (
  <svg
    width='10'
    height='10'
    viewBox='0 0 10 10'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
    style={{ transition: 'transform var(--haze-duration-fast) var(--haze-ease)' }}
  >
    <path d='M3 1.5 6.5 5 3 8.5' />
  </svg>
);

/** The badge alone is a poor accessible name for a link; prefer the
 * source title when it is a plain string. */
function compactBadgeLabel(itemTitle: ReactNode, number: number): string {
  return typeof itemTitle === 'string'
    ? `${number}. ${itemTitle}`
    : `[${number}]`;
}

export default function Sources({
  items,
  compact = false,
  expanded: expandedControl,
  label,
  expandLabel,
  collapseLabel,
  className,
  ...rest
}: SourcesProps) {
  const strings = useStrings('sources');
  const resolvedLabel = label ?? strings.label;
  const resolvedExpandLabel = expandLabel ?? strings.expand;
  const resolvedCollapseLabel = collapseLabel ?? strings.collapse;
  const listId = useId();
  const [expandedIds, setExpandedIds] = useControl<readonly string[]>(
    expandedControl,
    []
  );
  if (compact) {
    return (
      <nav aria-label={resolvedLabel} x-class={[compactNav, className]} {...rest}>
        {items.map((source, index) => {
          const number = index + 1;
          const badgeLabel = compactBadgeLabel(source.title, number);
          return source.url ? (
            <a
              key={source.id}
              href={source.url}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={badgeLabel}
              x-class={[compactBadge]}
            >
              [{number}]
            </a>
          ) : (
            <span key={source.id} aria-label={badgeLabel} x-class={[compactBadge]}>
              [{number}]
            </span>
          );
        })}
      </nav>
    );
  }

  const isExpanded = (id: string) => expandedIds.includes(id);
  const toggle = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  };

  return (
    <ol aria-label={resolvedLabel} x-class={[list, className]} {...rest}>
      {items.map((source, index) => {
        const number = index + 1;
        const snippetId = `${listId}-snippet-${source.id}`;
        const itemExpanded = isExpanded(source.id);
        return (
          <li
            key={source.id}
            data-haze-sources-item=''
            data-state={itemExpanded ? 'expanded' : 'collapsed'}
            x-class={[item]}
          >
            <span x-class={[badge]} aria-hidden='true'>
              [{number}]
            </span>
            {source.url ? (
              <a
                href={source.url}
                target='_blank'
                rel='noopener noreferrer'
                x-class={[link]}
              >
                {source.title}
              </a>
            ) : (
              <span x-class={[title]}>{source.title}</span>
            )}
            {source.snippet != null && (
              <>
                <button
                  type='button'
                  aria-expanded={itemExpanded}
                  aria-controls={snippetId}
                  aria-label={itemExpanded ? resolvedCollapseLabel : resolvedExpandLabel}
                  onClick={() => toggle(source.id)}
                  x-class={[toggleBtn]}
                >
                  <ChevronGlyph />
                </button>
                <div
                  id={snippetId}
                  x-class={[
                    snippetBase,
                    itemExpanded ? snippetShown : snippetHidden,
                  ]}
                >
                  {source.snippet}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export type { SourcesProps, SourceItem };
