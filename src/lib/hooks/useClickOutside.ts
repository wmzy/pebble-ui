import type { RefCallback, RefObject } from 'react';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseClickOutsideOptions = {
  /**
   * 是否启用监听。默认 `true`；`false` 时不绑定任何事件（浮层关闭态
   * 常用，省一次全局监听）。
   */
  enabled?: boolean;
  /**
   * 命中「外部」也要忽略的元素列表（如浮层的 trigger——点 trigger 走
   * 它自己的开合逻辑，不应同时触发 onOutside）。传 RefObject，元素
   * 可晚于监听建立。
   */
  ignore?: (RefObject<Element | null>)[];
};

/**
 * 元素外部指针按下回调（document 级 `pointerdown` 监听封装）。
 *
 * ```tsx
 * function Panel() {
 *   const [open, setOpen] = useState(false);
 *   const triggerRef = useRef<HTMLButtonElement>(null);
 *   const panelRef = useClickOutside<HTMLDivElement>(
 *     () => setOpen(false),
 *     {enabled: open, ignore: [triggerRef]}
 *   );
 *   return <>
 *     <button ref={triggerRef} onClick={() => setOpen(!open)}>…</button>
 *     {open && <div ref={panelRef}>…</div>}
 *   </>;
 * }
 * ```
 *
 * - 返回稳定回调 ref：挂到目标元素上即可，挂载/卸载自动建立/断开监听。
 * - 用 `event.composedPath()` 判定内外：shadow DOM 的 retarget 点击能
 *   正确归属到宿主元素。
 * - 注意 React portal 不是 shadow DOM：portal 到别处的 DOM 点击按
 *   真实 DOM 树判定为「外部」。portal 面板场景请把返回的 ref 挂到
 *   portal 容器上，或把 portal 根加进 `ignore`。
 * - `enabled: false` 时不监听（关闭中的浮层零开销）。
 *
 * @param onOutside 目标元素与 ignore 元素之外发生 pointerdown 时调用。
 * @param options 见 {@link UseClickOutsideOptions}。
 * @returns 挂到目标元素上的回调 ref。
 */
export function useClickOutside<T extends Element>(
  onOutside: (event: PointerEvent) => void,
  options: UseClickOutsideOptions = {}
): RefCallback<T> {
  const { enabled = true, ignore } = options;
  const [element, setElement] = useState<T | null>(null);
  // latest-ref：消费者传内联函数时不重建 document 监听；事件时点读取，
  // effect 内同步——渲染期不碰 ref
  const onOutsideRef = useRef(onOutside);
  const ignoreRef = useRef(ignore);
  useEffect(() => {
    onOutsideRef.current = onOutside;
    ignoreRef.current = ignore;
  });

  useEffect(() => {
    if (!enabled || element === null) return;
    const isIgnored = (target: EventTarget | null): boolean => {
      const refs = ignoreRef.current;
      if (!refs) return false;
      for (const ref of refs) {
        if (ref.current && target instanceof Node && ref.current.contains(target)) {
          return true;
        }
      }
      return false;
    };
    const onPointerDown = (event: PointerEvent) => {
      // composedPath 覆盖 shadow DOM retarget：React 树位置不影响内外判定
      const path = event.composedPath();
      const inside = path.includes(element);
      if (!inside && !isIgnored(event.target)) {
        onOutsideRef.current(event);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [enabled, element]);

  // 稳定回调 ref：identity 不随渲染变化
  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  return ref;
}

export type { UseClickOutsideOptions };
