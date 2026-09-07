import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

import { useMediaQuery } from './useMediaQuery';

// jsdom 30 没有 matchMedia——按 useSyncExternalStore 的真实订阅路径
// 完整 stub：matches + add/removeEventListener。setMatches 模拟环境
// 变化，同步派发 change 回调（浏览器行为也是同步派发 listener）。
type MqlEntry = { matches: boolean; listeners: Set<() => void> };

function installMatchMedia() {
  const lists = new Map<string, MqlEntry>();

  const entryOf = (query: string): MqlEntry => {
    const existing = lists.get(query);
    if (existing !== undefined) return existing;
    const created: MqlEntry = { matches: false, listeners: new Set() };
    lists.set(query, created);
    return created;
  };

  // getSnapshot 每次渲染都重新调用 matchMedia，matches 在调用时读取
  // entry 的当前值——与真实 MQL 语义一致。
  const matchMedia = (query: string): MediaQueryList => {
    const entry = entryOf(query);
    return {
      matches: entry.matches,
      media: query,
      onchange: null,
      addEventListener: (type: string, listener: () => void) => {
        if (type === 'change') entry.listeners.add(listener);
      },
      removeEventListener: (type: string, listener: () => void) => {
        if (type === 'change') entry.listeners.delete(listener);
      },
      addListener: (listener: () => void) => entry.listeners.add(listener),
      removeListener: (listener: () => void) => entry.listeners.delete(listener),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };

  window.matchMedia = matchMedia;

  return {
    setMatches(query: string, matches: boolean) {
      const entry = entryOf(query);
      if (entry.matches === matches) return;
      entry.matches = matches;
      for (const listener of [...entry.listeners]) listener();
    },
    listenerCount: (query: string) => entryOf(query).listeners.size,
    uninstall() {
      // jsdom 本没有 matchMedia，删除即恢复原状
      Reflect.deleteProperty(window, 'matchMedia');
    },
  };
}

const QUERY = '(min-width: 600px)';

describe('useMediaQuery', () => {
  it('returns the current match state and re-renders on change events', () => {
    const mq = installMatchMedia();
    try {
      mq.setMatches(QUERY, true);
      const { result } = renderHook(() => useMediaQuery(QUERY));
      expect(result.current).toBe(true);

      act(() => mq.setMatches(QUERY, false));
      expect(result.current).toBe(false);

      act(() => mq.setMatches(QUERY, true));
      expect(result.current).toBe(true);
    } finally {
      mq.uninstall();
    }
  });

  it('defaults to false when the query does not match', () => {
    const mq = installMatchMedia();
    try {
      const { result } = renderHook(() => useMediaQuery('(orientation: portrait)'));
      expect(result.current).toBe(false);
    } finally {
      mq.uninstall();
    }
  });

  it('subscribes on mount and unsubscribes on unmount', () => {
    const mq = installMatchMedia();
    try {
      const { unmount } = renderHook(() => useMediaQuery(QUERY));
      expect(mq.listenerCount(QUERY)).toBe(1);
      unmount();
      expect(mq.listenerCount(QUERY)).toBe(0);
    } finally {
      mq.uninstall();
    }
  });

  it('re-subscribes when the query changes', () => {
    const mq = installMatchMedia();
    try {
      const nextQuery = '(min-width: 900px)';
      mq.setMatches(nextQuery, true);
      const { result, rerender, unmount } = renderHook(
        ({ q }: { q: string }) => useMediaQuery(q),
        { initialProps: { q: QUERY } }
      );
      expect(mq.listenerCount(QUERY)).toBe(1);

      rerender({ q: nextQuery });
      expect(result.current).toBe(true);
      expect(mq.listenerCount(QUERY)).toBe(0);
      expect(mq.listenerCount(nextQuery)).toBe(1);
      unmount();
    } finally {
      mq.uninstall();
    }
  });

  it('server-renders false without ever touching matchMedia', () => {
    function Probe() {
      return <span>{String(useMediaQuery(QUERY))}</span>;
    }
    // 未安装 stub，反而装上哨兵：SSR 路径若触碰 matchMedia
    // （getSnapshot 或 subscribe）立即抛错。
    window.matchMedia = (): MediaQueryList => {
      throw new Error('matchMedia must not be called during SSR render');
    };
    try {
      const html = renderToString(<Probe />);
      expect(html).toContain('false');
    } finally {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });
});
