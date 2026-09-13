import { css } from '@linaria/core';

type ContextMenuSeparatorProps = {
  className?: string;
};

const separator = css`
  height: 1px;
  margin: var(--haze-space-1) 0;
  background: var(--haze-color-border);
`;

export default function ContextMenuSeparator({ className }: ContextMenuSeparatorProps) {
  return <div data-slot='separator' x-class={[separator, className]} role="separator" />;
}

export type { ContextMenuSeparatorProps };
