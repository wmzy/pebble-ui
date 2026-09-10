import type { MockInstance } from 'vitest';

import type { VirtualListHandle } from './VirtualList';

import { createRef } from 'react';
import { render, screen, act } from '@testing-library/react';

import VirtualList from './VirtualList';


// jsdom 30 has no ResizeObserver and no layout (getBoundingClientRect is
// all zeros), so both are mocked: the observer records targets and fires
// synchronously on observe (matching the spec's initial notification),
// while the rect mock derives heights from the row/header data attributes.
type ObserveCallback = (entries: ResizeObserverEntry[]) => void;

const observers: MockResizeObserver[] = [];

class MockResizeObserver {
  observed = new Set<Element>();

  constructor(private callback: ObserveCallback) {
    observers.push(this);
  }

  /** Deliver a (fake) resize notification for `target`. */
  report(target: Element) {
    this.callback([{ target } as ResizeObserverEntry]);
  }

  observe(target: Element) {
    if (this.observed.has(target)) return;
    this.observed.add(target);
    this.report(target);
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }

  disconnect() {
    this.observed.clear();
  }
}

/** Observer that never reports — used to test the unmeasured fallback. */
class SilentResizeObserver {
  observe() {
    /* silent by design: no measurement ever fires */
  }
  unobserve() {
    /* silent by design */
  }
  disconnect() {
    /* silent by design */
  }
}

let rowHeightFor: (index: number) => number = () => 40;
let headerHeightFor: (key: string) => number = () => 20;
let rectSpy: MockInstance;

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  rectSpy = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const { index, groupKey } = this.dataset;
      if (index !== undefined) {
        return { height: rowHeightFor(Number(index)) } as DOMRect;
      }
      if (groupKey !== undefined) {
        return { height: headerHeightFor(groupKey) } as DOMRect;
      }
      return { height: 0 } as DOMRect;
    });
});

afterEach(() => {
  rectSpy.mockRestore();
  vi.unstubAllGlobals();
  rowHeightFor = () => 40;
  headerHeightFor = () => 20;
});

/** The scroll container (root element). */
function getScrollport(container: HTMLElement) {
  return container.firstChild as HTMLElement;
}

/** The inner spacer whose height is the total (virtualized) list height. */
function getViewport(container: HTMLElement) {
  return (container.firstChild as HTMLElement).firstChild as HTMLElement;
}

function scrollToList(el: HTMLElement, scrollTop: number) {
  act(() => {
    el.scrollTop = scrollTop;
    el.dispatchEvent(new Event('scroll'));
  });
}

function rowIndexes(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('[data-index]')].map(
    (el) => Number(el.dataset.index),
  );
}

/** Fire a resize notification for an element through every observing mock. */
function fireResize(el: Element) {
  act(() => {
    for (const observer of observers) {
      if (observer.observed.has(el)) observer.report(el);
    }
  });
}

describe('VirtualList', () => {
  const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
  const renderItem = (item: string) => <div>{item}</div>;

  it('renders visible items', () => {
    render(
      <VirtualList
        items={items}
        height={200}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(
      <VirtualList
        items={items}
        height={200}
        itemHeight={40}
        renderItem={renderItem}
        className="custom"
      />,
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders empty list', () => {
    const { container } = render(
      <VirtualList
        items={[]}
        height={200}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
  });

  it('applies container height', () => {
    const { container } = render(
      <VirtualList
        items={items}
        height={300}
        itemHeight={40}
        renderItem={renderItem}
      />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe('300px');
  });

  it('renders exactly the fixed-height window without overscan', () => {
    const { container } = render(
      <VirtualList
        items={items}
        height={200}
        itemHeight={40}
        overscan={0}
        renderItem={renderItem}
      />,
    );
    const port = getScrollport(container);
    expect(rowIndexes(container)).toEqual([0, 1, 2, 3, 4]);

    scrollToList(port, 400);
    expect(rowIndexes(container)).toEqual([10, 11, 12, 13, 14]);
  });

  it('extends the window by overscan on both boundaries', () => {
    const { container } = render(
      <VirtualList
        items={items}
        height={200}
        itemHeight={40}
        overscan={2}
        renderItem={renderItem}
      />,
    );
    const port = getScrollport(container);
    // Core window 0–4 expanded by 2 on each side, clamped at 0.
    expect(rowIndexes(container)).toEqual([0, 1, 2, 3, 4, 5, 6]);

    // Core window 10–14 expanded by 2 on each side.
    scrollToList(port, 400);
    expect(rowIndexes(container)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('positions fixed rows at index * itemHeight', () => {
    const { container } = render(
      <VirtualList
        items={items}
        height={200}
        itemHeight={40}
        overscan={0}
        renderItem={renderItem}
      />,
    );
    const port = getScrollport(container);
    scrollToList(port, 400);
    const row = port.querySelector<HTMLElement>('[data-index="10"]');
    expect(row).not.toBeNull();
    expect(row!.style.top).toBe('400px');
    expect(row!.style.height).toBe('40px');
    expect(getViewport(container).style.height).toBe('4000px');
  });

  it('forwards native props to the scroll container', () => {
    render(
      <VirtualList
        items={items}
        height={200}
        itemHeight={40}
        renderItem={renderItem}
        data-testid="scrollport"
        aria-label="Long list"
      />,
    );
    expect(screen.getByRole('generic', { name: 'Long list' })).toHaveAttribute(
      'data-testid',
      'scrollport',
    );
  });

  describe('dynamic heights', () => {
    const dynamicItems = Array.from({ length: 10 }, (_, i) => `D${i}`);
    // 30 / 60 / 90 cycling — prefix: 0,30,90,180,210,270,300,390,450,540,570.
    const cycling = (i: number) => 30 + (i % 3) * 30;

    it('falls back to estimatedItemHeight before measurement', () => {
      vi.stubGlobal('ResizeObserver', SilentResizeObserver);
      const { container } = render(
        <VirtualList
          items={dynamicItems}
          height={200}
          itemHeight={40}
          estimatedItemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      expect(getViewport(container).style.height).toBe('400px');
      const row = getViewport(container).querySelector<HTMLElement>(
        '[data-index="0"]',
      );
      expect(row!.style.height).toBe('');
    });

    it('measures rows via ResizeObserver and lays out by prefix sums', () => {
      rowHeightFor = cycling;
      // Default overscan (5) mounts all 10 rows, so every row gets measured.
      const { container } = render(
        <VirtualList
          items={dynamicItems}
          height={200}
          itemHeight={40}
          estimatedItemHeight={40}
          renderItem={renderItem}
        />,
      );
      // 4×30 + 3×60 + 3×90 = 570.
      expect(getViewport(container).style.height).toBe('570px');

      const viewport = getViewport(container);
      const row1 = viewport.querySelector<HTMLElement>('[data-index="1"]');
      expect(row1!.style.height).toBe('60px');
      const row3 = viewport.querySelector<HTMLElement>('[data-index="3"]');
      expect(row3!.style.top).toBe('180px');
    });

    it('updates layout when a measured row resizes', () => {
      rowHeightFor = (i) => (i === 0 ? 30 : 40);
      const { container } = render(
        <VirtualList
          items={dynamicItems}
          height={200}
          itemHeight={40}
          estimatedItemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      expect(getViewport(container).style.height).toBe('390px');

      rowHeightFor = (i) => (i === 0 ? 100 : 40);
      const row0 = getViewport(container).querySelector<HTMLElement>(
        '[data-index="0"]',
      );
      fireResize(row0!);
      expect(getViewport(container).style.height).toBe('460px');
      expect(row0!.style.height).toBe('100px');
    });

    it('keeps measurements by index and truncates when items shrink', () => {
      rowHeightFor = cycling;
      const { container, rerender } = render(
        <VirtualList
          items={dynamicItems}
          height={200}
          itemHeight={40}
          estimatedItemHeight={40}
          renderItem={renderItem}
        />,
      );
      expect(getViewport(container).style.height).toBe('570px');

      // Retained per-index measurements: 30+60+90+30+60 = 270, not 5×40.
      rerender(
        <VirtualList
          items={dynamicItems.slice(0, 5)}
          height={200}
          itemHeight={40}
          estimatedItemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      expect(getViewport(container).style.height).toBe('270px');
    });
  });

  describe('scrollToIndex', () => {
    function setupScrollHeight(port: HTMLElement, value: number) {
      Object.defineProperty(port, 'scrollHeight', {
        value,
        configurable: true,
      });
    }

    it('aligns to start, center, and end in fixed mode', () => {
      const ref = createRef<VirtualListHandle>();
      const { container } = render(
        <VirtualList
          ref={ref}
          items={items}
          height={200}
          itemHeight={40}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);
      setupScrollHeight(port, 4000);

      act(() => ref.current!.scrollToIndex(50, 'start'));
      expect(port.scrollTop).toBe(2000);

      act(() => ref.current!.scrollToIndex(50, 'center'));
      expect(port.scrollTop).toBe(1920);

      act(() => ref.current!.scrollToIndex(50, 'end'));
      expect(port.scrollTop).toBe(1840);
    });

    it('auto align no-ops for visible rows and clamps to the scroll range', () => {
      const ref = createRef<VirtualListHandle>();
      const { container } = render(
        <VirtualList
          ref={ref}
          items={items}
          height={200}
          itemHeight={40}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);
      setupScrollHeight(port, 4000);

      // Rows 50–54 fill the viewport at scrollTop 2000: row 51 is visible.
      scrollToList(port, 2000);
      act(() => ref.current!.scrollToIndex(51));
      expect(port.scrollTop).toBe(2000);

      // 99 × 40 = 3960 clamps to max scroll 4000 − 200.
      act(() => ref.current!.scrollToIndex(99, 'start'));
      expect(port.scrollTop).toBe(3800);

      // Row 0 enters from above → 'end' alignment clamps to 0.
      act(() => ref.current!.scrollToIndex(0));
      expect(port.scrollTop).toBe(0);
    });

    it('scrolls by measured prefix sums in dynamic mode', () => {
      rowHeightFor = (i) => 30 + (i % 3) * 30;
      const ref = createRef<VirtualListHandle>();
      const { container } = render(
        <VirtualList
          ref={ref}
          items={Array.from({ length: 10 }, (_, i) => `D${i}`)}
          height={200}
          itemHeight={40}
          estimatedItemHeight={40}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);
      setupScrollHeight(port, 570);

      // prefix[5] = 30 + 60 + 90 + 30 + 60 = 270.
      act(() => ref.current!.scrollToIndex(5, 'start'));
      expect(port.scrollTop).toBe(270);
    });
  });

  describe('groups', () => {
    const groups = [
      { startIndex: 0, key: 'a', render: () => 'Group A' },
      { startIndex: 10, key: 'b', render: () => 'Group B' },
      { startIndex: 50, key: 'c', render: () => 'Group C' },
    ];

    function headerOf(container: HTMLElement, key: string) {
      return container.querySelector<HTMLElement>(
        `[data-group-key="${key}"]`,
      );
    }

    it('pins headers to the viewport top while their group is in view', () => {
      const { container } = render(
        <VirtualList
          items={items}
          height={200}
          itemHeight={40}
          groups={groups}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);

      // At the top: only group A's header, at its natural offset 0.
      expect(headerOf(container, 'a')!.style.top).toBe('0px');
      expect(headerOf(container, 'b')).toBeNull();
      expect(screen.getByText('Group A')).toBeInTheDocument();

      // Group B (400–2000) pinned at the viewport top; A fully scrolled past.
      scrollToList(port, 460);
      expect(headerOf(container, 'a')).toBeNull();
      expect(headerOf(container, 'b')!.style.top).toBe('460px');

      // Group C starts at 2000: B releases to its group end (2000 − 20).
      scrollToList(port, 1990);
      expect(headerOf(container, 'b')!.style.top).toBe('1980px');
      expect(headerOf(container, 'c')!.style.top).toBe('2000px');
    });

    it('computes group offsets from measured prefix sums in dynamic mode', () => {
      rowHeightFor = (i) => 30 + (i % 3) * 30;
      const { container } = render(
        <VirtualList
          items={Array.from({ length: 10 }, (_, i) => `D${i}`)}
          height={300}
          itemHeight={40}
          estimatedItemHeight={40}
          groups={[{ startIndex: 3, key: 'x', render: () => 'Group X' }]}
          renderItem={renderItem}
        />,
      );
      // prefix[3] = 30 + 60 + 90 = 180.
      expect(headerOf(container, 'x')!.style.top).toBe('180px');
    });

    it('re-measures header heights when they resize', () => {
      const { container } = render(
        <VirtualList
          items={items}
          height={200}
          itemHeight={40}
          groups={groups}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);

      // Header B grows to 80: pinned at 460 it still releases at 2000 − 80.
      headerHeightFor = (key) => (key === 'b' ? 80 : 20);
      scrollToList(port, 400);
      const headerB = headerOf(container, 'b')!;
      fireResize(headerB);
      expect(headerB.style.top).toBe('400px');

      scrollToList(port, 1990);
      expect(headerOf(container, 'b')!.style.top).toBe('1920px');
    });
  });

  describe('reverse', () => {
    // The stick-to-bottom glue reads scrollHeight during the mount
    // effect, before the element is reachable — so the metric is mocked
    // on the prototype (configurable per test via mockReturnValue).
    let scrollHeightSpy: MockInstance;

    beforeEach(() => {
      // jsdom owns scrollHeight's getter on Element.prototype.
      scrollHeightSpy = vi
        .spyOn(Element.prototype, 'scrollHeight', 'get')
        .mockReturnValue(4000);
    });

    afterEach(() => {
      scrollHeightSpy.mockRestore();
    });

    it('parks at the bottom on mount and anchors index 0 there', () => {
      const { container } = render(
        <VirtualList
          reverse
          items={items}
          height={200}
          itemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);
      // maxScroll = 4000 − 200; the newest rows (0–4) fill the window.
      expect(port.scrollTop).toBe(3800);
      expect(rowIndexes(container)).toEqual([0, 1, 2, 3, 4]);

      const row0 = getViewport(container).querySelector<HTMLElement>(
        '[data-index="0"]',
      );
      expect(row0!.style.bottom).toBe('0px');
      expect(row0!.style.top).toBe('');
      expect(getViewport(container).style.height).toBe('4000px');
    });

    it('measures the visible window from the bottom edge', () => {
      const { container } = render(
        <VirtualList
          reverse
          items={items}
          height={200}
          itemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);
      // Bottom-distance 400 ⇔ top-origin scrollTop 3800 − 400 = 3400.
      scrollToList(port, 3400);
      expect(rowIndexes(container)).toEqual([10, 11, 12, 13, 14]);

      const row10 = getViewport(container).querySelector<HTMLElement>(
        '[data-index="10"]',
      );
      expect(row10!.style.bottom).toBe('400px');
    });

    it('mirrors scrollToIndex alignments (index 0 at the bottom)', () => {
      const ref = createRef<VirtualListHandle>();
      const { container } = render(
        <VirtualList
          ref={ref}
          reverse
          items={items}
          height={200}
          itemHeight={40}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);

      // R = 2000 → S = 3800 − 2000.
      act(() => ref.current!.scrollToIndex(50, 'start'));
      expect(port.scrollTop).toBe(1800);

      act(() => ref.current!.scrollToIndex(50, 'center'));
      expect(port.scrollTop).toBe(1880);

      act(() => ref.current!.scrollToIndex(50, 'end'));
      expect(port.scrollTop).toBe(1960);

      // Index 0 pins to the viewport bottom: glued to the newest row.
      act(() => ref.current!.scrollToIndex(0, 'start'));
      expect(port.scrollTop).toBe(3800);

      // Row 99's bottom-space (3960) exceeds maxScroll — clamped, which
      // in mirror space is the top edge of the list.
      act(() => ref.current!.scrollToIndex(99, 'start'));
      expect(port.scrollTop).toBe(0);
    });

    it('auto alignment no-ops for rows already visible', () => {
      const ref = createRef<VirtualListHandle>();
      const { container } = render(
        <VirtualList
          ref={ref}
          reverse
          items={items}
          height={200}
          itemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);
      // Rows 10–14 fill the window at bottom-distance 400.
      scrollToList(port, 3400);
      act(() => ref.current!.scrollToIndex(12));
      expect(port.scrollTop).toBe(3400);
    });

    it('follows prepends while parked at the bottom', () => {
      scrollHeightSpy.mockReturnValue(4000);
      const { container, rerender } = render(
        <VirtualList
          reverse
          items={items}
          height={200}
          itemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);
      expect(port.scrollTop).toBe(3800);

      // A new newest message grows the content upward from the bottom.
      scrollHeightSpy.mockReturnValue(4040);
      rerender(
        <VirtualList
          reverse
          items={['Item new', ...items]}
          height={200}
          itemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      expect(port.scrollTop).toBe(3840);
      // The prepended item occupies the bottom slot.
      expect(rowIndexes(container)).toEqual([0, 1, 2, 3, 4]);
      expect(screen.getByText('Item new')).toBeInTheDocument();
    });

    it('keeps the reading position when content grows while scrolled up', () => {
      scrollHeightSpy.mockReturnValue(4000);
      const { container, rerender } = render(
        <VirtualList
          reverse
          items={items}
          height={200}
          itemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);
      // Scroll up: bottom-distance 1400 parks the follow.
      scrollToList(port, 2400);

      scrollHeightSpy.mockReturnValue(4040);
      rerender(
        <VirtualList
          reverse
          items={['Item new', ...items]}
          height={200}
          itemHeight={40}
          overscan={0}
          renderItem={renderItem}
        />,
      );
      expect(port.scrollTop).toBe(2400);
    });

    it('pins group headers to the viewport bottom edge', () => {
      const groups = [
        { startIndex: 0, key: 'a', render: () => 'Group A' },
        { startIndex: 10, key: 'b', render: () => 'Group B' },
      ];
      const { container } = render(
        <VirtualList
          reverse
          items={items}
          height={200}
          itemHeight={40}
          groups={groups}
          renderItem={renderItem}
        />,
      );
      const port = getScrollport(container);

      // Glued at the bottom: group A's header at its natural offset 0.
      const headerA = container.querySelector<HTMLElement>(
        '[data-group-key="a"]',
      );
      expect(headerA!.style.bottom).toBe('0px');

      // Bottom-distance 460: group B (400–2000 bottom-space) pins to the
      // viewport bottom edge at 460; A is fully scrolled past (above it).
      scrollToList(port, 3800 - 460);
      expect(container.querySelector('[data-group-key="a"]')).toBeNull();
      const headerB = container.querySelector<HTMLElement>(
        '[data-group-key="b"]',
      );
      expect(headerB!.style.bottom).toBe('460px');
    });
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <>
        <VirtualList
          items={items}
          height={200}
          itemHeight={40}
          renderItem={renderItem}
        />
        <VirtualList
          reverse
          items={items.slice(0, 10)}
          height={200}
          itemHeight={40}
          renderItem={renderItem}
        />
        <VirtualList
          items={items.slice(0, 10)}
          height={200}
          itemHeight={40}
          estimatedItemHeight={40}
          groups={[
            { startIndex: 0, key: 'a', render: () => <h4>Group A</h4> },
            { startIndex: 5, key: 'b', render: () => <h4>Group B</h4> },
          ]}
          renderItem={renderItem}
        />
      </>,
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
