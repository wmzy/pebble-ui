import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type ChatMessageRole = 'user' | 'assistant' | 'system';

type ChatMessageProps = {
  role: ChatMessageRole;
  avatar?: ReactNode;
  name?: ReactNode;
  timestamp?: ReactNode;
  status?: 'sending' | 'sent' | 'error';
  children: ReactNode;
  className?: string;
};

const wrapper = css`
  display: flex;
  gap: var(--haze-space-3);
  font-family: var(--haze-font-sans);
  padding: var(--haze-space-3) 0;
`;

const wrapperUser = css`
  flex-direction: row-reverse;
`;

const avatarSlot = css`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
`;

const body = css`
  max-width: 75%;
  min-width: 0;
`;

const header = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  margin-bottom: var(--haze-space-1);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

const headerUser = css`
  flex-direction: row-reverse;
`;

const bubble = css`
  padding: var(--haze-space-3) var(--haze-space-4);
  border-radius: var(--haze-radius-lg);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  word-break: break-word;
`;

const bubbleUser = css`
  background: var(--haze-color-primary);
  color: var(--haze-color-bg);
  border-end-end-radius: var(--haze-radius-sm);
`;

const bubbleAssistant = css`
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text);
  border-end-start-radius: var(--haze-radius-sm);
`;

const bubbleSystem = css`
  background: transparent;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  text-align: center;
  padding: var(--haze-space-2);
`;

const statusText = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  margin-top: var(--haze-space-1);
`;

const statusError = css`
  color: var(--haze-color-danger);
`;

const roleMap = {
  user: bubbleUser,
  assistant: bubbleAssistant,
  system: bubbleSystem,
};

export default function ChatMessage({
  role,
  avatar,
  name,
  timestamp,
  status,
  children,
  className,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div x-class={[wrapper, isUser && wrapperUser, className]}>
      {role !== 'system' && (
        <div x-class={[avatarSlot]}>
          {avatar || (role === 'user' ? 'U' : 'A')}
        </div>
      )}
      <div x-class={[body]}>
        {(name || timestamp) && (
          <div x-class={[header, isUser && headerUser]}>
            {name && <span>{name}</span>}
            {timestamp && <span>{timestamp}</span>}
          </div>
        )}
        <div x-class={[bubble, roleMap[role]]}>
          {children}
        </div>
        {status && (
          <div x-class={[statusText, status === 'error' && statusError]}>
            {status === 'sending' && 'Sending...'}
            {status === 'sent' && 'Sent'}
            {status === 'error' && 'Failed to send'}
          </div>
        )}
      </div>
    </div>
  );
}

export type { ChatMessageProps, ChatMessageRole };
