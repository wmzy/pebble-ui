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

import { getDirection } from '../../utils/direction';

/** Orientation of the scroll axis. */
type VirtualListOrientation = 'vertical' | 'horizontal';

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
   *
   * In grid mode (`columns > 1`) `index` is the item index and maps to
   * its row/column cell: the row axis honors `align`, the column axis is
   * brought into view minimally. In horizontal orientation the same
   * semantics apply along the x axis.
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
  /**
   * Scrollport height in px (the cross-axis size when
   * `orientation='horizontal'`).
   */
  height: number;
  /**
   * Scrollport width in px — only used with `orientation='horizontal'`:
   * fixes the port width and serves as the main-axis extent until the
   * real `clientWidth` is measured. Ignored in vertical orientation.
   */
  width?: number;
  /**
   * Extent of one item along the scroll axis: row height in vertical
   * lists, item width with `orientation='horizontal'`, and row height in
   * grid mode. Exact in fixed mode; in dynamic mode only the
   * pre-measurement estimate (pass `estimatedItemHeight` to opt in).
   */
  itemHeight: number;
  /**
   * Provide to enable dynamic heights along the scroll axis: every
   * mounted unit (row — in grid mode the whole row wrapper) is measured
   * with a ResizeObserver and cached by index. Unit offsets come from a
   * prefix sum over measured sizes (never-rendered units fall back to
   * this estimate), so layout stays correct as units resize. Cached
   * sizes survive `items` updates and are truncated when the list
   * shrinks.
   */
  estimatedItemHeight?: number;
  /**
   * Grid mode: lay items out in a row-major grid with this many columns
   * and virtualize both axes — rows are windowed along the scroll axis
   * exactly like a vertical list, columns are windowed against the
   * rendered `clientWidth`. Item `index` maps to row
   * `Math.floor(index / columns)`, column `index % columns`. Only
   * supported in the (default) vertical orientation; combining it with
   * `orientation='horizontal'` logs a dev error and renders a plain
   * horizontal list.
   */
  columns?: number;
  /**
   * Column width in px (grid mode only); defaults to `itemHeight`.
   * Columns are not dynamically measured.
   */
  columnWidth?: number;
  /**
   * Scroll axis of the list. `'vertical'` (default) keeps the existing
   * behavior byte-for-byte. `'horizontal'` mirrors the whole windowing
   * system — prefix sums, dynamic measurement, `scrollToIndex`, reverse
   * and sticky group headers — onto the x axis: items are sized by
   * `itemHeight` along it, headers pin to the inline-start edge, and
   * offsets stay *logical* so RTL keeps item 0 at the inline-start edge
   * (the physical right edge): RTL `scrollLeft` reads 0 at the start and
   * goes negative toward the end, which the internal offset scale
   * normalizes.
   */
  orientation?: VirtualListOrientation;
  /**
   * Optional sticky group headers. A header pins to the scrollport's
   * inline-start (vertical: top) while its group spans the viewport and
   * slides away when the next header reaches it. Header positions derive
   * from the same offset system as rows, so fixed and dynamic modes are
   * both supported; in grid mode a header aligns with the row containing
   * its first item (row granularity). Headers overlay rows — they occupy
   * no layout space in the list.
   */
  groups?: VirtualListGroup[];
  renderItem: (item: T, index: number) => ReactNode;
  /**
   * Extra units kept mounted on either side of the visible window —
   * rows along the scroll axis, and columns in grid mode.
   */
  overscan?: number;
  /**
   * Chat orientation (opt-in): units anchor to the scrollport's end edge
   * (vertical: bottom; horizontal: inline-end) with index 0 at that edge
   * and later indices stacking toward the start — the natural geometry
   * for a newest-at-the-edge log where new items are prepended. The
   * viewport parks at the end on mount and stays glued there across
   * appends while the user is parked there; a reader who scrolled back
   * keeps their position (units keep their start-origin coordinates as
   * content grows toward the start, so nothing jumps).
   *
   * `scrollToIndex` keeps its signature; alignments mirror along the
   * scroll axis — `'start'` pins the unit's end edge to the viewport's
   * end edge, `'end'` its start edge to the viewport's start edge. The
   * `VirtualListHandle` API is unchanged.
   */
  reverse?: boolean;
  className?: string;
  ref?: Ref<VirtualListHandle>;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const container = css`
  overflow-y: auto;
  font-family: var(--haze-font-sans);
`;

const containerHorizontal = css`
  overflow-x: auto;
  overflow-y: hidden;
  font-family: var(--haze-font-sans);
`;

const viewport = css`
  position: relative;
  width: 100%;
`;

const viewportHorizontal = css`
  position: relative;
  height: 100%;
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

const groupHeaderHorizontal = css`
  position: absolute;
  inset-block: 0;
  z-index: 1;
  box-sizing: border-box;
  background: var(--haze-color-bg);
  border-inline-end: 1px solid var(--haze-color-border);
  padding: var(--haze-space-2) var(--haze-space-1);
`;

/** First unit whose end edge lies strictly beyond `offset`. */
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

/** First unit whose start edge lies at or beyond `offset`. */
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

/** Start offset of `index`, clamped into the list range. */
function offsetAt(prefix: Float64Array, length: number, index: number): number {
  return prefix[Math.max(0, Math.min(length, index))] ?? 0;
}

/**
 * Logical scroll offset along an axis: the distance scrolled from the
 * start edge (vertical: top; horizontal: inline-start). Horizontal RTL
 * reads `scrollLeft` negated — every evergreen engine reports RTL
 * `scrollLeft` as 0 at the start edge going negative toward the end
 * (CSSOM View), and the negation maps it onto the same
 * "distance from start" scale as LTR.
 */
function readScrollOffset(el: HTMLElement, axis: 'x' | 'y'): number {
  if (axis === 'y') return el.scrollTop;
  return getDirection(el) === 'rtl' ? -el.scrollLeft : el.scrollLeft;
}

/** Write a logical scroll offset, converting RTL horizontal negation. */
function writeScrollOffset(
  el: HTMLElement,
  axis: 'x' | 'y',
  offset: number,
): void {
  if (axis === 'y') {
    el.scrollTop = offset;
    return;
  }
  el.scrollLeft = getDirection(el) === 'rtl' ? -offset : offset;
}

type PrefixCache = {
  items: unknown[];
  version: number;
  itemHeight: number;
  estimated: number | undefined;
  dynamic: boolean;
  /** Unit count (rows in grid mode, items otherwise). */
  units: number;
  sums: Float64Array;
};

export default function VirtualList<T>({
  items,
  height,
  width,
  itemHeight,
  estimatedItemHeight,
  columns,
  columnWidth,
  orientation = 'vertical',
  groups,
  renderItem,
  overscan = 5,
  reverse = false,
  className,
  style,
  ref,
  ...rest
}: VirtualListProps<T>) {
  const horizontal = orientation === 'horizontal';
  // Grid mode is vertical-only; horizontal wins over `columns` (dev error).
  // TS narrows `columns` through the const boolean alias below.
  const isGrid = !horizontal && columns !== undefined && columns > 1;
  const gridColumns = isGrid ? columns : 1;
  const cellWidth = columnWidth ?? itemHeight;

  useEffect(() => {
    if (horizontal && columns !== undefined && columns > 1) {
      console.error(
        "VirtualList: `columns` requires orientation='vertical' (the default); the horizontal list ignores it.",
      );
    }
  }, [horizontal, columns]);

  const isDynamic = estimatedItemHeight !== undefined;
  const hasGroups = groups !== undefined && groups.length > 0;
  // Estimate for not-yet-measured dynamic units (and unmeasured headers).
  const estimate = estimatedItemHeight ?? itemHeight;
  // Main-axis units: rows in grid mode, items otherwise.
  const unitCount = isGrid
    ? Math.ceil(items.length / gridColumns)
    : items.length;

  const [scrollMain, setScrollMain] = useState(0);
  // Grid mode: logical horizontal offset driving the column window.
  const [scrollCross, setScrollCross] = useState(0);
  /**
   * Rendered scrollport `clientWidth`, measured on mount (0 until then).
   * Horizontal mode uses it as the main-axis window extent; grid mode as
   * the column-window extent. 0 degrades safely — the horizontal window
   * keeps `overscan` units mounted and grid mode renders every column.
   */
  const [portWidth, setPortWidth] = useState(0);
  const [measureVersion, setMeasureVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  /** Reverse mode: whether the scrollport is parked at its end edge. */
  const atEndRef = useRef(true);
  const rowHeightsRef = useRef(new Map<number, number>());
  const headerHeightsRef = useRef(new Map<string, number>());
  const observerRef = useRef<ResizeObserver | null>(null);
  const prefixCacheRef = useRef<PrefixCache | null>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollMain(readScrollOffset(el, horizontal ? 'x' : 'y'));
    if (reverse) {
      if (horizontal) {
        const extent = el.clientWidth || width || 0;
        atEndRef.current =
          el.scrollWidth - readScrollOffset(el, 'x') - extent <= 1;
      } else {
        const viewport = el.clientHeight || height;
        atEndRef.current = el.scrollHeight - el.scrollTop - viewport <= 1;
      }
    }
    if (isGrid) setScrollCross(readScrollOffset(el, 'x'));
  }, [horizontal, reverse, height, width, isGrid]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reverse mode stick-to-end: park at the end edge on mount and follow
  // appends while the user is parked there. A scrolled-back reader keeps
  // their offset — units keep their start-origin coordinates as content
  // grows toward the start, so no compensation is needed. Runs on
  // measurement changes too: content growing while parked re-glues.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !reverse) return;
    if (!atEndRef.current) return;
    if (horizontal) {
      const extent = el.clientWidth || width || 0;
      writeScrollOffset(el, 'x', Math.max(0, el.scrollWidth - extent));
    } else {
      const viewport = el.clientHeight || height;
      el.scrollTop = Math.max(0, el.scrollHeight - viewport);
    }
    // Programmatic scrolling does not fire a synchronous scroll event —
    // sync the internal offset directly.
    setScrollMain(readScrollOffset(el, horizontal ? 'x' : 'y'));
  }, [reverse, horizontal, width, items, measureVersion, height]);

  // Horizontal and grid modes window along the x axis, whose extent is the
  // rendered clientWidth (vertical/grid ports have no width prop). Tracked
  // with a ResizeObserver so container resizes re-window.
  useEffect(() => {
    if (!horizontal && !isGrid) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => setPortWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => update());
    observer.observe(el);
    return () => observer.disconnect();
  }, [horizontal, isGrid]);

  // Prefix sums: sums[i] is the start offset of unit i, sums[unitCount] the
  // total extent. Recomputed only when items, layout mode, heights config,
  // or a cached measurement changes (measureVersion).
  const prefix = (() => {
    const cache = prefixCacheRef.current;
    if (
      cache?.items === items &&
      cache.version === measureVersion &&
      cache.itemHeight === itemHeight &&
      cache.estimated === estimatedItemHeight &&
      cache.dynamic === isDynamic &&
      cache.units === unitCount
    ) {
      return cache.sums;
    }
    const sums = new Float64Array(unitCount + 1);
    for (let i = 0; i < unitCount; i++) {
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
      units: unitCount,
      sums,
    };
    return sums;
  })();

  const totalMain = prefix[unitCount] ?? 0;
  // Main-axis extent: the height prop in vertical/grid modes; the measured
  // port width (with the width prop as pre-measurement fallback) in
  // horizontal mode.
  const mainExtent = horizontal ? portWidth || width || 0 : height;
  // Window anchor in the same coordinate system as `prefix`: distance from
  // the content start in normal mode, distance from the content end in
  // reverse mode (units stack toward the start from the end anchor, index
  // 0 at the end edge). `Math.max` absorbs overshooting glues from
  // subpixel scroll extents.
  const windowOffset = reverse
    ? Math.max(0, totalMain - mainExtent - scrollMain)
    : scrollMain;
  const startIndex = Math.max(
    0,
    findStartIndex(prefix, unitCount, windowOffset) - overscan,
  );
  const endIndex = Math.min(
    unitCount,
    findEndIndex(prefix, unitCount, windowOffset + mainExtent) + overscan,
  );

  // Grid column window (cross axis). Without a measured port width the
  // column axis is not windowed — every column renders.
  const totalCross = gridColumns * cellWidth;
  const colStartIndex = isGrid
    ? Math.max(0, Math.floor(scrollCross / cellWidth) - overscan)
    : 0;
  const colEndIndex = isGrid
    ? portWidth > 0
      ? Math.min(
          gridColumns,
          Math.ceil((scrollCross + portWidth) / cellWidth) + overscan,
        )
      : gridColumns
    : 0;

  // Drop cached unit heights past the end when the list shrinks; indices
  // keep their measurements across items updates otherwise.
  useEffect(() => {
    const heights = rowHeightsRef.current;
    for (const index of heights.keys()) {
      if (index >= unitCount) heights.delete(index);
    }
  }, [unitCount]);

  // Drop header measurements for groups that are no longer present.
  useEffect(() => {
    if (!groups) return;
    const heights = headerHeightsRef.current;
    const keys = new Set(groups.map((group) => group.key));
    for (const key of heights.keys()) {
      if (!keys.has(key)) heights.delete(key);
    }
  }, [groups]);

  // One observer measures every mounted unit (`data-index`) and group
  // header (`data-group-key`); any measurement differing from the cache
  // re-renders. Runs before the observe effect below so the observer
  // exists when units are queried on the first commit.
  useEffect(() => {
    if (!isDynamic && !hasGroups) return;
    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const { index, groupKey } = target.dataset;
        // Main-axis size: height vertically, width horizontally.
        const rect = target.getBoundingClientRect();
        const measured = horizontal ? rect.width : rect.height;
        if (index !== undefined) {
          const unitIndex = Number(index);
          if (rowHeightsRef.current.get(unitIndex) !== measured) {
            rowHeightsRef.current.set(unitIndex, measured);
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
  }, [isDynamic, hasGroups, horizontal]);

  // Observe whatever units/headers are currently mounted. `observe()` on an
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

  // Sticky group headers: pin to the scrollport's inline-start edge while
  // the group spans the viewport, release (slide away) when the next header
  // pushes past the group's end. All in the same prefix-sum system as the
  // units.
  const headerViews = (() => {
    if (!groups) return null;
    const viewFar = windowOffset + mainExtent;
    const views: ReactNode[] = [];
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;
      const next = i + 1 < groups.length ? groups[i + 1] : undefined;
      // Grid mode maps item indices onto rows at row granularity.
      const unitOf = (itemIndex: number) =>
        isGrid ? Math.floor(itemIndex / gridColumns) : itemIndex;
      const groupTop = offsetAt(prefix, unitCount, unitOf(group.startIndex));
      const groupBottom = next
        ? offsetAt(prefix, unitCount, unitOf(next.startIndex))
        : totalMain;
      if (groupBottom <= windowOffset || groupTop >= viewFar) continue;
      const headerSize = headerHeightsRef.current.get(group.key) ?? estimate;
      const anchor = Math.max(
        groupTop,
        Math.min(windowOffset, groupBottom - headerSize),
      );
      // Anchor along the scroll axis, mirrored to the end edge in reverse
      // mode; the sticky axis is expressed in logical properties so RTL
      // resolves inline-start/inline-end by itself.
      const anchorStyle: CSSProperties = horizontal
        ? reverse
          ? { insetInlineEnd: anchor }
          : { insetInlineStart: anchor }
        : reverse
          ? { bottom: anchor }
          : { top: anchor };
      views.push(
        <div
          key={group.key}
          data-group-key={group.key}
          x-class={[horizontal ? groupHeaderHorizontal : groupHeader]}
          style={anchorStyle}
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
      // Grid mode: the imperative index is an item index; its row drives
      // the main axis (the column axis is brought into view minimally
      // below).
      const unit = isGrid
        ? Math.min(unitCount - 1, Math.floor(target / gridColumns))
        : target;
      const start = prefix[unit] ?? 0;
      const unitSize = isDynamic
        ? rowHeightsRef.current.get(unit) ?? estimate
        : itemHeight;
      const axis = horizontal ? 'x' : 'y';
      const extent = horizontal
        ? el.clientWidth || width || 0
        : el.clientHeight || height;
      const maxScroll = Math.max(
        0,
        (horizontal ? el.scrollWidth : el.scrollHeight) - extent,
      );
      const scrollFor = (a: 'start' | 'center' | 'end'): number => {
        if (a === 'start') return start;
        if (a === 'end') return start + unitSize - extent;
        return start + unitSize / 2 - extent / 2;
      };
      const applyScroll = (offset: number) => {
        writeScrollOffset(el, axis, Math.max(0, Math.min(offset, maxScroll)));
        // Programmatic scrolling does not fire a synchronous scroll
        // event — sync the internal offset directly (read back: engines
        // clamp to the scroll range).
        setScrollMain(readScrollOffset(el, axis));
      };
      // Desired main-axis offset; `null` means the unit is already fully
      // visible and the axis must not move (an early `return` would skip
      // the grid column-axis handling below).
      let mainOffset: number | null;
      if (reverse) {
        // Mirror space: `start` is the unit's distance from the content
        // end edge and the free variable is the viewport's distance from
        // that edge (0 = glued). Convert back to start-origin offset
        // with L = maxScroll − R.
        const current = Math.max(0, maxScroll - readScrollOffset(el, axis));
        if (
          align === 'auto' &&
          start >= current &&
          start + unitSize <= current + extent
        ) {
          mainOffset = null; // already fully visible
        } else {
          const a =
            align === 'auto' ? (start < current ? 'end' : 'start') : align;
          mainOffset = maxScroll - scrollFor(a);
        }
      } else {
        const current = readScrollOffset(el, axis);
        if (
          align === 'auto' &&
          start >= current &&
          start + unitSize <= current + extent
        ) {
          mainOffset = null; // already fully visible
        } else {
          const a =
            align === 'auto' ? (start < current ? 'end' : 'start') : align;
          mainOffset = scrollFor(a);
        }
      }
      if (mainOffset !== null) applyScroll(mainOffset);
      // Grid column axis: minimal bring-into-view (no alignment).
      if (isGrid) {
        const column = target % gridColumns;
        const colStart = column * cellWidth;
        const crossExtent = el.clientWidth || 0;
        if (crossExtent > 0) {
          const current = readScrollOffset(el, 'x');
          let next = current;
          if (colStart < current) next = colStart;
          else if (colStart + cellWidth > current + crossExtent)
            next = colStart + cellWidth - crossExtent;
          if (next !== current) {
            writeScrollOffset(
              el,
              'x',
              Math.max(
                0,
                Math.min(next, Math.max(0, el.scrollWidth - crossExtent)),
              ),
            );
            setScrollCross(readScrollOffset(el, 'x'));
          }
        }
      }
    },
    [
      prefix,
      items.length,
      isDynamic,
      estimate,
      itemHeight,
      height,
      width,
      reverse,
      horizontal,
      isGrid,
      unitCount,
      gridColumns,
      cellWidth,
    ],
  );

  // Imperative surface: `ref.current?.scrollToIndex(index, align)`.
  useImperativeHandle(ref, () => ({ scrollToIndex }), [scrollToIndex]);

  const portStyle: CSSProperties = horizontal
    ? { height, ...(width !== undefined ? { width } : undefined), ...style }
    : { height, ...style };
  const spacerStyle: CSSProperties = horizontal
    ? { width: totalMain }
    : isGrid
      ? { height: totalMain, width: totalCross }
      : { height: totalMain };

  return (
    <div
      ref={containerRef}
      x-class={[horizontal ? containerHorizontal : container, className]}
      style={portStyle}
      {...rest}
    >
      <div
        x-class={[horizontal ? viewportHorizontal : viewport]}
        style={spacerStyle}
      >
        {isGrid
          ? Array.from({ length: endIndex - startIndex }, (_, i) => {
              const row = startIndex + i;
              const rowStyle: CSSProperties = {
                position: 'absolute',
                width: '100%',
              };
              // `prefix` is the row's anchor offset from the content's
              // leading edge: top in normal mode, bottom in reverse.
              if (reverse) rowStyle.bottom = prefix[row];
              else rowStyle.top = prefix[row];
              if (isDynamic) {
                const measured = rowHeightsRef.current.get(row);
                if (measured !== undefined) rowStyle.height = measured;
              } else {
                rowStyle.height = itemHeight;
              }
              const cells: ReactNode[] = [];
              for (let col = colStartIndex; col < colEndIndex; col++) {
                const index = row * gridColumns + col;
                const item = items[index];
                if (item === undefined) break;
                cells.push(
                  <div
                    key={col}
                    data-cell={index}
                    style={{ flex: 'none', width: cellWidth }}
                  >
                    {renderItem(item, index)}
                  </div>,
                );
              }
              return (
                <div key={row} data-index={row} style={rowStyle}>
                  {/* Windowed columns are offset from the row's inline-start
                      edge; the logical margin keeps RTL geometry correct. */}
                  <div
                    style={{
                      display: 'flex',
                      height: '100%',
                      marginInlineStart: colStartIndex * cellWidth,
                    }}
                  >
                    {cells}
                  </div>
                </div>
              );
            })
          : items.slice(startIndex, endIndex).map((item, i) => {
              const index = startIndex + i;
              const unitStyle: CSSProperties = horizontal
                ? { position: 'absolute', height: '100%' }
                : { position: 'absolute', width: '100%' };
              // `prefix` is the unit's anchor offset from the content's
              // leading edge, in logical properties so RTL mirrors by
              // itself.
              if (reverse) {
                if (horizontal) unitStyle.insetInlineEnd = prefix[index];
                else unitStyle.bottom = prefix[index];
              } else if (horizontal) {
                unitStyle.insetInlineStart = prefix[index];
              } else {
                unitStyle.top = prefix[index];
              }
              if (isDynamic) {
                const measured = rowHeightsRef.current.get(index);
                if (measured !== undefined) {
                  if (horizontal) unitStyle.width = measured;
                  else unitStyle.height = measured;
                }
              } else if (horizontal) {
                unitStyle.width = itemHeight;
              } else {
                unitStyle.height = itemHeight;
              }
              return (
                <div key={index} data-index={index} style={unitStyle}>
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
  VirtualListOrientation,
};
