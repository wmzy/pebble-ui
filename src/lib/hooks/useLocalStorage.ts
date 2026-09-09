import type { Dispatch, SetStateAction } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useStorageState } from './useStorageState';

/**
 * localStorage 持久化的可控状态（`useControl` 作内核，storage 是持久化
 * 副作用而非替代状态源）。
 *
 * ```tsx
 * // 非受控：初值 'light'，已持久化值优先；setValue 即写回 localStorage
 * const [theme, setTheme] = useLocalStorage<string>('theme', undefined, 'light');
 * setTheme('dark'); // localStorage.theme === '"dark"'
 *
 * // 受控：control 所有者持有状态，storage 只作初值来源、不回写
 * const [theme, setTheme, themeControl] = useControl(undefined, 'light');
 * <ThemeSwitcher theme={themeControl} onThemeChange={setTheme} />
 * ```
 *
 * - 初值解析顺序（惰性，仅首次挂载求值）：已持久化值 > 非受控裸值 >
 *   `initial`。损坏的 JSON 回落初始值，并在下一次变更时自愈回合法 JSON。
 * - 非受控：任何变更（含首挂载）即 `JSON.stringify` 写入；跨标签页通过
 *   `storage` 事件同步（同 key 多实例同标签页不要求同步——storage 事件
 *   不触发同页文档）。
 * - 受控：不持久化、不订阅 storage 事件——`control` 的所有者是真值来源，
 *   避免双写冲突。
 * - SSR：服务端渲染不访问 `window`，恒返回 `initial`；客户端水合后如与
 *   本地持久化值不同，会以一次重渲收敛（storage 类状态的固有特性）。
 * - 隐私模式 / storage 不可用：读写静默降级为纯内存状态。
 *
 * @param key storage 键。
 * @param control `Control<T>` 受控，或裸 `T` 作非受控初值。
 * @param initial 兜底初始值（支持惰性函数形式）。
 * @returns `[value, setValue]`，语义与 `useState` 一致。
 */
export function useLocalStorage<T>(
  key: string,
  control?: ControlOrValue<T>,
  initial?: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  return useStorageState('local', key, control, initial);
}
