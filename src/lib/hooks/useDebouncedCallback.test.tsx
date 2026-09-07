import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';

import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  it('fires once with the last args after the window (trailing semantics)', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { result } = renderHook(
        ({ d }: { d: number }) => useDebouncedCallback<[number, string]>(fn, d),
        { initialProps: { d: 300 } }
      );

      result.current(1, 'a');
      act(() => {
        vi.advanceTimersByTime(150);
      });
      result.current(2, 'b');
      result.current(3, 'c');
      act(() => {
        vi.advanceTimersByTime(150); // t=300：距第一次调用满 300，但窗口已被后两次调用重启
      });
      expect(fn).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(149); // t=449
      });
      expect(fn).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(1); // t=450：最后一次调用后满 300
      });
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3, 'c');
    } finally {
      vi.useRealTimers();
    }
  });

  it('always invokes the latest committed closure, even when scheduled earlier', () => {
    vi.useFakeTimers();
    try {
      const fnA = vi.fn();
      const fnB = vi.fn();
      const { result, rerender } = renderHook(
        ({ fn }: { fn: (x: string) => void }) =>
          useDebouncedCallback<[string]>(fn, 100),
        { initialProps: { fn: fnA } }
      );

      result.current('x');
      rerender({ fn: fnB }); // 调度发生在 fnA 期，触发时应执行最新闭包
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(fnA).not.toHaveBeenCalled();
      expect(fnB).toHaveBeenCalledWith('x');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the returned function referentially stable across renders', () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(
        ({ fn, d }: { fn: () => void; d: number }) => useDebouncedCallback(fn, d),
        { initialProps: { fn: vi.fn(), d: 100 } }
      );
      const first = result.current;

      rerender({ fn: vi.fn(), d: 100 }); // fn 换了引用
      expect(result.current).toBe(first);
      rerender({ fn: vi.fn(), d: 500 }); // delayMs 换了值
      expect(result.current).toBe(first);
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies a changed delayMs to the next scheduled window', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { result, rerender } = renderHook(
        ({ d }: { d: number }) => useDebouncedCallback(fn, d),
        { initialProps: { d: 100 } }
      );
      rerender({ d: 300 });
      result.current();
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(fn).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(fn).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the pending trailing call on unmount without flushing it', () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const fn = vi.fn();
      const { result, unmount } = renderHook(
        ({ d }: { d: number }) => useDebouncedCallback(fn, d),
        { initialProps: { d: 300 } }
      );
      result.current('tail');
      unmount();
      expect(vi.getTimerCount()).toBe(0);
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(fn).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('collapses rapid calls into one invocation under StrictMode double effects', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { result } = renderHook(
        () => useDebouncedCallback<[number]>(fn, 200),
        { wrapper: StrictMode }
      );
      result.current(1);
      result.current(2);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
