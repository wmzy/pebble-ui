import { act, renderHook } from '@testing-library/react';
import { useControl } from 'react-use-control';

import { useSessionStorage } from './useSessionStorage';

const KEY = 'haze-use-session-storage-test';

function dispatchStorage(
  key: string,
  newValue: string | null,
  area: Storage = window.sessionStorage
) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: area }));
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('useSessionStorage', () => {
  it('lazily restores the persisted value over any initial (incl. plain-value form)', () => {
    window.sessionStorage.setItem(KEY, JSON.stringify([1, 2]));
    const { result, rerender } = renderHook(
      ({ initial }: { initial: number[] }) => useSessionStorage<number[]>(KEY, undefined, initial),
      { initialProps: { initial: [] as number[] } }
    );
    expect(result.current[0]).toEqual([1, 2]);
    rerender({ initial: [9] });
    expect(result.current[0]).toEqual([1, 2]);

    const plain = renderHook(() => useSessionStorage<number[]>(KEY, [3], []));
    expect(plain.result.current[0]).toEqual([1, 2]);
  });

  it('falls back to initial when nothing is stored, then persists writes and restores on remount', () => {
    const first = renderHook(() => useSessionStorage<string>(KEY, undefined, 'a'));
    expect(first.result.current[0]).toBe('a');
    expect(window.sessionStorage.getItem(KEY)).toBe(JSON.stringify('a'));

    act(() => {
      first.result.current[1]('b');
    });
    expect(window.sessionStorage.getItem(KEY)).toBe(JSON.stringify('b'));
    first.unmount();

    const second = renderHook(() => useSessionStorage<string>(KEY, undefined, 'a'));
    expect(second.result.current[0]).toBe('b');
  });

  it('falls back to initial on corrupted JSON and self-heals the entry', () => {
    window.sessionStorage.setItem(KEY, 'not-json');
    const { result } = renderHook(() => useSessionStorage<string>(KEY, undefined, 'fresh'));
    expect(result.current[0]).toBe('fresh');
    expect(window.sessionStorage.getItem(KEY)).toBe(JSON.stringify('fresh'));
  });

  it('syncs from cross-tab storage events only in uncontrolled mode', () => {
    const { result } = renderHook(() => useSessionStorage<string>(KEY, undefined, 'local'));
    expect(result.current[0]).toBe('local');

    // 其它 key / 其它区域（localStorage）的写入不同步
    act(() => {
      dispatchStorage('other-key', JSON.stringify('nope'));
    });
    act(() => {
      dispatchStorage(KEY, JSON.stringify('from-local'), window.localStorage);
    });
    expect(result.current[0]).toBe('local');

    act(() => {
      dispatchStorage(KEY, JSON.stringify('remote'));
    });
    expect(result.current[0]).toBe('remote');

    act(() => {
      dispatchStorage(KEY, null);
    });
    expect(result.current[0]).toBe('remote');
  });

  it('controlled mode: control wins over storage, no write-back, no event sync', () => {
    window.sessionStorage.setItem(KEY, JSON.stringify('disk'));

    const { result } = renderHook(() => {
      const [, , control] = useControl<string>(undefined, 'seed');
      const [stored, setStored] = useSessionStorage(KEY, control, 'fallback');
      return { stored, setStored };
    });
    expect(result.current.stored).toBe('seed');

    act(() => {
      dispatchStorage(KEY, JSON.stringify('remote'));
    });
    expect(result.current.stored).toBe('seed');

    act(() => {
      result.current.setStored('typed');
    });
    expect(result.current.stored).toBe('typed');
    expect(window.sessionStorage.getItem(KEY)).toBe(JSON.stringify('disk'));
  });
});
