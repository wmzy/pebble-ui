import type { ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { useControl } from 'react-use-control';

import { useFocusScope } from '../../utils/focus-scope';
import { whenExitSettles } from '../../utils/presence';
import { useViewTransitionFlip } from '../../utils/view-transition';

/**
 * Imperative handle exposed through the React 19 `ref` prop (same API
 * choice as VirtualList). `open`/`close` are state writes going through
 * the same control path as every other open transition, so the animated
 * exit → native `close` event remains the single `onClose` exit — a
 * handle close never double-fires the callback.
 */
type DrawerHandle = {
  /** Show the drawer (`showModal` + initial focus, as if `open` flipped true). */
  open: () => void;
  /**
   * Close the drawer through the animated exit; `onClose` fires exactly
   * once, via the native close event — never synchronously here.
   */
  close: () => void;
  /** Focus the element that held focus when the drawer last opened. */
  focusTrigger: () => void;
};

type DrawerProps = {
  open?: ControlOrValue<boolean>;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  onClose?: () => void;
  /**
   * 开/关状态翻转是否包进 View Transitions API（默认 `false`，行为与
   * 不传完全一致）。开启后每次显隐翻转都运行在
   * `document.startViewTransition(() => flushSync(...))` 里（React 官方
   * 要求的同步 DOM 更新模式），页面获得原生过渡；命令式 handle、
   * Esc、背景点击等路径共用同一出口。引擎不支持
   * `startViewTransition` 或用户偏好 `prefers-reduced-motion: reduce`
   * 时自动退化为直接翻转。过渡外观由消费方的 `::view-transition-*`
   * 样式定义，组件自身的进退场动画照常运行在新快照内。
   */
  viewTransition?: boolean;
  className?: string;
  children: ReactNode;
  ref?: Ref<DrawerHandle>;
};

const overlay = css`
  border: none;
  padding: 0;
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  max-height: 100vh;
  max-width: 100vw;
  overflow: auto;

  &[open][data-state='open'] {
    animation: haze-drawer-in var(--haze-duration-normal) var(--haze-ease);
  }

  &[open][data-state='closed'] {
    animation: haze-drawer-out var(--haze-duration-fast) var(--haze-ease);
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }

  &[open][data-state='open']::backdrop {
    animation: haze-drawer-backdrop-in var(--haze-duration-normal)
      var(--haze-ease);
  }

  &[open][data-state='closed']::backdrop {
    animation: haze-drawer-backdrop-out var(--haze-duration-fast)
      var(--haze-ease);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  /* 进出场位移由 placement 类注入变量，一对 keyframes 覆盖四个方向 */
  @keyframes haze-drawer-in {
    from {
      transform: translate(
        var(--haze-drawer-from-x, 0),
        var(--haze-drawer-from-y, 0)
      );
    }
  }

  @keyframes haze-drawer-out {
    to {
      transform: translate(
        var(--haze-drawer-from-x, 0),
        var(--haze-drawer-from-y, 0)
      );
    }
  }

  @keyframes haze-drawer-backdrop-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-drawer-backdrop-out {
    to {
      opacity: 0;
    }
  }
`;

/* physical: placement is a physical API ('left'/'right' edge of the
   viewport, matching the ±100% slide-in vars below); the pinned edge
   must not flip with direction. */
const placements = {
  left: css`
    height: 100vh;
    width: 320px;
    min-width: 280px;
    max-width: 85vw;
    /* physical: pins the left drawer to the physical left edge.
       UA dialog:modal margin is auto — both sides must be explicit,
       a lone margin-left 0 leaves the UA auto on the right and (with
       an auto on both sides) centers the drawer. */
    margin-left: 0;
    margin-right: auto;
    --haze-drawer-from-x: -100%;
    --haze-drawer-from-y: 0;
  `,
  right: css`
    height: 100vh;
    width: 320px;
    min-width: 280px;
    max-width: 85vw;
    /* physical: pins the right drawer to the physical right edge. */
    margin-left: auto;
    margin-right: 0;
    --haze-drawer-from-x: 100%;
    --haze-drawer-from-y: 0;
  `,
  top: css`
    width: 100vw;
    height: 320px;
    margin-top: 0;
    margin-bottom: auto;
    --haze-drawer-from-x: 0;
    --haze-drawer-from-y: -100%;
  `,
  bottom: css`
    width: 100vw;
    height: 320px;
    margin-top: auto;
    margin-bottom: 0;
    --haze-drawer-from-x: 0;
    --haze-drawer-from-y: 100%;
  `,
} as const;

export default function Drawer({
  open: openControl,
  placement = 'right',
  onClose,
  viewTransition = false,
  className,
  children,
  ref,
}: DrawerProps) {
  const [open, setOpen] = useControl(openControl, false);
  // open/close 翻转的统一出口：viewTransition 开启时每次翻转包在
  // document.startViewTransition(() => flushSync(...)) 里（不支持或
  // reduce 偏好时退化为直接 setOpen）。
  const flipOpen = useViewTransitionFlip(viewTransition, setOpen);
  const openerRef = useRef<HTMLElement | null>(null);
  // Opener capture for the imperative handle's focusTrigger(). Declared
  // BEFORE useFocusScope on purpose: effects run in declaration order,
  // and the scope's effect is what moves focus into the drawer —
  // capturing later would record the drawer itself. This mirrors the
  // element the scope restores focus to on close.
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement ? active : null;
  }, [open]);
  const internalRef = useRef<HTMLDialogElement | null>(null);
  // 声明在 showModal effect 之前：scope 激活时先记录 opener（此时的
  // activeElement 还没被 showModal 转进 drawer），关闭时由 scope 归还。
  // 原生 modal 已锁定 Tab，无需 trapped。
  const setScope = useFocusScope({ enabled: open, trapped: false });

  // Imperative surface: `ref.current?.open()/close()/focusTrigger()`.
  // open/close only write the state — the showModal/close effect and the
  // native close-event callback chain do the rest, keeping every exit
  // path single-sourced.
  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        flipOpen(true);
      },
      close: () => {
        flipOpen(false);
      },
      focusTrigger: () => {
        const target = openerRef.current;
        if (target?.isConnected) target.focus();
      },
    }),
    [flipOpen]
  );

  const setDialogRef = useCallback(
    (node: HTMLDialogElement | null) => {
      internalRef.current = node;
      setScope(node);
    },
    [setScope]
  );

  useEffect(() => {
    const el = internalRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      // 退场动画（data-state=closed 驱动滑动）结束后再真正 close()，
      // 原生 close 事件（onClose 回调链路）保持由 close 触发。
      const settle = whenExitSettles(el);
      const finish = () => {
        // settle 期间被重新打开时 data-state 已翻回 open，本退场流作废
        if (el.getAttribute('data-state') === 'closed') el.close();
      };
      if (settle) void settle.then(finish);
      else finish();
    }
  }, [open]);

  return (
    <dialog
      ref={setDialogRef}
      data-state={open ? 'open' : 'closed'}
      x-class={[overlay, placements[placement], className]}
      onClose={() => {
        // 原生 close 事件到达时 DOM 已关闭（el.close() 已生效），这里
        // 的 setOpen(false) 只是把 React 状态同步回事实——发起关闭的
        // 交互路径已经拥有那次 view transition，这里再包会捕获两张
        // 相同的（已关闭）快照，因此保持直接写入。
        setOpen(false);
        onClose?.();
      }}
      onCancel={(e) => {
        // 原生 Esc/backdrop 的关闭请求会绕过退场动画立即关闭 drawer：
        // 阻止默认行为，统一改走 React 状态 → 退场动画 → el.close()。
        e.preventDefault();
        flipOpen(false);
      }}
      onClick={(e) => {
        if (e.target === internalRef.current) {
          // 只改状态：onClose 由 effect 中 el.close() 触发的原生 close
          // 事件统一发出，这里再调一次会双触发。
          flipOpen(false);
        }
      }}
    >
      {children}
    </dialog>
  );
}

export type { DrawerProps, DrawerHandle };
