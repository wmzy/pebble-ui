import { act, renderHook } from '@testing-library/react';
import { useControl } from 'react-use-control';

import { useLocalStorage } from './useLocalStorage';

const KEY = 'haze-use-local-storage-test';

// 跨标签页 storage 事件：真实浏览器只在「其它文档」写入时派发，测试里
// 手工构造 StorageEvent 模拟（jsdom 支持完整构造器）。
function dispatchStorage(
  key: string,
  newValue: string | null,
  area: Storage = window.localStorage
) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: area }));
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('useLocalStorage', () => {
  it('lazily restores the persisted value over any initial (incl. plain-value form)', () => {
    window.localStorage.setItem(KEY, JSON.stringify(42));
    const { result, rerender } = renderHook(
      ({ initial }: { initial: number }) => useLocalStorage<number>(KEY, undefined, initial),
      { initialProps: { initial: 0 } }
    );
    expect(result.current[0]).toBe(42);
    // 惰性：初值只在首挂载求值一次，后续 initial 变化不再参与
    rerender({ initial: 99 });
    expect(result.current[0]).toBe(42);

    // 非受控裸值同样让位于已持久化值
    const plain = renderHook(() => useLocalStorage<number>(KEY, 7, 0));
    expect(plain.result.current[0]).toBe(42);
  });

  it('falls back to initial when nothing is stored, then persists writes and restores on remount', () => {
    const first = renderHook(() => useLocalStorage<string>(KEY, undefined, 'a'));
    expect(first.result.current[0]).toBe('a');
    // 首挂载即写回初始值
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify('a'));

    act(() => {
      first.result.current[1]('b');
    });
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify('b'));
    first.unmount();

    // 重挂载：从 storage 读回，而不是回落 initial
    const second = renderHook(() => useLocalStorage<string>(KEY, undefined, 'a'));
    expect(second.result.current[0]).toBe('b');
  });

  it('falls back to initial on corrupted JSON and self-heals the entry', () => {
    window.localStorage.setItem(KEY, '{corrupt');
    const { result } = renderHook(() => useLocalStorage<string>(KEY, undefined, 'fresh'));
    expect(result.current[0]).toBe('fresh');
    // 首挂载的持久化副作用顺带把损坏值自愈为合法 JSON
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify('fresh'));

    act(() => {
      result.current[1]('healed');
    });
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify('healed'));
  });

  it('syncs from cross-tab storage events only in uncontrolled mode', () => {
    const { result } = renderHook(() => useLocalStorage<string>(KEY, undefined, 'local'));
    expect(result.current[0]).toBe('local');

    // 其它 key 的写入不同步
    act(() => {
      dispatchStorage('other-key', JSON.stringify('nope'));
    });
    expect(result.current[0]).toBe('local');

    // 其它 storage 区域（sessionStorage）的写入不同步
    act(() => {
      dispatchStorage(KEY, JSON.stringify('from-session'), window.sessionStorage);
    });
    expect(result.current[0]).toBe('local');

    // 同区域的跨标签页写入同步
    act(() => {
      dispatchStorage(KEY, JSON.stringify('remote'));
    });
    expect(result.current[0]).toBe('remote');

    // 另一标签页删除 key（newValue null）：保持本地状态
    act(() => {
      dispatchStorage(KEY, null);
    });
    expect(result.current[0]).toBe('remote');

    // 损坏的新值不同步
    act(() => {
      dispatchStorage(KEY, '{corrupt');
    });
    expect(result.current[0]).toBe('remote');
  });

  it('controlled mode: control wins over storage, no write-back, no event sync', () => {
    // control 已由上游 useControl 播种——storage 只作初值来源之一，
    // 已播种的 control 不读 storage
    window.localStorage.setItem(KEY, JSON.stringify('disk'));

    const { result } = renderHook(() => {
      const [seed, setSeed, control] = useControl<string>(undefined, 'seed');
      const [stored, setStored] = useLocalStorage(KEY, control, 'fallback');
      return { seed, setSeed, control, stored, setStored };
    });
    expect(result.current.stored).toBe('seed');

    // storage 事件不回写受控状态
    act(() => {
      dispatchStorage(KEY, JSON.stringify('remote'));
    });
    expect(result.current.stored).toBe('seed');

    // setter 走 control 的状态，但不持久化（不回写）
    act(() => {
      result.current.setStored('typed');
    });
    expect(result.current.stored).toBe('typed');
    expect(result.current.seed).toBe('typed');
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify('disk'));
  });
});
