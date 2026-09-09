import type { Dispatch, SetStateAction } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useEffect } from 'react';
import { isControl, useControl } from 'react-use-control';

// useLocalStorage / useSessionStorage 的共享内核：storage 是持久化副作用，
// 状态真值始终来自 react-use-control 的 ControlOrValue 组合——受控时 control
// 的所有者持有状态，storage 只作初值来源之一；非受控时变更即持久化，并以
// storage 事件接收其它标签页的写入。

/** storage 读取结果：`present` 表示 key 下存在可反序列化的值。 */
type StoredValue<T> = { present: boolean; value: T | undefined };

type StorageKind = 'local' | 'session';

// 隐私模式 / 禁用 cookie 的 Chromium 下访问 window.localStorage 属性本身会
// 抛 SecurityError，取区域必须整体容错；SSR 下 window 不存在直接返回 null。
function getStorageArea(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

// 损坏值（非法 JSON）视为不存在：回落初始值而不是抛错或同步出 undefined。
function readStored<T>(kind: StorageKind, key: string): StoredValue<T> {
  const area = getStorageArea(kind);
  if (area === null) return { present: false, value: undefined };
  let raw: string | null;
  try {
    raw = area.getItem(key);
  } catch {
    return { present: false, value: undefined };
  }
  if (raw === null) return { present: false, value: undefined };
  try {
    return { present: true, value: JSON.parse(raw) as T };
  } catch {
    return { present: false, value: undefined };
  }
}

/**
 * storage 持久化的可控状态内核（useLocalStorage / useSessionStorage 共用）。
 *
 * 初值解析顺序：已持久化值 > 非受控裸值 > `initial`。受控（传入 control）
 * 且 control 已携带 state 时，useControl 直接采用上游状态，storage 不参与。
 */
function useStorageState<T>(
  kind: StorageKind,
  key: string,
  control: ControlOrValue<T> | undefined,
  initial: T | (() => T) | undefined
): [T, Dispatch<SetStateAction<T>>] {
  const controlled = isControl(control);

  // 非受控裸值在渲染作用域先收窄成 T | undefined（参数收窄进闭包不可靠），
  // 折进惰性初值——保证持久化值始终优先；受控时把 control 原样交给
  // useControl，惰性初值只在 control 尚无状态时作种子——storage 仅是
  // 初值来源之一，不构成第二条同步通道。
  const plainInitial: T | undefined = controlled ? undefined : control;

  // 显式 () => T 注解：初始值解析只发生一次（useState 惰性初始化），
  // storage 读取不进渲染热路径。
  const resolveInitial = (): T => {
    const stored = readStored<T>(kind, key);
    // present 标记不构成可辨识联合，窄不了类型
    if (stored.present) return stored.value as T;
    if (plainInitial !== undefined) return plainInitial;
    // initial 省略 = 调用方选择 T 含 undefined（与 useState<T>() 同语义）
    if (initial === undefined) return undefined as T;
    // 泛型 T 本身可能是函数类型，typeof 收窄无法从联合里排除 () => T
    return typeof initial === 'function' ? (initial as () => T)() : (initial);
  };

  const [value, setValue] = useControl(controlled ? control : undefined, resolveInitial);

  // 非受控：变更即持久化。首挂载也会写回一次——顺带把损坏值自愈为合法
  // JSON。序列化失败（循环引用 / undefined）或写入失败（配额、隐私模式）
  // 静默放弃，内存状态不受影响。
  useEffect(() => {
    if (controlled) return;
    // JSON.stringify(undefined) → undefined、循环引用/BigInt → throw：
    // 都静默放弃持久化，内存状态不受影响。
    if (value === undefined) return;
    const area = getStorageArea(kind);
    if (area === null) return;
    try {
      area.setItem(key, JSON.stringify(value));
    } catch {
      // 静默放弃持久化（配额、隐私模式、序列化失败）
    }
  }, [controlled, kind, key, value]);

  // 跨标签页同步：storage 事件只在「其它文档」写入同一 storage 区域时派发，
  // 本页写入不触发，因此不会与本页持久化形成回环。受控模式不订阅——状态
  // 真值在 control 所有者手里，storage 事件不回写。同 key 多实例同标签页
  // 不要求同步（storage 事件不触发同页文档）。
  useEffect(() => {
    if (controlled) return;
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== key) return;
      const area = getStorageArea(kind);
      if (area !== null && event.storageArea !== null && event.storageArea !== area) return;
      // 另一标签页删除了 key（newValue null）：保持本地状态
      if (event.newValue === null) return;
      try {
        setValue(JSON.parse(event.newValue) as T);
      } catch {
        // 损坏值不同步
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [controlled, kind, key, setValue]);

  return [value, setValue];
}

export { useStorageState };
export type { StorageKind };
