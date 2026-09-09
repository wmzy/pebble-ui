import type { ReactNode } from 'react';
import type { ToolCallStatus } from '@/lib';

import { useCallback, useMemo } from 'react';
import { css } from '@linaria/core';

import {
  ChatMessage,
  Disclosure,
  StreamingText,
  ThinkingIndicator,
  ToolCallCard,
} from '@/lib';

// ─── Duck-typed `useChat` shapes ────────────────────────────────────────
//
// The `ai` / `@ai-sdk/react` packages are NOT dependencies here. These are
// the minimal structural types a real `useChat` return value satisfies:
// every field except `type` is `unknown` and narrowed at runtime, so parts
// from any SDK version — or hand-built fixtures like the mock in this
// recipe — slot in without imports. The senders are declared as methods
// with `this: void`: method parameters check bivariantly, so the SDK's
// narrower `sendMessage(message: { text: string } | …)` still assigns to
// the `(message: unknown)` slot below.

export type ChatStatusLike = 'submitted' | 'streaming' | 'ready' | 'error';

/** Structural slice of the AI SDK's `UIMessagePart` union. */
export type UIPartLike = {
  type: string;
  text?: unknown; // 'text' | 'reasoning'
  state?: unknown; // 'streaming' | 'done' (text / reasoning parts)
  toolCallId?: unknown; // 'tool-call' | 'tool-result' | `tool-${string}`
  toolName?: unknown; // v4 'tool-call'
  args?: unknown; // v4 'tool-call'
  result?: unknown; // v4 'tool-result'
  isError?: unknown; // v4 'tool-result' convention
  input?: unknown; // v5 `tool-${string}`
  output?: unknown; // v5 `tool-${string}`
  states?: unknown; // v5 `tool-${string}` — e.g. ['output-available']
  source?: unknown; // 'source' — { url, title, … }
};

/** Structural slice of the AI SDK's `UIMessage`. */
export type UIMessageLike = {
  id?: unknown;
  role?: unknown; // 'system' | 'user' | 'assistant'
  parts?: unknown; // UIPartLike[]
};

/** Structural slice of `useChat`'s return value the adapter consumes. */
export type UseChatLike = {
  messages?: unknown;
  status?: unknown;
  error?: unknown;
  // `this: void` keeps the methods detachable (lint) and the params
  // bivariant (typecheck), so the SDK's narrower sender signatures still
  // assign to these slots.
  sendMessage?(this: void, message: unknown): unknown; // v5 sender
  append?(this: void, message: unknown): unknown; // v4 sender
  stop?(this: void): void;
};

// ─── Tolerance helpers ─────────────────────────────────────────────────

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * JSON value → display text for ToolCallCard panels: strings pass through,
 * structures pretty-print, anything unserializable (circular objects)
 * degrades to a placeholder instead of throwing.
 */
function toDisplay(value: unknown): string | undefined {
  if (value === undefined || value === null || typeof value === 'function') {
    return undefined;
  }
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  ) {
    return value.toString();
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '[unserializable]';
  }
}

// ─── Tool parts → ToolCallCard view ────────────────────────────────────

type ToolCardView = {
  name: string;
  input?: string;
  output?: string;
  status: ToolCallStatus;
};

/**
 * One part → one card view. v5 embeds the tool name in the part type
 * (`tool-getWeather`) and tracks lifecycle in `states`; v4 splits a call
 * across `tool-call` (name + args) and `tool-result` (matched by
 * `toolCallId`) — the result is folded into the call's card, and an
 * unmatched call stays `running` until its result lands.
 */
function toolCardView(
  part: UIPartLike,
  resultsByCallId: Map<string, UIPartLike>,
  callIds: Set<string>
): ToolCardView | null {
  if (part.type === 'tool-call') {
    const callId = asString(part.toolCallId);
    const result = callId ? resultsByCallId.get(callId) : undefined;
    return {
      name: asString(part.toolName) || 'tool',
      input: toDisplay(part.args),
      output: toDisplay(result?.result),
      status: result ? (result.isError === true ? 'error' : 'done') : 'running',
    };
  }
  if (part.type === 'tool-result') {
    const callId = asString(part.toolCallId);
    // Its call renders the pair — skip the standalone card.
    if (callId && callIds.has(callId)) return null;
    return {
      name: asString(part.toolName) || 'tool',
      output: toDisplay(part.result),
      status: part.isError === true ? 'error' : 'done',
    };
  }
  // v5 `tool-<name>`
  const states = asArray(part.states).filter((s): s is string => typeof s === 'string');
  const status: ToolCallStatus = states.includes('output-error')
    ? 'error'
    : states.includes('output-available')
      ? 'done'
      : states.length > 0
        ? 'running'
        : 'pending';
  return {
    name: part.type.slice('tool-'.length) || 'tool',
    input: toDisplay(part.input),
    output: toDisplay(part.output),
    status,
  };
}

// ─── Part rendering ────────────────────────────────────────────────────

const textBody = css`
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  white-space: pre-wrap;
`;

const reasoningBody = css`
  margin: 0;
  white-space: pre-wrap;
`;

const sourceLink = css`
  display: inline-block;
  font-size: var(--haze-text-sm);
  color: var(--haze-color-primary);
  text-decoration: underline;
`;

type PartRender = {
  key: string;
  /** True while this message is the last one and the run is in flight. */
  live: boolean;
  resultsByCallId: Map<string, UIPartLike>;
  callIds: Set<string>;
};

function renderPart(part: UIPartLike, opts: PartRender): ReactNode {
  const { key, live } = opts;

  // Text — `StreamingText` typewrites the part while it streams; note it
  // restarts its reveal whenever `text` grows, so it fits parts that
  // arrive whole (batched transports / final flushes). For char-by-char
  // streams render the plain block instead — see the recipe's limits.
  if (part.type === 'text') {
    const text = asString(part.text);
    if (!text) return null;
    return live && part.state === 'streaming' ? (
      <StreamingText key={key} text={text} />
    ) : (
      <div key={key} className={textBody}>
        {text}
      </div>
    );
  }

  // Reasoning — dots while the model thinks, transcript once it lands.
  if (part.type === 'reasoning') {
    if (live && part.state === 'streaming') {
      return <ThinkingIndicator key={key} />;
    }
    const text = asString(part.text);
    if (!text) return null;
    return (
      <Disclosure key={key} summary='Thought process'>
        <p className={reasoningBody}>{text}</p>
      </Disclosure>
    );
  }

  // Tools — every `tool-*` type maps to one ToolCallCard.
  if (part.type.startsWith('tool-')) {
    const view = toolCardView(part, opts.resultsByCallId, opts.callIds);
    if (!view) return null;
    return <ToolCallCard key={key} {...view} />;
  }

  // Sources — a plain link (no dedicated card component).
  if (part.type === 'source') {
    const source = part.source;
    const url = isObject(source) && typeof source.url === 'string' ? source.url : '';
    if (!url) return null;
    const title =
      isObject(source) && asString(source.title) ? asString(source.title) : url;
    return (
      <a key={key} className={sourceLink} href={url} target='_blank' rel='noreferrer'>
        {title}
      </a>
    );
  }

  // Unknown part types (step-start, data-*, file, …) are skipped.
  return null;
}

// ─── messages → ReactNode[] ────────────────────────────────────────────

/**
 * Pure mapping from a `useChat`-shaped object to nodes the agent
 * components render directly:
 *
 * - message        → `ChatMessage` bubble (role, user send status)
 * - text part      → plain block, or `StreamingText` while it streams
 * - reasoning part → `ThinkingIndicator`, then a `Disclosure` transcript
 * - tool part      → `ToolCallCard` (v5 `states`, v4 call/result folded)
 * - source part    → link
 * - status         → `submitted` appends waiting dots; `error` appends a
 *                    system bubble with the transport error
 *
 * Never throws: non-array/foreign entries and unknown part types are
 * skipped, so a partial or future-shaped payload degrades, not crashes.
 */
export function renderUIMessages(chat: UseChatLike): ReactNode[] {
  const messages = asArray(chat.messages).filter(isObject) as UIMessageLike[];
  const status = chat.status;
  const live = status === 'submitted' || status === 'streaming';
  const nodes: ReactNode[] = [];

  messages.forEach((message, index) => {
    const isLast = index === messages.length - 1;
    const role = message.role === 'user' || message.role === 'system' ? message.role : 'assistant';
    const id = asString(message.id) || `msg-${index}`;
    const parts = asArray(message.parts).filter(isObject) as UIPartLike[];

    // v4 tool results, matched back onto their calls by toolCallId.
    const resultsByCallId = new Map<string, UIPartLike>();
    const callIds = new Set<string>();
    for (const part of parts) {
      const callId = typeof part.toolCallId === 'string' ? part.toolCallId : '';
      if (!callId) continue;
      if (part.type === 'tool-result') resultsByCallId.set(callId, part);
      else if (part.type === 'tool-call') callIds.add(callId);
    }

    const body: ReactNode[] = [];
    parts.forEach((part, partIndex) => {
      const node = renderPart(part, {
        key: `${id}-part-${partIndex}`,
        live: live && isLast,
        resultsByCallId,
        callIds,
      });
      if (node !== null) body.push(node);
    });

    // The optimistic user message is in flight while `submitted`.
    const userStatus =
      role === 'user' && isLast && status === 'submitted'
        ? ('sending' as const)
        : role === 'user'
          ? ('sent' as const)
          : undefined;

    nodes.push(
      <ChatMessage key={id} role={role} status={userStatus}>
        {body.length > 0 ? body : <ThinkingIndicator />}
      </ChatMessage>
    );
  });

  // Waiting for the first assistant token before the message even exists.
  const last = messages[messages.length - 1];
  if (status === 'submitted' && last?.role !== 'assistant') {
    nodes.push(<ThinkingIndicator key='haze-waiting' />);
  }

  // Transport failure → one system-line bubble.
  if (status === 'error') {
    const error = chat.error;
    const message =
      error instanceof Error ? error.message : asString(error) || 'Something went wrong.';
    nodes.push(
      <ChatMessage key='haze-error' role='system'>
        {message}
      </ChatMessage>
    );
  }

  return nodes;
}

// ─── The hook ──────────────────────────────────────────────────────────

/**
 * `useHazeChat(useChat(…))` — renders through {@link renderUIMessages}
 * and wires the sender pair to haze-ui's composer:
 *
 * - `messages` — ready-to-render nodes for `ChatContainer`
 * - `send` — `ChatInput`'s `onSend`, routed to v5 `sendMessage` or v4
 *   `append` (empty input is ignored)
 * - `busy` — `submitted | streaming`, for disabling the composer
 * - `stop` — `ChatInput` + a Stop button while `busy`
 */
export function useHazeChat(chat: UseChatLike): {
  messages: ReactNode[];
  busy: boolean;
  error: boolean;
  send: (text: string) => void;
  stop: () => void;
} {
  const { messages, status, error } = chat;
  const rendered = useMemo(
    () => renderUIMessages({ messages, status, error }),
    [messages, status, error]
  );

  const { sendMessage, append, stop: stopChat } = chat;
  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (sendMessage) sendMessage({ text: trimmed });
      else append?.({ role: 'user', content: trimmed });
    },
    [sendMessage, append]
  );

  const stop = useCallback(() => stopChat?.(), [stopChat]);

  return {
    messages: rendered,
    busy: status === 'submitted' || status === 'streaming',
    error: status === 'error',
    send,
    stop,
  };
}
