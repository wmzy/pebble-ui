import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useCallback, useEffect, useRef } from 'react';
import { useControl } from 'react-use-control';

import { useFocusScope } from '../../utils/focus-scope';
import { whenExitSettles } from '../../utils/presence';

type DrawerProps = {
  open?: ControlOrValue<boolean>;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  onClose?: () => void;
  className?: string;
  children: ReactNode;
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
    /* physical: pins the left drawer to the physical left edge. */
    margin-left: 0;
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
    --haze-drawer-from-x: 100%;
    --haze-drawer-from-y: 0;
  `,
  top: css`
    width: 100vw;
    height: 320px;
    margin-top: 0;
    --haze-drawer-from-x: 0;
    --haze-drawer-from-y: -100%;
  `,
  bottom: css`
    width: 100vw;
    height: 320px;
    margin-top: auto;
    --haze-drawer-from-x: 0;
    --haze-drawer-from-y: 100%;
  `,
} as const;

export default function Drawer({
  open: openControl,
  placement = 'right',
  onClose,
  className,
  children,
}: DrawerProps) {
  const [open, setOpen] = useControl(openControl, false);
  const ref = useRef<HTMLDialogElement | null>(null);
  // 声明在 showModal effect 之前：scope 激活时先记录 opener（此时的
  // activeElement 还没被 showModal 转进 drawer），关闭时由 scope 归还。
  // 原生 modal 已锁定 Tab，无需 trapped。
  const setScope = useFocusScope({ enabled: open, trapped: false });

  const setDialogRef = useCallback(
    (node: HTMLDialogElement | null) => {
      ref.current = node;
      setScope(node);
    },
    [setScope]
  );

  useEffect(() => {
    const el = ref.current;
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
        setOpen(false);
        onClose?.();
      }}
      onCancel={(e) => {
        // 原生 Esc/backdrop 的关闭请求会绕过退场动画立即关闭 drawer：
        // 阻止默认行为，统一改走 React 状态 → 退场动画 → el.close()。
        e.preventDefault();
        setOpen(false);
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          // 只改状态：onClose 由 effect 中 el.close() 触发的原生 close
          // 事件统一发出，这里再调一次会双触发。
          setOpen(false);
        }
      }}
    >
      {children}
    </dialog>
  );
}

export type { DrawerProps };
