import { act, renderHook } from '@testing-library/react';

import { useClipboard } from './useClipboard';

// jsdom 30 既没有 navigator.clipboard 也没有 document.execCommand——
// 两条复制路径都得 stub。
function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return () => {
    Reflect.deleteProperty(navigator, 'clipboard');
  };
}

function stubExecCommand(impl: () => boolean) {
  const fn = vi.fn(impl);
  // Stubbing the deprecated API the fallback path depends on.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  document.execCommand = fn;
  return {
    fn,
    restore: () => {
      Reflect.deleteProperty(document, 'execCommand');
    },
  };
}

describe('useClipboard', () => {
  it('copies via the async clipboard API and resets copied after resetMs', async () => {
    vi.useFakeTimers();
    const written: string[] = [];
    const restore = stubClipboard((text) => {
      written.push(text);
      return Promise.resolve();
    });
    try {
      const { result } = renderHook(() => useClipboard(2000));
      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.copy('haze');
      });
      expect(ok).toBe(true);
      expect(written).toEqual(['haze']);
      expect(result.current.copied).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(result.current.copied).toBe(true);
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current.copied).toBe(false);
    } finally {
      restore();
      vi.useRealTimers();
    }
  });

  it('falls back to execCommand when the clipboard API rejects', async () => {
    vi.useFakeTimers();
    const restore = stubClipboard(() =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
    );
    const exec = stubExecCommand(() => true);
    try {
      const { result } = renderHook(() => useClipboard());
      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.copy('legacy');
      });
      expect(ok).toBe(true);
      expect(exec.fn).toHaveBeenCalledWith('copy');
      expect(result.current.copied).toBe(true);
      // 退化路径的隐藏 textarea 用完即删
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      exec.restore();
      restore();
      vi.useRealTimers();
    }
  });

  it('falls back to execCommand when navigator.clipboard is absent', async () => {
    // 不装 clipboard stub：jsdom 默认没有 navigator.clipboard，
    // 访问其方法属性即抛 TypeError，同样应落入退化路径。
    vi.useFakeTimers();
    const exec = stubExecCommand(() => true);
    try {
      const { result } = renderHook(() => useClipboard());
      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.copy('no-api');
      });
      expect(ok).toBe(true);
      expect(exec.fn).toHaveBeenCalledWith('copy');
    } finally {
      exec.restore();
      vi.useRealTimers();
    }
  });

  it('returns false and keeps copied off when both paths fail', async () => {
    vi.useFakeTimers();
    const restore = stubClipboard(() =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
    );
    const exec = stubExecCommand(() => false);
    try {
      const { result } = renderHook(() => useClipboard());
      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.copy('doomed');
      });
      expect(ok).toBe(false);
      expect(result.current.copied).toBe(false);
      // RTL 的 async act 自身会 park 一个 fake setTimeout(0)，先冲掉它
      // 再数计时器：未置位则 hook 不应安排任何 reset 计时器
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      exec.restore();
      restore();
      vi.useRealTimers();
    }
  });

  it('restarts the reset window when copying again mid-window', async () => {
    vi.useFakeTimers();
    const restore = stubClipboard(() => Promise.resolve());
    try {
      const { result } = renderHook(() => useClipboard(2000));
      await act(async () => {
        await result.current.copy('one');
      });
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      await act(async () => {
        await result.current.copy('two');
      });
      expect(result.current.copied).toBe(true);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      // 第二次复制在 t=1500，窗口应到 t=3500 而不是最初的 2000
      expect(result.current.copied).toBe(true);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.copied).toBe(false);
    } finally {
      restore();
      vi.useRealTimers();
    }
  });

  it('clears the pending reset timer on unmount', async () => {
    vi.useFakeTimers();
    const restore = stubClipboard(() => Promise.resolve());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { result, unmount } = renderHook(() => useClipboard());
      await act(async () => {
        await result.current.copy('bye');
      });
      unmount();
      expect(vi.getTimerCount()).toBe(0);
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      restore();
      vi.useRealTimers();
    }
  });
});
