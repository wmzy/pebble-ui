import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type ApprovalCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  onApprove?: () => void;
  onDeny?: () => void;
  approveText?: string;
  denyText?: string;
  children?: ReactNode;
  className?: string;
};

const card = css`
  border: 1px solid var(--haze-color-warning);
  border-radius: var(--haze-radius-md);
  overflow: hidden;
  font-family: var(--haze-font-sans);
  background: var(--haze-color-bg);
`;

const header = css`
  padding: var(--haze-space-3) var(--haze-space-4);
  background: var(--haze-color-warning-subtle);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text);
`;

const body = css`
  padding: var(--haze-space-3) var(--haze-space-4);
`;

const desc = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  margin-bottom: var(--haze-space-3);
`;

const content = css`
  margin-bottom: var(--haze-space-3);
`;

const actions = css`
  display: flex;
  gap: var(--haze-space-2);
  padding: var(--haze-space-3) var(--haze-space-4);
  border-top: 1px solid var(--haze-color-border);
`;

const btn = css`
  flex: 1;
  padding: var(--haze-space-2) var(--haze-space-4);
  border-radius: var(--haze-radius-md);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  font-weight: var(--haze-weight-medium);
  cursor: pointer;
  transition: background var(--haze-duration-fast);
`;

const denyBtn = css`
  background: var(--haze-color-bg);
  border: 1px solid var(--haze-color-border);
  color: var(--haze-color-text);

  &:hover {
    background: var(--haze-color-bg-muted);
  }
`;

const approveBtn = css`
  background: var(--haze-color-primary);
  border: 1px solid var(--haze-color-primary);
  color: var(--haze-color-bg);

  &:hover {
    opacity: 0.9;
  }
`;

export default function ApprovalCard({
  title,
  description,
  onApprove,
  onDeny,
  approveText,
  denyText,
  children,
  className,
}: ApprovalCardProps) {
  const strings = useStrings('approvalCard');
  const titleLabel = title ?? strings.title;
  const approveLabel = approveText ?? strings.approve;
  const denyLabel = denyText ?? strings.deny;
  return (
    <div data-slot='approval-card' x-class={[card, className]}>
      <div data-slot='title' x-class={[header]}>{titleLabel}</div>
      <div data-slot='body' x-class={[body]}>
        {description && <div data-slot='description' x-class={[desc]}>{description}</div>}
        {children && <div data-slot='content' x-class={[content]}>{children}</div>}
      </div>
      <div data-slot='actions' x-class={[actions]}>
        <button data-slot='deny-button' x-class={[btn, denyBtn]} type="button" onClick={onDeny}>
          {denyLabel}
        </button>
        <button data-slot='approve-button' x-class={[btn, approveBtn]} type="button" onClick={onApprove}>
          {approveLabel}
        </button>
      </div>
    </div>
  );
}

export type { ApprovalCardProps };
