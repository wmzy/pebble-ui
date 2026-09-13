import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type ConversationListProps = {
  children: ReactNode;
  className?: string;
};

const list = css`
  display: flex;
  flex-direction: column;
  font-family: var(--haze-font-sans);
  overflow-y: auto;
`;

export default function ConversationList({ children, className }: ConversationListProps) {
  return (
    <div data-slot='conversation-list' x-class={[list, className]}>
      {children}
    </div>
  );
}

export type { ConversationListProps };
