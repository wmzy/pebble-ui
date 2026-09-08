import type { ReactNode, ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';
import { css } from '@linaria/core';
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { useFocusScope } from '../../utils/focus-scope';
import { Presence } from '../../utils/presence';
import { useViewTransitionFlip } from '../../utils/view-transition';

/**
 * Imperative handle exposed through the React 19 `ref` prop (same API
 * choice as VirtualList). Unlike Dialog/Drawer there is no native close
 * event to defer to — every exit path (overlay click, Escape, handle)
 * runs through the same `handleClose`, so `onClose` still fires exactly
 * once per close.
 */
type BottomSheetHandle = {
  /** Show the sheet (Presence mounts it, focus moves in). */
  open: () => void;
  /** Close the sheet through the animated exit; `onClose` fires once. */
  close: () => void;
  /** Focus the element that held focus when the sheet last opened. */
  focusTrigger: () => void;
};

type BottomSheetProps = {
  open?: ControlOrValue<boolean>;
  onClose?: () => void;
  /**
   * 开/关状态翻转是否包进 View Transitions API（默认 `false`，行为与
   * 不传完全一致）。开启后每次显隐翻转都运行在
   * `document.startViewTransition(() => flushSync(...))` 里（React 官方
   * 要求的同步 DOM 更新模式），页面获得原生过渡；命令式 handle、
   * Esc、遮罩点击等路径共用同一出口。引擎不支持
   * `startViewTransition` 或用户偏好 `prefers-reduced-motion: reduce`
   * 时自动退化为直接翻转。过渡外观由消费方的 `::view-transition-*`
   * 样式定义，组件自身的进退场动画照常运行在新快照内。
   */
  viewTransition?: boolean;
  children: ReactNode;
  className?: string;
  ref?: Ref<BottomSheetHandle>;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const overlay = css`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  /* Presence 注入的 data-state 驱动 backdrop 与内容各自的进退场 */
  &[data-state='open'] {
    animation: haze-sheet-backdrop-in var(--haze-duration-normal)
      var(--haze-ease);
  }

  &[data-state='closed'] {
    animation: haze-sheet-backdrop-out var(--haze-duration-fast)
      var(--haze-ease);
  }

  @keyframes haze-sheet-backdrop-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-sheet-backdrop-out {
    to {
      opacity: 0;
    }
  }
`;

const sheet = css`
  background: var(--haze-color-bg);
  border-radius: var(--haze-radius-xl) var(--haze-radius-xl) 0 0;
  padding: var(--haze-space-4) var(--haze-space-6)
    calc(var(--haze-space-4) + env(safe-area-inset-bottom));
  max-width: 640px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
  box-shadow: var(--haze-shadow-xl);

  /* 退场时长须不大于 overlay 的退场（overlay 卸载即整树消失） */
  [data-state='open'] & {
    animation: haze-sheet-in var(--haze-duration-normal) var(--haze-ease);
  }

  [data-state='closed'] & {
    animation: haze-sheet-out var(--haze-duration-fast) var(--haze-ease);
  }

  @keyframes haze-sheet-in {
    from {
      transform: translateY(100%);
    }
  }

  @keyframes haze-sheet-out {
    to {
      transform: translateY(100%);
    }
  }
`;

const handle = css`
  width: 2rem;
  height: 0.25rem;
  background: var(--haze-color-border);
  border-radius: var(--haze-radius-full);
  margin: 0 auto var(--haze-space-4);
`;

export default function BottomSheet({
  open: openControl,
  onClose,
  viewTransition = false,
  children,
  className,
  ref,
  ...rest
}: BottomSheetProps) {
  const [open, setOpen] = useControl(openControl, false);
  // open/close 翻转的统一出口：viewTransition 开启时每次翻转包在
  // document.startViewTransition(() => flushSync(...)) 里（不支持或
  // reduce 偏好时退化为直接 setOpen）。
  const flipOpen = useViewTransitionFlip(viewTransition, setOpen);
  const openerRef = useRef<HTMLElement | null>(null);
  // Opener capture for the imperative handle's focusTrigger(). Declared
  // BEFORE useFocusScope on purpose: effects run in declaration order,
  // and the scope's effect is what moves focus into the sheet —
  // capturing later would record the sheet itself. This mirrors the
  // element the scope restores focus to on close.
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement ? active : null;
  }, [open]);
  const setScope = useFocusScope({ enabled: open, trapped: true });

  const handleClose = useCallback(() => {
    flipOpen(false);
    onClose?.();
  }, [flipOpen, onClose]);

  // Imperative surface: `ref.current?.open()/close()/focusTrigger()`.
  // close shares handleClose with the overlay-click and Escape paths —
  // the single exit every consumer of onClose sees.
  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        flipOpen(true);
      },
      close: handleClose,
      focusTrigger: () => {
        const target = openerRef.current;
        if (target?.isConnected) target.focus();
      },
    }),
    [flipOpen, handleClose]
  );

  return (
    <Presence present={open}>
      <div
        x-class={[overlay, className]}
        onClick={() => {
          // 退场期间（已 setOpen(false)、Presence 尚未卸载）不再重复关闭
          if (open) handleClose();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) handleClose();
        }}
      >
        <div
          ref={setScope}
          role="dialog"
          aria-modal="true"
          x-class={[sheet]}
          {...rest}
          onClick={(e) => e.stopPropagation()}
        >
          <div x-class={[handle]} />
          {children}
        </div>
      </div>
    </Presence>
  );
}

export type { BottomSheetProps, BottomSheetHandle };
