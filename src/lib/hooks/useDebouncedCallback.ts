import { useCallback, useEffect, useRef } from 'react';

/**
 * 返回 `fn` 的防抖版本（尾触发）：窗口内连续调用只在最后一次调用
 * 的窗口到期后执行一次，参数取最后一次调用。
 *
 * ```tsx
 * const save = useDebouncedCallback((draft) => persist(draft), 500);
 * <Textarea onChange={(e) => save(e.target.value)} />;
 * ```
 *
 * - `fn` 与 `delayMs` 都经 ref 透传：调用时始终执行「最新一次渲染」
 *   的闭包（事件回调里读到最新 state，无需把 fn 写进依赖）。
 * - 返回的函数引用跨渲染稳定（空依赖 `useCallback` + ref 计时），
 *   可安全放进子组件的 props 比较 / effect 依赖。
 * - `delayMs` 变更即时生效：下一次调度起用新窗口。
 * - 卸载时取消挂起的计时器且不 flush——尾调用不会在组件消失后触发。
 *
 * @param fn 需要防抖的函数（引用可任意变化）。
 * @param delayMs 防抖窗口（毫秒）。
 * @returns 引用稳定的防抖函数。
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): (...args: A) => void {
  const fnRef = useRef(fn);
  const delayRef = useRef(delayMs);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 每次 commit 后刷新 ref：并发渲染下写入发生在 commit 期，渲染被
  // 丢弃时不会污染。
  useEffect(() => {
    fnRef.current = fn;
    delayRef.current = delayMs;
  });

  // 卸载：取消挂起的尾调用（不 flush）。
  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    []
  );

  return useCallback((...args: A) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      fnRef.current(...args);
    }, delayRef.current);
  }, []);
}
