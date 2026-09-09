import type {
  ChatStatusLike,
  UIPartLike,
  UIMessageLike,
  UseChatLike,
} from './ai-chat-adapter';

import { useCallback, useEffect, useRef, useState } from 'react';

// Network-free `useChat` stand-in for the recipe demo: same return shape
// (messages / status / error / sendMessage / append / stop), timer-driven.
// The demo renders it through the very adapter a real `@ai-sdk/react`
// `useChat` would use — the doc code and the running code are one.

let seq = 0;
const uid = (prefix: string): string => `${prefix}-${++seq}`;

/** Matches StreamingText's default reveal cadence (ms per char). */
const REVEAL_MS_PER_CHAR = 20;

const WELCOME: UIMessageLike = {
  id: 'welcome',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      state: 'done',
      text: 'Ask me about haze-ui — for example: "How does haze-ui ship per-component CSS?"',
    },
  ],
};

const CSS_REASONING =
  'The user asks about CSS delivery. haze-ui is a Linaria library — zero runtime — so styles are extracted at build time. The library build emits one CSS file per module, and a split script groups them into per-component subpaths plus an aggregate stylesheet. I should check the docs for the exact loading modes before answering.';

const CSS_ANSWER = `haze-ui ships **two CSS loading modes**:

1. Per-component subpaths — \`import 'haze-ui/css/button'\` pulls only what you mount.
2. The aggregate — \`import 'haze-ui/styles.css'\` covers everything at once.

Both are plain build artifacts (Linaria extracts them at build time, no runtime CSS-in-JS), and a manifest maps every export to its CSS file so tooling never guesses.`;

const GENERIC_REASONING = (question: string): string =>
  `Parsing the request: "${question}". No tool call needed — answer from the component catalog directly, and keep it short.`;

const GENERIC_ANSWER = (question: string): string =>
  `About "${question}" — haze-ui's agent surface is a set of presentational components: ChatContainer owns scrolling, ChatMessage the bubbles, StreamingText the typewriter reveal, ToolCallCard tool input/output, ThinkingIndicator the waiting dots, and ChatInput the composer. Pair them with any runtime; this demo drives them through the same adapter you would use with a real one.`;

const CSS_TOOL_INPUT = (question: string): { query: string } => ({ query: question });

const CSS_TOOL_OUTPUT = {
  files: ['css/loading-modes.md', 'css/manifest.json'],
  loadingModes: 2,
} as const;

const asParts = (value: unknown): UIPartLike[] =>
  Array.isArray(value) ? (value as UIPartLike[]) : [];

/** Immutable part-list operations the script below schedules. */
type Patch = (parts: UIPartLike[]) => UIPartLike[];
const pushPart = (part: UIPartLike): Patch => (parts) => [...parts, part];
const patchPart =
  (index: number, patch: Record<string, unknown>): Patch =>
  (parts) =>
    parts.map((p, i) => (i === index ? { ...p, ...patch } : p));

/**
 * A `useChat`-shaped mock: `sendMessage` appends the user turn, plays a
 * short scripted assistant reply (reasoning → tool → text → source) with
 * `status` walking `submitted → streaming → ready`, and `stop` finalizes
 * the run the way the SDK does — open parts flip to `done`. Ask for an
 * "error" to see the failure path.
 */
export function useMockChat(): UseChatLike {
  const [messages, setMessages] = useState<UIMessageLike[]>([WELCOME]);
  const [status, setStatus] = useState<ChatStatusLike>('ready');
  const [error, setError] = useState<string | undefined>(undefined);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const statusRef = useRef<ChatStatusLike>('ready');
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const runReply = useCallback(
    (question: string) => {
      clearTimers();
      const assistantId = uid('assistant');
      const isCss = /css|style|stylesheet/i.test(question);
      const wantsError = /\b(error|fail|crash)\b/i.test(question);

      const at = (ms: number, patch: Patch) => {
        timers.current.push(
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, parts: patch(asParts(m.parts)) }
                  : m
              )
            );
          }, ms)
        );
      };

      // The assistant message exists before its first part lands — that
      // gap is exactly what the adapter's waiting-dots branch renders.
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', parts: [] }]);
      setStatus('streaming');

      if (wantsError) {
        timers.current.push(
          setTimeout(() => {
            setError('Mock transport error — simulated failure.');
            setStatus('error');
          }, 700)
        );
        return;
      }

      const answer = isCss ? CSS_ANSWER : GENERIC_ANSWER(question);
      const reasoning = isCss ? CSS_REASONING : GENERIC_REASONING(question);
      let nextIndex = 0; // parts are addressed by index — every push claims one
      let atMs = 0;
      /** Schedule a push and return the index the part will land at. */
      const push = (ms: number, part: UIPartLike): number => {
        const index = nextIndex;
        nextIndex += 1;
        at(ms, pushPart(part));
        return index;
      };

      const reasoningIndex = push(atMs, {
        type: 'reasoning',
        text: reasoning,
        state: 'streaming',
      });
      atMs += 900;
      at(atMs, patchPart(reasoningIndex, { state: 'done' }));

      if (isCss) {
        atMs += 100;
        const toolIndex = push(atMs, {
          type: 'tool-searchDocs',
          toolCallId: uid('call'),
          states: ['input-streaming'],
        });
        at(atMs + 350, patchPart(toolIndex, { states: ['input-available'], input: CSS_TOOL_INPUT(question) }));
        atMs += 1500;
        at(atMs, patchPart(toolIndex, {
          states: ['output-available'],
          input: CSS_TOOL_INPUT(question),
          output: CSS_TOOL_OUTPUT,
        }));
        atMs += 200;
      } else {
        atMs += 200;
      }

      // Text arrives whole and streams via its `state` — the shape the
      // adapter maps to StreamingText's one-shot typewriter reveal.
      const textIndex = push(atMs, { type: 'text', text: answer, state: 'streaming' });
      const revealEnd = atMs + answer.length * REVEAL_MS_PER_CHAR + 500;
      at(revealEnd, patchPart(textIndex, { state: 'done' }));
      if (isCss) {
        push(revealEnd + 60, {
          type: 'source',
          source: { sourceType: 'url', url: 'https://wmzy.github.io/haze-ui/', title: 'haze-ui docs' },
        });
      }
      timers.current.push(setTimeout(() => setStatus('ready'), revealEnd + (isCss ? 120 : 0)));
    },
    [clearTimers]
  );

  const sendMessage = useCallback(
    (message: unknown) => {
      const m = message as { text?: unknown; content?: unknown };
      const raw = typeof m.text === 'string' ? m.text : m.content;
      const trimmed = (typeof raw === 'string' ? raw : '').trim();
      if (!trimmed || statusRef.current === 'submitted' || statusRef.current === 'streaming') {
        return;
      }
      setError(undefined);
      setMessages((prev) => [
        ...prev,
        { id: uid('user'), role: 'user', parts: [{ type: 'text', text: trimmed }] },
      ]);
      setStatus('submitted');
      timers.current.push(setTimeout(() => runReply(trimmed), 600));
    },
    [runReply]
  );

  const append = useCallback((message: unknown) => sendMessage(message), [sendMessage]);

  const stop = useCallback(() => {
    clearTimers();
    if (statusRef.current !== 'streaming' && statusRef.current !== 'submitted') return;
    // Finalize like the SDK does on abort: open parts close, run ends.
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        parts: asParts(m.parts).map((p) =>
          p.state === 'streaming' ? { ...p, state: 'done' } : p
        ),
      }))
    );
    setStatus('ready');
  }, [clearTimers]);

  return { messages, status, error, sendMessage, append, stop };
}
