import type { Dispatch, SetStateAction } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useStorageState } from './useStorageState';

/**
 * sessionStorage 持久化的可控状态：与 `useLocalStorage` 共享同一内核，
 * 仅 storage 区域不同——值随标签页会话存活，关闭标签页即清空。
 *
 * ```tsx
 * // 非受控：已持久化值优先于 initial；setValue 即写回 sessionStorage
 * const [token, setToken] = useSessionStorage<string>('api-token', undefined, '');
 * setToken('abc'); // sessionStorage['api-token'] === '"abc"'
 *
 * // 受控：control 所有者持有状态，storage 只作初值来源、不回写
 * const [token, setToken, tokenControl] = useControl(undefined, '');
 * <TokenField token={tokenControl} onTokenChange={setToken} />
 * ```
 *
 * 语义与 `useLocalStorage` 完全一致（初值解析顺序、损坏 JSON 容错、
 * 非受控写回 + 跨标签页 `storage` 事件同步、受控不回写、SSR 安全），
 * 见 {@link useLocalStorage}。
 *
 * @param key storage 键。
 * @param control `Control<T>` 受控，或裸 `T` 作非受控初值。
 * @param initial 兜底初始值（支持惰性函数形式）。
 * @returns `[value, setValue]`，语义与 `useState` 一致。
 */
export function useSessionStorage<T>(
  key: string,
  control?: ControlOrValue<T>,
  initial?: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  return useStorageState('session', key, control, initial);
}
