import type { RefCallback } from 'react';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseInViewOptions = IntersectionObserverInit & {
  /**
   * 命中一次后冻结为 `true` 并断开观察——适用于「进入视口才加载/上报」
   * 这类一次性场景。默认 `false`（持续跟随进出视口切换）。
   */
  once?: boolean;
};

/**
 * 观察元素是否进入视口（IntersectionObserver 的 ref 回调封装）。
 *
 * ```tsx
 * function LazyImage() {
 *   const [ref, inView] = useInView<HTMLImageElement>({ once: true });
 *   // 进入视口前不发起请求；once 命中后冻结，不再重复观察
 *   return <img ref={ref} src={inView ? '/real.png' : undefined} alt='' />;
 * }
 * ```
 *
 * - 返回 `[refCallback, inView]`：把回调 ref 挂到目标元素上即可，元素
 *   挂载/卸载自动建立/断开观察；`options` 变化（root/rootMargin/threshold）
 *   会重建 observer。
 * - `once: true`：首次 `isIntersecting` 置 `true` 后 disconnect 并冻结，
 *   后续进出视口不再翻转。
 * - 引擎无 IntersectionObserver（SSR、jsdom）：恒返回 `false`、不抛错、
 *   不建立观察。
 *
 * @param options IntersectionObserver 初始化项 + `once`。
 * @returns `[refCallback, inView]`。
 */
export function useInView<T extends Element>(
  options: UseInViewOptions = {}
): [RefCallback<T>, boolean] {
  const { once = false, root, rootMargin, threshold } = options;
  const [element, setElement] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  // once 已命中的冻结标记：跨 observer 重建仍保持 true
  const frozenRef = useRef(false);

  useEffect(() => {
    if (element === null) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!frozenRef.current) setInView(true);
            if (once) {
              frozenRef.current = true;
              observer.disconnect();
            }
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { root, rootMargin, threshold }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, once, root, rootMargin, threshold]);

  // 稳定回调 ref：identity 不随渲染变化，元素不会因 ref 更替被反复卸载观察
  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  return [ref, inView];
}

export type { UseInViewOptions };
