import { memo, useState, useEffect, useRef } from 'react';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type StreamingTextProps = {
  text: string;
  speed?: number;
  /**
   * How often (ms) the screen-reader live region picks up a new snapshot
   * of the streamed text. Everything streamed in between stays silent:
   * announcing per character would restart the reader's utterance on
   * every tick, so the throttle is the point, not an optimization.
   */
  announceInterval?: number;
  onComplete?: () => void;
  showCursor?: boolean;
  className?: string;
};

/** Default live-region cadence: one announcement per ~1.2s of streaming. */
const ANNOUNCE_INTERVAL_DEFAULT = 1200;

const wrapper = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  color: var(--haze-color-text);
  white-space: pre-wrap;
`;

const cursor = css`
  display: inline-block;
  width: 0.5em;
  height: 1em;
  background: var(--haze-color-primary);
  margin-inline-start: 1px;
  vertical-align: text-bottom;
  animation: blink 1s step-end infinite;

  /* WCAG 2.3.3: the blink loop period is a literal on purpose (the
     motion tokens model transition durations, not multi-second cycles),
     so reduced-motion needs this explicit collapse. A single 0.01ms
     iteration settles the caret at its base opacity 1 — a solid,
     non-blinking cursor. */
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }
`;

// Visually hidden but exposed to assistive tech (the clip pattern from
// the WCAG tutorials). Deliberately token-free: this is not a visual
// surface, it only has to be removed from the layout entirely.
const srOnly = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

// Hard cap so a wall of text without newlines still gets a bounded active
// tail instead of one ever-growing chunk.
const CHUNK_MAX = 512;

type StreamChunks = { finalized: string[]; tail: string };

// Append one streamed character; a chunk finalizes at line boundaries (or
// the cap) and never changes again — that is what makes it memoizable.
function appendStreamChar(state: StreamChunks, ch: string) {
  const tail = state.tail + ch;
  if (ch === '\n' || tail.length >= CHUNK_MAX) {
    state.finalized = [...state.finalized, tail];
    state.tail = '';
  } else {
    state.tail = tail;
  }
}

function rebuildChunks(displayed: string): StreamChunks {
  const state: StreamChunks = { finalized: [], tail: '' };
  for (const ch of displayed) appendStreamChar(state, ch);
  return state;
}

// Memoized on the text value: finalized chunks bail out of re-rendering,
// so per tick only the active tail chunk re-renders.
const TextChunk = memo(function TextChunk({ text }: { text: string }) {
  return <span>{text}</span>;
});

export default function StreamingText({
  text,
  speed = 20,
  announceInterval = ANNOUNCE_INTERVAL_DEFAULT,
  onComplete,
  showCursor = true,
  className,
}: StreamingTextProps) {
  const strings = useStrings('streamingText');
  // `displayed` is the single source of truth (always a prefix of `text`);
  // completion derives from it instead of a render-read ref.
  const [displayed, setDisplayed] = useState('');
  // Guards onComplete to fire exactly once per completed stream, even when
  // the effect re-runs from an unstable `onComplete` identity.
  const doneRef = useRef(false);
  // Screen-reader mirror of the stream: `announced` holds what the live
  // region currently says — '' before the stream cues, a throttled
  // snapshot while streaming, the full text once complete.
  const [announced, setAnnounced] = useState('');
  // Latest-value mirror of `displayed` for the announcement timer, which
  // fires long after the render that armed it (assigned in an effect so
  // no ref is written during render).
  const displayedRef = useRef('');
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chunk bookkeeping mirrors `displayed` exactly
  // (`finalized.join('') + tail === displayed`): the tick below appends
  // incrementally, and any drift — e.g. the stream reset just below, or a
  // discarded concurrent render — self-heals via a full rebuild. The
  // rebuild is idempotent, so adjusting during render is safe.
  const chunksRef = useRef<StreamChunks>({ finalized: [], tail: '' });
  const covered =
    chunksRef.current.tail.length +
    chunksRef.current.finalized.reduce((sum, chunk) => sum + chunk.length, 0);
  if (covered !== displayed.length) {
    chunksRef.current = rebuildChunks(displayed);
  }
  const { finalized, tail } = chunksRef.current;
  const chunks = tail ? [...finalized, tail] : finalized;

  // New text restarts the stream — adjust state during render (the
  // React-endorsed reset pattern) so no frame shows the stale text.
  const [prevText, setPrevText] = useState(text);
  if (text !== prevText) {
    setPrevText(text);
    setDisplayed('');
    setAnnounced('');
  }

  const isDone = displayed.length >= text.length;

  useEffect(() => {
    displayedRef.current = displayed;
  }, [displayed]);

  useEffect(() => {
    if (isDone) {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete?.();
      }
      return;
    }
    doneRef.current = false;
    const timer = setTimeout(() => {
      // Keep chunk state in lockstep with `displayed` as it grows by one.
      appendStreamChar(chunksRef.current, text.charAt(displayed.length));
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [isDone, displayed, text, speed, onComplete]);

  // Screen-reader announcements. The visible per-character render is
  // silent to assistive technology — a plain text mutation carries no
  // live semantics, so a streaming answer would only be discovered when
  // focus happens to land on it. The hidden role='status' region fixes
  // that with three utterances: a "Generating" cue as the stream starts,
  // a fresh snapshot at most once per announceInterval, and the complete
  // text exactly once at completion.
  useEffect(() => {
    if (isDone || announceTimerRef.current !== null) return;
    if (announced === '') {
      // Cue the start before the first throttled snapshot lands — a
      // state write, not initial content, so it is a real mutation the
      // live region announces (content present at mount is not).
      setAnnounced(strings.generating);
    }
    const timer = setTimeout(() => {
      announceTimerRef.current = null;
      setAnnounced(displayedRef.current);
    }, announceInterval);
    announceTimerRef.current = timer;
  }, [displayed, isDone, announced, announceInterval, strings.generating]);

  // Completion: cancel any pending snapshot and announce the final text
  // once. `announced === text` makes the write a no-op when the last
  // snapshot already covered everything, so nothing is said twice.
  useEffect(() => {
    if (!isDone) return;
    if (announceTimerRef.current !== null) {
      clearTimeout(announceTimerRef.current);
      announceTimerRef.current = null;
    }
    setAnnounced(text);
  }, [isDone, text]);

  // Never leave an armed announcement timer behind on unmount.
  useEffect(
    () => () => {
      if (announceTimerRef.current !== null) {
        clearTimeout(announceTimerRef.current);
      }
    },
    [],
  );

  return (
    <span data-slot='streaming-text' x-class={[wrapper, className]}>
      <span data-slot='live-region' role='status' x-class={[srOnly]}>
        {announced}
      </span>
      {/* aria-busy marks the mutating content area, deliberately NOT the
          root: the live region must stay outside any aria-busy subtree,
          or assistive tech may defer its announcements until the busy
          flag clears — which would silence the snapshots this component
          exists to deliver. */}
      <span
        data-slot='content'
        aria-busy={isDone ? undefined : true}
      >
        {chunks.map((chunk, i) => (
          <TextChunk key={i} text={chunk} />
        ))}
        {showCursor && !isDone && <span data-slot='caret' x-class={[cursor]} />}
      </span>
    </span>
  );
}

export type { StreamingTextProps };
