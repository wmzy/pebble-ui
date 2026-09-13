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

  /* Forced-colors: the tinted variant backgrounds flatten onto Canvas
     with no border declared — a full-width banner would dissolve into
     the page. A CanvasText boundary keeps the prominent-message
     shape. */
  @media (forced-colors: active) {
    border: 1px solid CanvasText;
  }
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

  /* Forced-colors: the × glyph keeps its CanvasText rendering through
     color:inherit; the UA drops nothing here except a focus ring this
     button never had — give keyboard focus a media-gated Highlight
     outline (normal rendering untouched). */
  @media (forced-colors: active) {
    &:focus-visible {
      outline: 2px solid Highlight;
    }
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
    <div data-slot='banner' x-class={[banner, variants[variant], className]} role="alert">
      <div data-slot='content' x-class={[content]}>{children}</div>
      {onClose && (
        <button data-slot='close' x-class={[closeBtn]} type="button" onClick={handleClose} aria-label={strings.close}>
          x
        </button>
      )}
    </div>
  );
}

export type { BannerProps };
