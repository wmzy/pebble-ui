import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  Ref,
} from 'react';

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { css } from '@linaria/core';

/** Alignment of a row after an imperative `scrollToIndex` call. */
type VirtualListAlign = 'start' | 'center' | 'end' | 'auto';

/**
 * Imperative handle exposed through the React 19 `ref` prop.
 *
 * API choice: a component ref (ref-as-prop + `useImperativeHandle`) rather
 * than a `listRef` control prop — scrolling is imperative DOM driving, not
 * component state, so the Control pattern does not apply. React 19 passes
 * `ref` as a plain prop to function components, so no forwardRef wrapper is
 * needed (matches the repo rule: refs only for concrete use cases).
 */
type VirtualListHandle = {
  /**
   * Scroll the row at `index` into view. `align` defaults to `'auto'`:
   * a no-op when the row is already fully visible; rows entering from
   * above align to `'end'` (keeps preceding context on screen), rows
   * entering from below align to `'start'`.
   */
  scrollToIndex: (index: number, align?: VirtualListAlign) => void;
};

/** Sticky group-header descriptor for `VirtualListProps.groups`. */
type VirtualListGroup = {
  /** Index of the first item of the group; non-decreasing across `groups`. */
  startIndex: number;
  /** Stable React key; doubles as the header measurement-cache key. */
  key: string;
  /** Header content, rendered inside the sticky wrapper. */
  render: () => ReactNode;
};

type VirtualListProps<T> = {
  items: T[];
  /** Scrollport height in px. */
  height: number;
  /**
   * Row height in px. Exact in fixed mode; in dynamic mode only the
   * pre-measurement estimate (pass `estimatedItemHeight` to opt in).
   */
  itemHeight: number;
  /**
   * Provide to enable dynamic row heights: every mounted row is measured
   * with a ResizeObserver and cached by index. Row offsets come from a
   * prefix sum over measured heights (never-rendered rows fall back to
   * this estimate), so layout stays correct as rows resize. Cached
   * heights survive `items` updates and are truncated when the list
   * shrinks.
   */
  estimatedItemHeight?: number;
  /**
   * Optional sticky group headers. A header pins to the scrollport top
   * while its group spans the viewport and slides away when the next
   * header reaches it. Header positions derive from the same offset
   * system as rows, so fixed and dynamic modes are both supported.
   * Headers overlay rows — they occupy no layout space in the list.
   */
  groups?: VirtualListGroup[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Extra rows kept mounted above/below the visible window. */
  overscan?: number;
  className?: string;
  ref?: Ref<VirtualListHandle>;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const container = css`
  overflow-y: auto;
  font-family: var(--haze-font-sans);
`;

const viewport = css`
  position: relative;
  width: 100%;
`;

const groupHeader = css`
  position: absolute;
  inset-inline: 0;
  z-index: 1;
  box-sizing: border-box;
  background: var(--haze-color-bg);
  border-bottom: 1px solid var(--haze-color-border);
  padding: var(--haze-space-1) var(--haze-space-2);
`;

/** First row whose bottom edge lies strictly below `offset`. */
function findStartIndex(
  prefix: Float64Array,
  length: number,
  offset: number,
): number {
  let lo = 0;
  let hi = length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    // Float64Array reads are in-bounds by construction; ?? 0 satisfies
    // noUncheckedIndexedAccess (the array is zero-initialized anyway).
    if ((prefix[mid + 1] ?? 0) > offset) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** First row whose top edge lies at or beyond `offset`. */
function findEndIndex(
  prefix: Float64Array,
  length: number,
  offset: number,
): number {
  let lo = 0;
  let hi = length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((prefix[mid] ?? 0) >= offset) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** Top offset of `index`, clamped into the list range. */
function offsetAt(prefix: Float64Array, length: number, index: number): number {
  return prefix[Math.max(0, Math.min(length, index))] ?? 0;
}

type PrefixCache = {
  items: unknown[];
  version: number;
  itemHeight: number;
  estimated: number | undefined;
  dynamic: boolean;
  sums: Float64Array;
};

export default function VirtualList<T>({
  items,
  height,
  itemHeight,
  estimatedItemHeight,
  groups,
  renderItem,
  overscan = 5,
  className,
  style,
  ref,
  ...rest
}: VirtualListProps<T>) {
  const isDynamic = estimatedItemHeight !== undefined;
  const hasGroups = groups !== undefined && groups.length > 0;
  // Estimate for not-yet-measured dynamic rows (and unmeasured headers).
  const estimate = estimatedItemHeight ?? itemHeight;

  const [scrollTop, setScrollTop] = useState(0);
  const [measureVersion, setMeasureVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowHeightsRef = useRef(new Map<number, number>());
  const headerHeightsRef = useRef(new Map<string, number>());
  const observerRef = useRef<ResizeObserver | null>(null);
  const prefixCacheRef = useRef<PrefixCache | null>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Prefix sums: sums[i] is the top offset of row i, sums[length] the total
  // list height. Recomputed only when items, heights config, or a cached
  // measurement changes (measureVersion).
  const prefix = (() => {
    const cache = prefixCacheRef.current;
    if (
      cache?.items === items &&
      cache.version === measureVersion &&
      cache.itemHeight === itemHeight &&
      cache.estimated === estimatedItemHeight &&
      cache.dynamic === isDynamic
    ) {
      return cache.sums;
    }
    const sums = new Float64Array(items.length + 1);
    for (let i = 0; i < items.length; i++) {
      sums[i + 1] =
        (sums[i] ?? 0) +
        (isDynamic ? rowHeightsRef.current.get(i) ?? estimate : itemHeight);
    }
    prefixCacheRef.current = {
      items,
      version: measureVersion,
      itemHeight,
      estimated: estimatedItemHeight,
      dynamic: isDynamic,
      sums,
    };
    return sums;
  })();

  const totalHeight = prefix[items.length] ?? 0;
  const startIndex = Math.max(
    0,
    findStartIndex(prefix, items.length, scrollTop) - overscan,
  );
  const endIndex = Math.min(
    items.length,
    findEndIndex(prefix, items.length, scrollTop + height) + overscan,
  );

  // Drop cached row heights past the end when the list shrinks; indices keep
  // their measurements across items updates otherwise.
  useEffect(() => {
    const heights = rowHeightsRef.current;
    for (const index of heights.keys()) {
      if (index >= items.length) heights.delete(index);
    }
  }, [items.length]);

  // Drop header measurements for groups that are no longer present.
  useEffect(() => {
    if (!groups) return;
    const heights = headerHeightsRef.current;
    const keys = new Set(groups.map((group) => group.key));
    for (const key of heights.keys()) {
      if (!keys.has(key)) heights.delete(key);
    }
  }, [groups]);

  // One observer measures every mounted row (`data-index`) and group header
  // (`data-group-key`); any measurement differing from the cache re-renders.
  // Runs before the observe effect below so the observer exists when rows
  // are queried on the first commit.
  useEffect(() => {
    if (!isDynamic && !hasGroups) return;
    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const { index, groupKey } = target.dataset;
        const measured = target.getBoundingClientRect().height;
        if (index !== undefined) {
          const rowIndex = Number(index);
          if (rowHeightsRef.current.get(rowIndex) !== measured) {
            rowHeightsRef.current.set(rowIndex, measured);
            changed = true;
          }
        } else if (
          groupKey !== undefined &&
          headerHeightsRef.current.get(groupKey) !== measured
        ) {
          headerHeightsRef.current.set(groupKey, measured);
          changed = true;
        }
      }
      if (changed) setMeasureVersion((version) => version + 1);
    });
    observerRef.current = observer;
    return () => {
      observerRef.current = null;
      observer.disconnect();
    };
  }, [isDynamic, hasGroups]);

  // Observe whatever rows/headers are currently mounted. `observe()` on an
  // already-observed element is a spec no-op, so re-running is safe.
  useEffect(() => {
    const observer = observerRef.current;
    const root = containerRef.current;
    if (!observer || !root) return;
    root
      .querySelectorAll<HTMLElement>('[data-index], [data-group-key]')
      .forEach((el) => {
        observer.observe(el);
      });
  }, [startIndex, endIndex, measureVersion, groups, isDynamic, hasGroups]);

  // Sticky group headers: pin to the scrollport top while the group spans
  // the viewport, release (slide up) when the next header pushes past the
  // group's end. All in the same prefix-sum system as the rows.
  const headerViews = (() => {
    if (!groups) return null;
    const scrollBottom = scrollTop + height;
    const views: ReactNode[] = [];
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;
      const next = i + 1 < groups.length ? groups[i + 1] : undefined;
      const groupTop = offsetAt(prefix, items.length, group.startIndex);
      const groupBottom = next
        ? offsetAt(prefix, items.length, next.startIndex)
        : totalHeight;
      if (groupBottom <= scrollTop || groupTop >= scrollBottom) continue;
      const headerHeight =
        headerHeightsRef.current.get(group.key) ?? estimate;
      const top = Math.max(groupTop, Math.min(scrollTop, groupBottom - headerHeight));
      views.push(
        <div
          key={group.key}
          data-group-key={group.key}
          x-class={[groupHeader]}
          style={{ top }}
        >
          {group.render()}
        </div>,
      );
    }
    return views;
  })();

  const scrollToIndex = useCallback(
    (index: number, align: VirtualListAlign = 'auto') => {
      const el = containerRef.current;
      if (!el || items.length === 0) return;
      const target = Math.max(0, Math.min(items.length - 1, Math.floor(index)));
      const top = prefix[target] ?? 0;
      const rowHeight = isDynamic
        ? rowHeightsRef.current.get(target) ?? estimate
        : itemHeight;
      const viewportHeight = el.clientHeight || height;
      const scrollFor = (a: 'start' | 'center' | 'end'): number => {
        if (a === 'start') return top;
        if (a === 'end') return top + rowHeight - viewportHeight;
        return top + rowHeight / 2 - viewportHeight / 2;
      };
      let next: number;
      if (align === 'auto') {
        const current = el.scrollTop;
        if (top >= current && top + rowHeight <= current + viewportHeight) {
          return; // already fully visible
        }
        next = scrollFor(top < current ? 'end' : 'start');
      } else {
        next = scrollFor(align);
      }
      el.scrollTop = Math.max(0, Math.min(next, el.scrollHeight - viewportHeight));
      // Programmatic scrollTop does not fire a synchronous scroll event —
      // sync the internal offset directly.
      setScrollTop(el.scrollTop);
    },
    [prefix, items.length, isDynamic, estimate, itemHeight, height],
  );

  // Imperative surface: `ref.current?.scrollToIndex(index, align)`.
  useImperativeHandle(ref, () => ({ scrollToIndex }), [scrollToIndex]);

  return (
    <div
      ref={containerRef}
      x-class={[container, className]}
      style={{ height, ...style }}
      {...rest}
    >
      <div x-class={[viewport]} style={{ height: totalHeight }}>
        {items.slice(startIndex, endIndex).map((item, i) => {
          const index = startIndex + i;
          const rowStyle: CSSProperties = {
            position: 'absolute',
            top: prefix[index],
            width: '100%',
          };
          if (isDynamic) {
            const measured = rowHeightsRef.current.get(index);
            if (measured !== undefined) rowStyle.height = measured;
          } else {
            rowStyle.height = itemHeight;
          }
          return (
            <div key={index} data-index={index} style={rowStyle}>
              {renderItem(item, index)}
            </div>
          );
        })}
        {headerViews}
      </div>
    </div>
  );
}

export type {
  VirtualListProps,
  VirtualListHandle,
  VirtualListGroup,
  VirtualListAlign,
};
