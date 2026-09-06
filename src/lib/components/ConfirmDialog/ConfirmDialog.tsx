import type { ReactNode, ComponentPropsWithoutRef  } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';
import { css } from '@linaria/core';
import { useId } from 'react';

import { useFocusScope } from '../../utils/focus-scope';
import { Presence } from '../../utils/presence';
import { useStrings } from '../LocaleProvider';

type ConfirmDialogProps = {
  open?: ControlOrValue<boolean>;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  title?: ReactNode;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title'>;

const overlay = css`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;

  /* Presence 注入的 data-state 驱动 backdrop 与内容各自的进退场 */
  &[data-state='open'] {
    animation: haze-confirm-backdrop-in var(--haze-duration-normal)
      var(--haze-ease);
  }

  &[data-state='closed'] {
    animation: haze-confirm-backdrop-out var(--haze-duration-fast)
      var(--haze-ease);
  }

  @keyframes haze-confirm-backdrop-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-confirm-backdrop-out {
    to {
      opacity: 0;
    }
  }
`;

const dialog = css`
  background: var(--haze-color-bg);
  border-radius: var(--haze-radius-xl);
  padding: var(--haze-space-6);
  box-shadow: var(--haze-shadow-xl);
  max-width: 480px;
  width: 100%;
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);

  /* 退场时长须不大于 overlay 的退场（overlay 卸载即整树消失） */
  [data-state='open'] & {
    animation: haze-confirm-in var(--haze-duration-normal) var(--haze-ease);
  }

  [data-state='closed'] & {
    animation: haze-confirm-out var(--haze-duration-fast) var(--haze-ease);
  }

  @keyframes haze-confirm-in {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
  }

  @keyframes haze-confirm-out {
    to {
      opacity: 0;
      transform: scale(0.97);
    }
  }
`;

const header = css`
  margin-bottom: var(--haze-space-4);
  font-size: var(--haze-text-lg);
  font-weight: var(--haze-weight-semibold);
`;

const body = css`
  margin-bottom: var(--haze-space-6);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  line-height: var(--haze-leading-relaxed);
`;

const footer = css`
  display: flex;
  justify-content: flex-end;
  gap: var(--haze-space-3);
`;

const btn = css`
  padding: var(--haze-space-2) var(--haze-space-4);
  border-radius: var(--haze-radius-md);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  font-weight: var(--haze-weight-medium);
  cursor: pointer;
  transition:
    background var(--haze-duration-fast) var(--haze-ease),
    border-color var(--haze-duration-fast) var(--haze-ease);
`;

const cancelBtn = css`
  background: var(--haze-color-bg);
  border: 1px solid var(--haze-color-border);
  color: var(--haze-color-text);

  &:hover {
    background: var(--haze-color-bg-muted);
  }
`;

const confirmBtn = css`
  background: var(--haze-color-primary);
  border: 1px solid var(--haze-color-primary);
  color: var(--haze-color-bg);

  &:hover {
    opacity: 0.9;
  }
`;

const dangerBtn = css`
  background: var(--haze-color-danger);
  border: 1px solid var(--haze-color-danger);
  color: var(--haze-color-text-inverse);

  &:hover {
    background: var(--haze-color-danger-hover);
    border-color: var(--haze-color-danger-hover);
  }

  &:active {
    background: var(--haze-color-danger-active);
    border-color: var(--haze-color-danger-active);
  }
`;

export default function ConfirmDialog({
  open: openControl,
  onClose,
  onConfirm,
  onCancel,
  title,
  children,
  confirmText,
  cancelText,
  variant = 'default',
  className,
  ...rest
}: ConfirmDialogProps) {
  const [open, setOpen] = useControl(openControl, false);
  const strings = useStrings('confirmDialog');
  const confirmLabel = confirmText ?? strings.confirm;
  const cancelLabel = cancelText ?? strings.cancel;
  const setScope = useFocusScope({ enabled: open, trapped: true });
  // 标题作为 dialog 的可访问名（aria-dialog-name），与 Dialog 同一模式
  const titleId = `haze-confirm-title-${useId()}`;

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    handleClose();
  };

  const handleConfirm = () => {
    onConfirm?.();
    handleClose();
  };

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
          aria-labelledby={title !== undefined ? titleId : undefined}
          x-class={[dialog]}
          {...rest}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div id={titleId} x-class={[header]}>
              {title}
            </div>
          )}
          <div x-class={[body]}>{children}</div>
          <div x-class={[footer]}>
            <button x-class={[btn, cancelBtn]} type="button" onClick={handleCancel}>
              {cancelLabel}
            </button>
            <button x-class={[btn, variant === 'danger' ? dangerBtn : confirmBtn]} type="button" onClick={handleConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Presence>
  );
}

export type { ConfirmDialogProps };
