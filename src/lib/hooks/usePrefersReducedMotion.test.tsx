import { act, renderHook } from '@testing-library/react';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const QUERY = '(prefers-reduced-motion: reduce)';

// jsdom 30 没有 matchMedia——只 stub 本 hook 关心的那一条查询，
// 其它查询进来即抛错（顺带锁死查询字符串，防止意外漂移）。
function installReducedMotionStub() {
  const listeners = new Set<() => void>();
  let matches = false;

  window.matchMedia = ((query: string) => {
    if (query !== QUERY) throw new Error(`unexpected query: ${query}`);
    return {
      matches, // matchMedia 每次被调用时读取闭包当前值，语义同真实 MQL
      media: query,
      onchange: null,
      addEventListener: (type: string, listener: () => void) => {
        if (type === 'change') listeners.add(listener);
      },
      removeEventListener: (type: string, listener: () => void) => {
        if (type === 'change') listeners.delete(listener);
      },
      addListener: (listener: () => void) => listeners.add(listener),
      removeListener: (listener: () => void) => listeners.delete(listener),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  });

  return {
    setMatches(next: boolean) {
      matches = next;
      for (const listener of [...listeners]) listener();
    },
    uninstall() {
      Reflect.deleteProperty(window, 'matchMedia');
    },
  };
}

describe('usePrefersReducedMotion', () => {
  it('defaults to false and follows the prefers-reduced-motion query', () => {
    const mq = installReducedMotionStub();
    try {
      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);

      act(() => mq.setMatches(true));
      expect(result.current).toBe(true);

      act(() => mq.setMatches(false));
      expect(result.current).toBe(false);
    } finally {
      mq.uninstall();
    }
  });
});
