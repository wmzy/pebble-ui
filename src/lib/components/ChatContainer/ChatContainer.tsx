import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { useCallback, useEffect, useRef, useState } from 'react';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

/** Distance from the bottom (px) that still counts as "parked at bottom". */
const BOTTOM_THRESHOLD = 40;

type ChatContainerProps = {
  children: ReactNode;
  /**
   * Follow content changes (defaults to `true`): while the reader is
   * parked at the bottom — within ~40px — new content keeps the view
   * glued to the newest message. Scrolling up pauses the follow (the
   * reading position stays put), and content arriving while paused
   * surfaces the jump pill; clicking it returns to the bottom.
   * `false` disables all scroll management (e.g. when an inner
   * VirtualList owns the scrollport).
   */
  autoScroll?: boolean;
  /**
   * Label of the jump pill shown when new content arrives while the
   * reader is scrolled up. Defaults to the `chat.newMessages` string
   * (`"New messages"` in the English pack).
   */
  unreadLabel?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const container = css`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  font-family: var(--haze-font-sans);
  padding: var(--haze-space-4);
  gap: var(--haze-space-1);
`;

const jumpPill = css`
  position: sticky;
  /* Off the content flow's end: pins to the scrollport bottom edge while
     the reader is above it, lands in flow once they reach the end. */
  bottom: var(--haze-space-2);
  z-index: 1;
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-md);
  color: var(--haze-color-primary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  cursor: pointer;
  transition: border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &:hover {
    border-color: var(--haze-color-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

export default function ChatContainer({
  children,
  autoScroll = true,
  unreadLabel,
  className,
  ...rest
}: ChatContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Purely internal UI state (pill visibility) — never a controlled prop.
  const [showJump, setShowJump] = useState(false);
  const atBottomRef = useRef(true);
  const strings = useStrings('chat');

  const jumpToBottom = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    atBottomRef.current = true;
    el.scrollTop = el.scrollHeight;
    setShowJump(false);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !autoScroll) return;
    const distanceFromBottom = () =>
      el.scrollHeight - el.scrollTop - el.clientHeight;
    const onScroll = () => {
      atBottomRef.current = distanceFromBottom() < BOTTOM_THRESHOLD;
      if (atBottomRef.current) setShowJump(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // Anchor to the newest message and treat that as the parked state —
    // the follow only ever pauses after the reader scrolls up.
    atBottomRef.current = true;
    el.scrollTop = el.scrollHeight;
    const observer = new MutationObserver(() => {
      if (atBottomRef.current) el.scrollTop = el.scrollHeight;
      else setShowJump(true);
    });
    observer.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [autoScroll]);

  return (
    <div ref={ref} x-class={[container, className]} {...rest}>
      {children}
      {autoScroll && showJump && (
        <button type='button' x-class={[jumpPill]} onClick={jumpToBottom}>
          <span aria-hidden='true'>&darr;</span>
          {unreadLabel ?? strings.newMessages}
        </button>
      )}
    </div>
  );
}

export type { ChatContainerProps };
