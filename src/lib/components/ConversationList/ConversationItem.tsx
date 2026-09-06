import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type ConversationItemProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  end?: ReactNode;
  className?: string;
};

const item = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  padding: var(--haze-space-3) var(--haze-space-4);
  cursor: pointer;
  border-radius: var(--haze-radius-md);
  transition: background 0.15s;
  text-align: start;
  width: 100%;
  border: none;
  background: none;
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);

  &:hover {
    background: var(--haze-color-bg-muted);
  }
`;

const activeItem = css`
  background: var(--haze-color-bg-muted);
`;

const body = css`
  flex: 1;
  min-width: 0;
`;

const titleStyle = css`
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const subtitleStyle = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: var(--haze-space-0);
`;

const endSlot = css`
  flex-shrink: 0;
`;

export default function ConversationItem({
  title,
  subtitle,
  active,
  onClick,
  end,
  className,
}: ConversationItemProps) {
  return (
    <button
      x-class={[item, active && activeItem, className]}
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
    >
      <div x-class={[body]}>
        <div x-class={[titleStyle]}>{title}</div>
        {subtitle && <div x-class={[subtitleStyle]}>{subtitle}</div>}
      </div>
      {end && <div x-class={[endSlot]}>{end}</div>}
    </button>
  );
}

export type { ConversationItemProps };
