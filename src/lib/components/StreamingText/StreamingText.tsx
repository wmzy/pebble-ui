import { memo, useState, useEffect, useRef } from 'react';
import { css } from '@linaria/core';

type StreamingTextProps = {
  text: string;
  speed?: number;
  onComplete?: () => void;
  showCursor?: boolean;
  className?: string;
};

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
  onComplete,
  showCursor = true,
  className,
}: StreamingTextProps) {
  // `displayed` is the single source of truth (always a prefix of `text`);
  // completion derives from it instead of a render-read ref.
  const [displayed, setDisplayed] = useState('');
  // Guards onComplete to fire exactly once per completed stream, even when
  // the effect re-runs from an unstable `onComplete` identity.
  const doneRef = useRef(false);

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
  }

  const isDone = displayed.length >= text.length;

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

  return (
    <span x-class={[wrapper, className]}>
      {chunks.map((chunk, i) => (
        <TextChunk key={i} text={chunk} />
      ))}
      {showCursor && !isDone && <span x-class={[cursor]} />}
    </span>
  );
}

export type { StreamingTextProps };
