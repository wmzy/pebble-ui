// 媒体查询响应式订阅。useSyncExternalStore 是这个问题的标准解：
// - 订阅在 effect 期建立——SSR 不跑 effect，天然「无 matchMedia 环境
//   不订阅」；
// - 快照是 boolean 原语，Object.is 缓存语义免费（matches 不变不重渲）；
// - change 事件回调即通知重渲，React 负责合并与撕裂防护。
import { useCallback, useSyncExternalStore } from 'react';

// SSR / hydration 快照恒 false：服务端渲染与客户端 hydration 首帧共用
// 同一值，不产生 hydration mismatch；水合完成后若与客户端真实查询
// 结果不同，useSyncExternalStore 以一次额外渲染收敛（React 官方语义，
// 不走 onRecoverableError 通道）。
const getServerSnapshot = (): boolean => false;

/**
 * 订阅一条 CSS 媒体查询，返回当前是否匹配。
 *
 * ```tsx
 * const isWide = useMediaQuery('(min-width: 768px)');
 * ```
 *
 * - 底层 `window.matchMedia` + `useSyncExternalStore`；query 变化时
 *   自动换订阅。
 * - SSR：服务端渲染与 hydration 首帧恒返回 `false`（不访问
 *   `window`、不建立订阅）；水合后与真实结果不一致时以一次额外
 *   渲染收敛，无 hydration mismatch。
 *
 * @param query CSS 媒体查询字符串，如 `'(min-width: 768px)'`。
 * @returns 当前是否匹配（SSR 阶段恒为 `false`）。
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
