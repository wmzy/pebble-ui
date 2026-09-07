import { act, renderHook } from '@testing-library/react';

import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  it('returns the initial value without debounce on mount', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useDebouncedValue('first', 300));
      expect(result.current).toBe('first');
    } finally {
      vi.useRealTimers();
    }
  });

  it('exposes only the last value after the window settles, never intermediates', () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(
        ({ v }: { v: string }) => useDebouncedValue(v, 300),
        { initialProps: { v: 'a' } }
      );
      rerender({ v: 'ab' });
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(result.current).toBe('a');

      // 'ab' 的窗口内又变到 'abc'：窗口重启，'ab' 永远不会被暴露
      rerender({ v: 'abc' });
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('a');
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(result.current).toBe('abc');
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies a changed delayMs immediately by restarting the window', () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(
        ({ v, d }: { v: string; d: number }) => useDebouncedValue(v, d),
        { initialProps: { v: 'a', d: 300 } }
      );
      rerender({ v: 'b', d: 100 });
      // 新窗口 100ms：旧的 300ms 计时器已被清理
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current).toBe('b');
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the pending timer on unmount without warnings', () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { rerender, unmount } = renderHook(
        ({ v }: { v: string }) => useDebouncedValue(v, 300),
        { initialProps: { v: 'a' } }
      );
      rerender({ v: 'b' });
      unmount();
      expect(vi.getTimerCount()).toBe(0);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
