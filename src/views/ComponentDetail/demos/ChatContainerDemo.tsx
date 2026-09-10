
import type { CSSProperties } from 'react';
import type { VirtualListHandle } from '@/lib';

import { useEffect, useMemo, useRef, useState } from 'react';

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
 * tabIndex fixup (VirtualList does not expose it via ref yet). */
const feedScroller = css`
  overscroll-behavior: contain;
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
 * VirtualList `reverse` owns the scrollport over 10k deterministic
 * messages: rows anchor to the bottom edge with the newest first, the
 * viewport parks there on mount and follows appends while the reader is
 * parked; scrolled up, the reading position survives new messages.
 * ChatContainer's autoScroll stays OFF — its MutationObserver would fire
 * on every scroll-driven row swap, and the frame never scrolls anyway.
 */
function ChatVirtualFeedDemo() {
  const [messages, setMessages] = useState<FeedMessage[]>(() =>
    Array.from({ length: FEED_SIZE }, (_, i) => makeFeedMessage(i))
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VirtualListHandle>(null);
  /** Newest-first projection: reverse mode anchors index 0 at the bottom. */
  const items = useMemo(() => [...messages].reverse(), [messages]);

  // Keyboard-scrollable scrollport (arrows/Page keys) — library gap; the
  // VirtualList handle only exposes scrollToIndex, so the element is
  // located by marker class.
  useEffect(() => {
    const el = frameRef.current?.querySelector<HTMLElement>(
      `.${feedScroller}`
    );
    if (el) el.tabIndex = 0;
  }, []);

  const appendNext = () => {
    setMessages((prev) => [...prev, makeFeedMessage(prev.length)]);
  };

  const jumpToLatest = () => {
    // In reverse space index 0 is the newest message at the bottom edge.
    listRef.current?.scrollToIndex(0, 'start');
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
            ref={listRef}
            className={feedScroller}
            reverse
            items={items}
            height={FEED_LIST_HEIGHT}
            itemHeight={FEED_ROW_HEIGHT}
            overscan={FEED_OVERSCAN}
            renderItem={renderRow}
          />
        </ChatContainer>
      </div>
    </>
  );
}

/** Deterministic replies for the follow demo, cycled by arrival count. */
const FOLLOW_SCRIPT = [
  'Following along — new messages glue the view to the bottom.',
  'Scroll up and I will keep arriving without moving your reading position.',
  'While you are up here, the jump pill below is the way back.',
  'Back at the bottom, the follow resumes on its own.',
  'Every arrival is deterministic — the same clicks, the same transcript.',
];

const FOLLOW_INITIAL = 3;

/** The scrollport needs a bounded height — fill the fixed-height frame. */
const followScroller = css`
  height: 100%;
`;

const followFrameStyle: CSSProperties = {
  height: 260,
  border: '1px solid var(--haze-color-border)',
  borderRadius: 'var(--haze-radius-md)',
};

/**
 * The built-in follow: autoScroll (default on) keeps the view glued to
 * the newest message while the reader is parked within ~40px of the
 * bottom; scrolling up pauses the follow and later arrivals surface the
 * jump pill instead of yanking the view.
 */
function ChatFollowDemo() {
  const [count, setCount] = useState(FOLLOW_INITIAL);
  const [autoScroll, setAutoScroll] = useState(true);

  return (
    <>
      <div className={feedToolbar}>
        <Button
          size='sm'
          variant='outline'
          onClick={() => setCount((n) => n + 1)}
        >
          Append reply
        </Button>
        <Button
          size='sm'
          variant='ghost'
          aria-pressed={autoScroll}
          onClick={() => setAutoScroll((on) => !on)}
        >
          autoScroll: {autoScroll ? 'on' : 'off'}
        </Button>
        <span className={feedMeta}>{count} messages</span>
      </div>
      <div style={followFrameStyle}>
        <ChatContainer
          className={followScroller}
          autoScroll={autoScroll}
          unreadLabel='New messages ↓'
        >
          {Array.from({ length: count }, (_, i) => (
            <ChatMessage
              key={i}
              role={i % 2 === 0 ? 'assistant' : 'user'}
              name={i % 2 === 0 ? 'Assistant' : 'You'}
            >
              {i < FOLLOW_INITIAL
                ? `Message ${i + 1} — scroll up, then keep appending.`
                : FOLLOW_SCRIPT[(i - FOLLOW_INITIAL) % FOLLOW_SCRIPT.length]!}
            </ChatMessage>
          ))}
        </ChatContainer>
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
        <h2>Stick-to-bottom follow</h2>
        <ChatFollowDemo />
        <p className={dataTableNote}>
          <strong>Follow, pause, return.</strong> While the reader is parked
          within ~40px of the bottom, every content change keeps the view
          glued to the newest message. Scroll up and the follow pauses — new
          arrivals no longer move the reading position; instead a{' '}
          <em>New messages</em> pill appears (label via{' '}
          <code>unreadLabel</code> or the <code>chat.newMessages</code>{' '}
          string). Clicking it — or scrolling back on your own — dismisses
          the pill and re-arms the follow. Replies cycle a fixed script, so
          the transcript only depends on how many times you append.
        </p>
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
          {FEED_MOUNTED_ROWS} rows mounted. <strong>Reverse mode.</strong> The
          feed renders through <code>VirtualList</code> with{' '}
          <code>reverse</code>: the items are projected newest-first, index 0
          anchors to the scrollport bottom, and the component itself parks
          the viewport there on mount, follows appends while the reader is
          parked, and keeps a scrolled-up reading position as content grows
          upward. <em>Jump to latest</em> is the handle&apos;s{' '}
          <code>scrollToIndex(0, &apos;start&apos;)</code> — in mirror space
          that is the bottom edge. ChatContainer keeps the frame with{' '}
          <code>autoScroll={'{false}'}</code>: its MutationObserver would
          fire on every scroll-driven row swap, and the frame never scrolls
          anyway.
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
              Auto-scroll uses a <strong>MutationObserver</strong> plus a
              passive scroll listener: follow only fires while parked at the
              bottom, so a screen-reader or keyboard user reading history is
              never yanked around
            </li>
            <li>
              The jump pill is a real <strong>&lt;button&gt;</strong> with a
              text label (<code>chat.newMessages</code> string /{' '}
              <code>unreadLabel</code> prop) — keyboard-reachable and
              announced, and it only exists while there is something to jump
              to
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
