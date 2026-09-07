import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';

type AlertProps = {
  visible?: ControlOrValue<boolean>;
  onClose?: () => void;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  closable?: boolean;
  className?: string;
  children: ReactNode;
};

const base = css`
  display: flex;
  align-items: flex-start;
  gap: var(--haze-space-3);
  padding: var(--haze-space-3) var(--haze-space-4);
  border-radius: var(--haze-radius-md);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
`;

const variants = {
  info: css`
    background: var(--haze-color-info-subtle);
    color: var(--haze-color-info);
    border: 1px solid
      color-mix(in srgb, var(--haze-color-info) 25%, transparent);
  `,
  success: css`
    background: var(--haze-color-success-subtle);
    color: var(--haze-color-success);
    border: 1px solid
      color-mix(in srgb, var(--haze-color-success) 25%, transparent);
  `,
  warning: css`
    background: var(--haze-color-warning-subtle);
    color: var(--haze-color-warning);
    border: 1px solid
      color-mix(in srgb, var(--haze-color-warning) 25%, transparent);
  `,
  danger: css`
    background: var(--haze-color-danger-subtle);
    color: var(--haze-color-danger);
    border: 1px solid
      color-mix(in srgb, var(--haze-color-danger) 25%, transparent);
  `,
} as const;

const contentStyle = css`
  flex: 1;
`;

const closeBtn = css`
  appearance: none;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: var(--haze-text-lg);
  line-height: 1;
  opacity: 0.6;
  transition: opacity var(--haze-duration-fast);

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
    border-radius: var(--haze-radius-sm);
  }
`;

export default function Alert({
  visible: visibleControl,
  onClose,
  variant = 'info',
  closable = false,
  className,
  children,
}: AlertProps) {
  const [visible, setVisible] = useControl(visibleControl, true);
  const strings = useStrings('alert');

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div role='alert' x-class={[base, variants[variant], className]}>
      <div className={contentStyle}>{children}</div>
      {closable && (
        <button
          type='button'
          className={closeBtn}
          aria-label={strings.close}
          onClick={handleClose}
        >
          ×
        </button>
      )}
    </div>
  );
}

export type { AlertProps };
