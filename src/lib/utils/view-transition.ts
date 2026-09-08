import type { Dispatch, SetStateAction } from 'react';

import { useCallback } from 'react';
import { flushSync } from 'react-dom';

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * 模态浮层 open 状态翻转的 View Transitions 包装器（内部原语，不进
 * barrel）。Dialog/Drawer/BottomSheet 的 opt-in `viewTransition` prop
 * 共用这一出口。
 *
 * React 官方模式：`document.startViewTransition(() => flushSync(() =>
 * setOpen(next)))`——浏览器先捕获旧快照，update callback 里的 flushSync
 * 同步提交翻转后的 DOM，`::view-transition-*` 伪元素树驱动整页过渡。
 * 包装的只是「状态翻转外层」：命令式 handle、受控同步、Esc/背景点击
 * 等所有路径内部仍走同一个 setOpen，不会双发或失同步。
 *
 * 三重守卫下直接透传（与不开 prop 时行为完全一致）：
 * - `enabled` 为 false（组件默认值）；
 * - `prefers-reduced-motion: reduce`（usePrefersReducedMotion 是 hook，
 *   在本 hook 顶层订阅，回调闭包只读值——不能在回调里现调）；
 * - 引擎不支持 `document.startViewTransition`（jsdom / 旧引擎）。
 *
 * update callback 同步 throw 或过渡被跳过时 `ready`/`finished` 会
 * reject——挂 no-op catch 吞掉，防止 unhandled rejection（状态已由
 * flushSync 落地，没有可恢复的动作）。
 *
 * @param enabled 组件的 `viewTransition` prop（默认 false）。
 * @param setOpen useControl 返回的状态写入器。
 * @returns 签名相同的写入器；开启时每次翻转运行在 VT 的 update
 *   callback 内。
 */
export function useViewTransitionFlip(
  enabled: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>
): Dispatch<SetStateAction<boolean>> {
  const reducedMotion = usePrefersReducedMotion();
  return useCallback(
    (next) => {
      if (
        !enabled ||
        reducedMotion ||
        typeof document.startViewTransition !== 'function'
      ) {
        setOpen(next);
        return;
      }
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setOpen(next);
        });
      });
      // ready 在过渡被跳过（skipTransition / callback throw）时 reject，
      // finished 聚合同样的失败——两者都吞掉即可覆盖全部 reject 路径。
      transition.ready.catch(() => undefined);
      transition.finished.catch(() => undefined);
    },
    [enabled, reducedMotion, setOpen]
  );
}
