import { useEffect, useState } from 'react';

/**
 * 返回 `value` 的防抖镜像：值停止变化 `delayMs` 后才同步到最新值。
 *
 * ```tsx
 * const debouncedQuery = useDebouncedValue(query, 300);
 * useEffect(() => { search(debouncedQuery); }, [debouncedQuery]);
 * ```
 *
 * - 内部派生状态（镜像没有「父组件控制」的语义，不走 useControl）。
 * - 挂载首帧直接返回当时的 `value`（不防抖）；窗口内快速变化的
 *   中间值永远不会暴露。
 * - `delayMs` 变更即时生效：计时器依赖 `[value, delayMs]`，任一变化
 *   都重启窗口。
 * - 卸载清理计时器，不会对已卸载组件 setState。
 *
 * @param value 需要防抖的值。
 * @param delayMs 防抖窗口（毫秒）。
 * @returns 防抖后的值。
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // value 回到与 debounced 相同时也无妨：Object.is 相同的 setState
    // 会被 React 跳过，不做前置比较换取实现最小。
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
