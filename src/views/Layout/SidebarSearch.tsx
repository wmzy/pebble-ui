import type { ReactNode } from 'react';

import { useEffect, useRef } from 'react';

import { css } from '@linaria/core';
import { Search, X } from 'lucide-react';

import { Icon } from '@/lib';

/*
 * Search box for the sidebar COMPONENTS list.
 *
 * Scoring tiers (prefix / word-initial / substring / subsequence) live in
 * ./search-score — a pure module, unit-tested there.
 */

const markHit = css`
  background: var(--haze-color-primary-subtle);
  color: var(--haze-color-primary);
  border-radius: var(--haze-radius-sm);
`;

function toRanges(indices: readonly number[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (const i of indices) {
    const last = ranges[ranges.length - 1];
    if (last?.[1] === i - 1) last[1] = i;
    else ranges.push([i, i]);
  }
  return ranges;
}

/** Renders `text` with the matched character positions wrapped in <mark>. */
export function MatchText({
  text,
  indices,
}: {
  text: string;
  indices: readonly number[];
}) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  toRanges(indices).forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className={markHit}>
        {text.slice(start, end + 1)}
      </mark>
    );
    cursor = end + 1;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

const searchBox = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  margin: 0 var(--haze-space-4);
  padding: var(--haze-space-1) var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg-subtle);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus-within {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const searchInput = css`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  padding: 0;
  background: transparent;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);

  &::placeholder {
    color: var(--haze-color-text-muted);
  }
`;

const clearBtn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  padding: 0;
  background: transparent;
  color: var(--haze-color-text-muted);
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: var(--haze-color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
    border-radius: var(--haze-radius-sm);
  }
`;

const kbdHint = css`
  flex-shrink: 0;
  padding: 0 var(--haze-space-1);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  background: var(--haze-color-bg);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  line-height: 1.4;
`;

type SidebarSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, []);

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={searchBox} role='search'>
      <Icon icon={Search} size='sm' />
      <input
        ref={inputRef}
        className={searchInput}
        type='text'
        value={value}
        placeholder='Search components'
        aria-label='Search components'
        autoComplete='off'
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('');
            inputRef.current?.blur();
          }
        }}
      />
      {value ? (
        <button
          type='button'
          className={clearBtn}
          aria-label='Clear search'
          onClick={clear}
        >
          <Icon icon={X} size='sm' />
        </button>
      ) : (
        <span className={kbdHint} aria-hidden='true'>
          /
        </span>
      )}
    </div>
  );
}
