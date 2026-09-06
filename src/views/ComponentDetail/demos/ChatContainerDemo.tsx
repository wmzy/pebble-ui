import { useEffect, useRef, useState } from 'react';

import { css } from '@linaria/core';

import { Button, ChatMessage, ChatContainer, VirtualList } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection, dataTableNote, feedToolbar, feedMeta } from './shared';

// ─── ChatContainer × VirtualList — 10k-message feed (recipe) ──
type FeedMessage = {
  role: 'user' | 'assistant' | 'system';
  name: string;
  text: string;
  time: string;
  mono: boolean;
};

const FEED_SIZE = 10000;

const FEED_ROW_HEIGHT = 44;

const FEED_LIST_HEIGHT = 400;

const FEED_OVERSCAN = 8;

/** Distance from the bottom (px) that still counts as "parked at bottom". */
const FEED_BOTTOM_EPSILON = 32;

/** Visible window + both overscan shoulders + the straddling row. */
const FEED_MOUNTED_ROWS =
  Math.ceil(FEED_LIST_HEIGHT / FEED_ROW_HEIGHT) + FEED_OVERSCAN * 2 + 1;

const FEED_WORDS = [
  'virtualize',
  'deterministic',
  'seed',
  'render',
  'scroll',
  'bubble',
  'overscan',
  'token',
  'compose',
  'throttle',
  'pipeline',
  'measure',
  'memoize',
  'stream',
  'commit',
];

const FEED_CODE_LINE =
  'const rows = feed.slice(start, end).map(makeRow); // uniform height keeps the stack cheap';

/**
 * Pure index → message: even = user, odd = assistant, every 11th = system
 * notice. Word count walks a 4 + (index·7 mod 23) gradient, every 97th
 * message is a ~100-word wall, every 131st a long code line, and
 * timestamps advance one minute from 09:00. No Math.random anywhere —
 * every load generates a byte-identical feed.
 */
function makeFeedMessage(index: number): FeedMessage {
  const role: FeedMessage['role'] =
    index % 11 === 3
      ? 'system'
      : index % 2 === 0
        ? 'user'
        : 'assistant';
  const wall = index % 97 === 0;
  const code = index % 131 === 0 && role !== 'system';
  const wordCount = wall ? 104 : code ? 1 : 4 + ((index * 7) % 23);
  const text = code
    ? FEED_CODE_LINE
    : Array.from(
        { length: wordCount },
        (_, w) => FEED_WORDS[(index * 7 + w * 3) % FEED_WORDS.length]
      ).join(' ');
  const minutes = 9 * 60 + index;
  const time = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return {
    role,
    name: role === 'user' ? 'You' : role === 'assistant' ? 'Assistant' : '',
    text,
    time,
    mono: code,
  };
}

const feedFrame = css`
  position: relative;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
`;

/** Marker class: identifies VirtualList's internal scrollport for the
 * bottom-tracking listener (VirtualList does not expose it via ref yet). */
const feedScroller = css`
  overscroll-behavior: contain;
`;

const feedJump = css`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: var(--haze-space-4);
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
  cursor: pointer;

  &:hover {
    border-color: var(--haze-color-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const feedRow = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  height: 100%;
  padding: 0 var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  white-space: nowrap;
  overflow: hidden;
`;

const feedRowUser = css`
  flex-direction: row-reverse;
`;

const feedRowSystem = css`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
`;

const feedAvatar = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--haze-space-6);
  height: var(--haze-space-6);
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-secondary);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
`;

const feedAvatarUser = css`
  background: var(--haze-color-primary);
  color: var(--haze-color-bg);
`;

const feedName = css`
  flex-shrink: 0;
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text);
`;

const feedTime = css`
  flex-shrink: 0;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  font-variant-numeric: tabular-nums;
`;

const feedText = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--haze-color-text-secondary);
`;

const feedTextMono = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
`;

/**
 * ChatContainer frames the conversation (padding, column rhythm) while
 * VirtualList owns the scrollport over 10k deterministic messages.
 * ChatContainer's autoScroll is OFF: its MutationObserver would fire on
 * every scroll-driven row swap, and always-follow is wrong once the
 * reader scrolls up. Stick-to-bottom is this recipe's job instead —
 * follow appends only while parked at the bottom, otherwise surface an
 * "N new messages below" pill.
 */
function ChatVirtualFeedDemo() {
  const [messages, setMessages] = useState<FeedMessage[]>(() =>
    Array.from({ length: FEED_SIZE }, (_, i) => makeFeedMessage(i))
  );
  const [newBelow, setNewBelow] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  /** VirtualList's internal scrollport — located by marker class. */
  const scrollerRef = useRef<HTMLElement | null>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    const el = frameRef.current?.querySelector<HTMLElement>(
      `.${feedScroller}`
    );
    if (!el) return;
    scrollerRef.current = el;
    el.tabIndex = 0; // keyboard-scrollable (arrows/Page keys) — library gap
    const onScroll = () => {
      atBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight <
        FEED_BOTTOM_EPSILON;
      if (atBottomRef.current) setNewBelow(0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.scrollTop = el.scrollHeight; // land on the newest message
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Stick-to-bottom: follow appends only while parked at the bottom.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const appendNext = () => {
    setMessages((prev) => [...prev, makeFeedMessage(prev.length)]);
    if (!atBottomRef.current) setNewBelow((n) => n + 1);
  };

  const jumpToLatest = () => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setNewBelow(0);
  };

  const renderRow = (m: FeedMessage) =>
    m.role === 'system' ? (
      <div className={feedRowSystem} title={m.text}>
        ◇ {m.text}
      </div>
    ) : (
      <div x-class={[feedRow, m.role === 'user' && feedRowUser]} title={m.text}>
        <span
          x-class={[feedAvatar, m.role === 'user' && feedAvatarUser]}
          aria-hidden='true'
        >
          {m.role === 'user' ? 'U' : 'A'}
        </span>
        <span className={feedName}>{m.name}</span>
        <span className={feedTime}>{m.time}</span>
        <span x-class={[feedText, m.mono && feedTextMono]}>{m.text}</span>
      </div>
    );

  return (
    <>
      <div className={feedToolbar}>
        <Button size='sm' variant='outline' onClick={appendNext}>
          Append next message
        </Button>
        <Button size='sm' variant='ghost' onClick={jumpToLatest}>
          Jump to latest
        </Button>
        <span className={feedMeta}>
          {messages.length} messages · ~{FEED_MOUNTED_ROWS} rows mounted
        </span>
      </div>
      <div
        ref={frameRef}
        className={feedFrame}
        role='log'
        aria-label='Virtualized chat feed, newest messages at the bottom'
      >
        <ChatContainer autoScroll={false}>
          <VirtualList
            className={feedScroller}
            items={messages}
            height={FEED_LIST_HEIGHT}
            itemHeight={FEED_ROW_HEIGHT}
            overscan={FEED_OVERSCAN}
            renderItem={renderRow}
          />
        </ChatContainer>
        {newBelow > 0 && (
          <button type='button' className={feedJump} onClick={jumpToLatest}>
            {newBelow} new message{newBelow > 1 ? 's' : ''} below ↓
          </button>
        )}
      </div>
    </>
  );
}

// ─── ChatContainer ────────────────────────────────────────────
export default function ChatContainerDemo() {
  return (
    <>
      <h1>ChatContainer</h1>
      <p className={intro}>
        Auto-scrolling message container that follows new messages as they
        arrive.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div
          style={{
            maxHeight: 200,
            border: '1px solid var(--haze-color-border)',
            borderRadius: 'var(--haze-radius-md)',
          }}
        >
          <ChatContainer>
            <ChatMessage role='assistant'>Welcome! How can I help?</ChatMessage>
            <ChatMessage role='user'>
              Tell me about this component.
            </ChatMessage>
            <ChatMessage role='assistant'>
              ChatContainer automatically scrolls to the bottom when new messages
              are added.
            </ChatMessage>
          </ChatContainer>
        </div>
      </div>

      <div className={section}>
        <h2>10,000 messages — ChatContainer × VirtualList (recipe)</h2>
        <ChatVirtualFeedDemo />
        <p className={dataTableNote}>
          <strong>Data.</strong> <code>makeFeedMessage(index)</code> is pure:
          roles alternate (even user / odd assistant, every 11th a system
          notice), word count follows a 4 + (index·7 mod 23) gradient, every
          97th message is a ~100-word wall and every 131st a long code line,
          and timestamps advance one minute from 09:00 — so the 10,000-message
          feed is identical on every load. <strong>VirtualList pairing.</strong>{' '}
          <code>itemHeight</code> (44) must equal the rendered row height
          exactly — that is why rows clamp to one line with ellipsis;
          variable-height messages would need a measured virtualizer, not
          this absolute-positioned stack. <code>height</code> (400) fixes the
          scrollport, <code>overscan</code> (8) hides the render window
          behind fast scrolls, and the whole feed is a single{' '}
          {FEED_ROW_HEIGHT * FEED_SIZE} px spacer with only ~
          {FEED_MOUNTED_ROWS} rows mounted. ChatContainer keeps the frame
          with <code>autoScroll={'{false}'}</code> — its MutationObserver
          would fire on every scroll-driven row swap, and always-follow is
          wrong once the reader scrolls up — so stick-to-bottom is the
          recipe&apos;s job: a passive scroll listener parks{' '}
          <code>atBottom</code> within {FEED_BOTTOM_EPSILON} px of the end,
          appends scroll only while parked, and otherwise surface the{' '}
          “N new messages below” pill.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ChatContainerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>overflow-y: auto</strong> for scrollable content
            </li>
            <li>
              Auto-scroll uses <strong>MutationObserver</strong> for reliable
              detection
            </li>
            <li>
              The virtualized feed is a <strong>role=&quot;log&quot;</strong>{' '}
              (polite live region) — appends are announced without stealing
              focus. VirtualList does not expose its scrollport, so the
              recipe marks it with a class and sets{' '}
              <strong>tabIndex=&quot;0&quot;</strong> on it for arrow-key
              scrolling; ellipsis is purely visual, the full text stays in
              the DOM for assistive tech
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='chatcontainer' />
    </>
  );
}
