import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type BannerProps = {
  visible?: ControlOrValue<boolean>;
  onClose?: () => void;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
  className?: string;
};

const banner = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--haze-space-3) var(--haze-space-4);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  border-radius: var(--haze-radius-md);
`;

const variants: Record<string, string> = {
  info: css`
    background: var(--haze-color-info-subtle);
    color: var(--haze-color-info);
  `,
  success: css`
    background: var(--haze-color-success-subtle);
    color: var(--haze-color-success);
  `,
  warning: css`
    background: var(--haze-color-warning-subtle);
    color: var(--haze-color-warning);
  `,
  danger: css`
    background: var(--haze-color-danger-subtle);
    color: var(--haze-color-danger);
  `,
};

const closeBtn = css`
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  font-size: var(--haze-text-lg);
  padding: var(--haze-space-2);
  min-width: 2.5rem;
  min-height: 2.5rem;
  line-height: 1;

  &:hover {
    opacity: 1;
  }
`;

const content = css`
  flex: 1;
`;

export default function Banner({
  visible: visibleControl,
  onClose,
  variant = 'info',
  children,
  className,
}: BannerProps) {
  const [visible, setVisible] = useControl(visibleControl, true);
  const strings = useStrings('banner');

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div x-class={[banner, variants[variant], className]} role="alert">
      <div x-class={[content]}>{children}</div>
      {onClose && (
        <button x-class={[closeBtn]} type="button" onClick={handleClose} aria-label={strings.close}>
          x
        </button>
      )}
    </div>
  );
}

export type { BannerProps };
