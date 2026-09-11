import { act, render, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { vi } from 'vitest';

import { useDarkMode } from './useDarkMode';

// colors.ts 的 Linaria 插值（themeDeclarations(mode)）会让 wyw 在 vitest 里
// 拉起嵌套求值 server，worker 关闭时 10s 超时——全仓唯一被求值的 css`` 模板。
// 这里 mock 掉 token 模块：被测契约是「把 lightTheme/darkTheme 两个类恰好
// 挂其一」，真实类名字符串由 tokens 自己的契约（e2e oklch-derivation）覆盖。
const { lightTheme, darkTheme } = vi.hoisted(() => ({
  lightTheme: 'haze-light-theme-stub',
  darkTheme: 'haze-dark-theme-stub',
}));

vi.mock('@/lib/tokens', () => ({ lightTheme, darkTheme }));

// jsdom 30 没有 matchMedia——按 useMediaQuery.test.tsx 的既有 stub 全量模拟：
// matches + change 监听，setMatches 同步派发（浏览器行为也是同步派发）。
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

  window.matchMedia = ((query: string): MediaQueryList => {
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
  });

  return {
    setMatches(query: string, matches: boolean) {
      const entry = entryOf(query);
      if (entry.matches === matches) return;
      entry.matches = matches;
      for (const listener of [...entry.listeners]) listener();
    },
    uninstall() {
      Reflect.deleteProperty(window, 'matchMedia');
    },
  };
}

const KEY = 'haze-use-dark-mode-test';
const QUERY = '(prefers-color-scheme: dark)';

// documentElement 是跨用例共享的宿主元素，主题类必须显式回收
afterEach(() => {
  document.documentElement.classList.remove(lightTheme, darkTheme);
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('useDarkMode', () => {
  it('switches the theme class on the target when toggled to dark (and back)', () => {
    const { result } = renderHook(() => useDarkMode({ storageKey: KEY }));

    expect(result.current[0]).toBe(false);
    expect(result.current[2]).toBe('system');
    expect(document.documentElement.className).toContain(lightTheme);
    expect(document.documentElement.className).not.toContain(darkTheme);

    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(result.current[2]).toBe('dark');
    expect(document.documentElement.className).toContain(darkTheme);
    expect(document.documentElement.className).not.toContain(lightTheme);

    // 函数式更新以当前 isDark 为 prev
    act(() => result.current[1]((prev) => !prev));
    expect(result.current[0]).toBe(false);
    expect(result.current[2]).toBe('light');
    expect(document.documentElement.className).toContain(lightTheme);
    expect(document.documentElement.className).not.toContain(darkTheme);
  });

  it('persists mode changes and restores the stored mode over defaultMode', () => {
    const first = renderHook(() => useDarkMode({ storageKey: KEY }));
    act(() => first.result.current[3]('dark'));
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify('dark'));
    first.unmount();

    // 重新挂载：持久化值优先于 defaultMode='light'
    const second = renderHook(() =>
      useDarkMode({ storageKey: KEY, defaultMode: 'light' })
    );
    expect(second.result.current[0]).toBe(true);
    expect(second.result.current[2]).toBe('dark');
  });

  it('follows the mocked media query while mode is system, then detaches on explicit mode', () => {
    const mq = installMatchMedia();
    try {
      const { result } = renderHook(() => useDarkMode({ storageKey: KEY }));
      expect(result.current[0]).toBe(false);

      // system 模式跟随 prefers-color-scheme 变化
      act(() => mq.setMatches(QUERY, true));
      expect(result.current[0]).toBe(true);
      expect(document.documentElement.className).toContain(darkTheme);

      act(() => mq.setMatches(QUERY, false));
      expect(result.current[0]).toBe(false);
      expect(document.documentElement.className).toContain(lightTheme);

      // 显式 mode 后不再跟随系统
      act(() => result.current[3]('dark'));
      act(() => mq.setMatches(QUERY, false));
      expect(result.current[0]).toBe(true);
    } finally {
      mq.uninstall();
    }
  });

  it('defaultMode light ignores a dark system preference', () => {
    const mq = installMatchMedia();
    try {
      mq.setMatches(QUERY, true);
      const { result } = renderHook(() =>
        useDarkMode({ storageKey: KEY, defaultMode: 'light' })
      );
      expect(result.current[2]).toBe('light');
      expect(result.current[0]).toBe(false);
      expect(document.documentElement.className).toContain(lightTheme);
    } finally {
      mq.uninstall();
    }
  });

  it('applies the theme class to a custom target (element or ref)', () => {
    const target = document.createElement('section');
    document.body.append(target);

    const { result } = renderHook(() => useDarkMode({ storageKey: KEY, target }));
    act(() => result.current[1](true));
    expect(target.className).toContain(darkTheme);
    expect(document.documentElement.className).not.toContain(darkTheme);

    // ref 形式：同组件渲染的元素在 effect 期已挂到 ref 上
    const ref = { current: null as HTMLElement | null };
    const { result: refResult } = renderHook(() =>
      useDarkMode({ storageKey: KEY, target: ref })
    );
    expect(ref.current).toBeNull(); // 未渲染元素：不炸、不落类

    const Probe = () => {
      const [, setIsDark] = useDarkMode({ storageKey: KEY, target: ref });
      return (
        <div
          ref={(node) => {
            ref.current = node;
          }}
          onClick={() => setIsDark(true)}
        />
      );
    };
    render(<Probe />);
    expect(ref.current).not.toBeNull();
    // 本用例此前 setIsDark(true) 已把 'dark' 持久化，Probe 恢复即暗色
    expect(ref.current?.className).toContain(darkTheme);

    target.remove();
  });

  it('falls back to defaultMode on an invalid stored value', () => {
    window.localStorage.setItem(KEY, JSON.stringify('blue'));
    const { result } = renderHook(() =>
      useDarkMode({ storageKey: KEY, defaultMode: 'light' })
    );
    expect(result.current[2]).toBe('light');
    expect(result.current[0]).toBe(false);
  });

  it('does not throw when localStorage is unavailable', () => {
    // vi.spyOn 会先读原 getter 存底——抛错型 getter 只能整体换 accessor
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError: storage denied');
      },
    });
    try {
      const { result } = renderHook(() => useDarkMode({ storageKey: KEY }));
      expect(result.current[2]).toBe('system');

      act(() => result.current[1](true));
      expect(result.current[0]).toBe(true);
      expect(result.current[2]).toBe('dark');
      expect(document.documentElement.className).toContain(darkTheme);
    } finally {
      // 不恢复会污染 afterEach 的 localStorage.clear()
      if (descriptor !== undefined) {
        Object.defineProperty(window, 'localStorage', descriptor);
      } else {
        Reflect.deleteProperty(window, 'localStorage');
      }
    }
  });

  it('server-renders without touching documentElement', () => {
    const Probe = () => {
      const [isDark, , mode] = useDarkMode({ storageKey: KEY });
      return (
        <span data-dark={isDark} data-mode={mode}>
          ssr
        </span>
      );
    };
    // renderToString 不跑 effect：无 DOM 类副作用；渲染期也不读 storage
    const html = renderToString(<Probe />);
    expect(html).toContain('data-mode="system"');
    expect(document.documentElement.className).not.toContain(darkTheme);
    expect(document.documentElement.className).not.toContain(lightTheme);
  });
});
