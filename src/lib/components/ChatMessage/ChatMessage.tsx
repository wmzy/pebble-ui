import type { ReactNode } from 'react';

import { useRef } from 'react';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';
import { useClipboard } from '../../hooks/useClipboard';

type ChatMessageRole = 'user' | 'assistant' | 'system';

/** Feedback window for the copy success glyph. */
const COPIED_FEEDBACK_MS = 1500;

type ChatMessageProps = {
  role: ChatMessageRole;
  avatar?: ReactNode;
  name?: ReactNode;
  timestamp?: ReactNode;
  status?: 'sending' | 'sent' | 'error';
  /**
   * Opt in to the built-in copy action: a button in the hover/focus
   * reveal bar that copies the message's text content (the bubble's
   * rendered text) and flips to a success glyph for 1.5s.
   */
  copyable?: boolean;
  /**
   * Custom action nodes (retry, edit, branch…) rendered beside the
   * built-in copy button. Providing `actions` alone opts the message
   * into the reveal bar without the copy button.
   */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

const actionsRow = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-1);
  margin-top: var(--haze-space-1);
  /* visibility participates in the transition so the hidden buttons are
     not focusable/clickable while transparent (visibility interpolates
     as a step at the transition's end). */
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--haze-duration-fast) var(--haze-ease),
    visibility var(--haze-duration-fast) var(--haze-ease);

  /* Reveal via an attribute-marked host (Select's clear-button pattern):
     interpolating another Linaria class into a selector compiles to a
     broken bare type selector in the wyw-in-js pipeline. */
  [data-chat-actions]:hover &,
  [data-chat-actions]:focus-within & {
    opacity: 1;
    visibility: visible;
  }
`;

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
  color: var(--haze-color-text-secondary);
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
  color: var(--haze-color-text-secondary);
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
  color: var(--haze-color-text-secondary);
  font-size: var(--haze-text-xs);
  text-align: center;
  padding: var(--haze-space-2);
`;

const statusText = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
  margin-top: var(--haze-space-1);
`;

const statusError = css`
  color: var(--haze-color-danger);
`;

const actionBtn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--haze-space-5);
  height: var(--haze-space-5);
  border: none;
  border-radius: var(--haze-radius-sm);
  background: transparent;
  color: var(--haze-color-text-muted);
  cursor: pointer;
  transition: color var(--haze-duration-fast),
    background-color var(--haze-duration-fast);

  &:hover {
    color: var(--haze-color-text);
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

const actionBtnCopied = css`
  color: var(--haze-color-success);
`;

const roleMap = {
  user: bubbleUser,
  assistant: bubbleAssistant,
  system: bubbleSystem,
};

/** Explicit width/height: a viewBox-only inline svg contributes zero
 * content size in flex containers and collapses to 0×0. */
const CopyGlyph = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
    <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
  </svg>
);

const CheckGlyph = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M20 6 9 17l-5-5' />
  </svg>
);

export default function ChatMessage({
  role,
  avatar,
  name,
  timestamp,
  status,
  copyable = false,
  actions,
  children,
  className,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const strings = useStrings('chatMessage');
  const chatStrings = useStrings('chat');
  const bubbleRef = useRef<HTMLDivElement>(null);
  const { copied, copy } = useClipboard(COPIED_FEEDBACK_MS);
  const showActions = copyable || actions !== undefined;

  const handleCopy = () => {
    void copy(bubbleRef.current?.textContent ?? '');
  };

  return (
    <div
      x-class={[wrapper, isUser && wrapperUser, className]}
      data-chat-actions={showActions ? true : undefined}
    >
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
        <div x-class={[bubble, roleMap[role]]} ref={bubbleRef}>
          {children}
        </div>
        {showActions && (
          <div x-class={[actionsRow]}>
            {copyable && (
              <button
                type='button'
                x-class={[actionBtn, copied && actionBtnCopied]}
                onClick={handleCopy}
                aria-label={chatStrings.copy}
              >
                {copied ? <CheckGlyph /> : <CopyGlyph />}
              </button>
            )}
            {actions}
          </div>
        )}
        {status && (
          <div x-class={[statusText, status === 'error' && statusError]}>
            {status === 'sending' && strings.sending}
            {status === 'sent' && strings.sent}
            {status === 'error' && strings.failedToSend}
          </div>
        )}
      </div>
    </div>
  );
}

export type { ChatMessageProps, ChatMessageRole };
