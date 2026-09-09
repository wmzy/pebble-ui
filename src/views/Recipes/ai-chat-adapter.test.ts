import type { ReactElement, ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { expect } from 'vitest';

import {
  ChatMessage,
  Disclosure,
  StreamingText,
  ThinkingIndicator,
  ToolCallCard,
} from '@/lib';

import { renderUIMessages, useHazeChat } from './ai-chat-adapter';

// ─── fixtures ──────────────────────────────────────────────────────────

const text = (t: string, state?: 'streaming' | 'done') => ({
  type: 'text',
  text: t,
  ...(state ? { state } : {}),
});
const msg = (role: string, parts: unknown[], id = `m-${role}`) => ({ id, role, parts });

/** React 19 types element props as `unknown` — assert through a loose record. */
type El = ReactElement<Record<string, unknown>>;
const el = (node: ReactNode): El => node as El;
/** First child element of a rendered ChatMessage's children. */
const firstBody = (messageNode: ReactNode): El => {
  const children = el(messageNode).props.children as ReactNode;
  return el((Array.isArray(children) ? children[0] : children) as ReactNode);
};
const bodyOf = (messageNode: ReactNode): El[] =>
  el(messageNode).props.children as El[];

// ─── text parts → messages ─────────────────────────────────────────────

describe('renderUIMessages', () => {
  it('maps text parts to ChatMessage bubbles with role and content', () => {
    const nodes = renderUIMessages({
      status: 'ready',
      messages: [msg('user', [text('Hello')]), msg('assistant', [text('Hi there', 'done')])],
    });

    expect(nodes).toHaveLength(2);
    const userNode = el(nodes[0]);
    const assistantNode = el(nodes[1]);
    expect(userNode.type).toBe(ChatMessage);
    expect(userNode.props.role).toBe('user');
    expect(firstBody(nodes[0]).props.children).toBe('Hello');
    // settled runs mark user messages as sent
    expect(userNode.props.status).toBe('sent');
    expect(assistantNode.props.role).toBe('assistant');
    expect(firstBody(nodes[1]).props.children).toBe('Hi there');
  });

  it('defaults unknown roles to assistant', () => {
    const nodes = renderUIMessages({
      status: 'ready',
      messages: [msg('tool', [text('??')])],
    });
    expect(el(nodes[0]).props.role).toBe('assistant');
  });

  it('renders the trailing streaming text part through StreamingText, settled parts as plain blocks', () => {
    const streaming = renderUIMessages({
      status: 'streaming',
      messages: [msg('assistant', [text('The answer, typed out', 'streaming')])],
    });
    const streamEl = firstBody(streaming[0]);
    expect(streamEl.type).toBe(StreamingText);
    expect(streamEl.props.text).toBe('The answer, typed out');

    const settled = renderUIMessages({
      status: 'ready',
      messages: [msg('assistant', [text('The answer, typed out', 'streaming')])],
    });
    const plainEl = firstBody(settled[0]);
    expect(plainEl.type).toBe('div');
    expect(plainEl.props.children).toBe('The answer, typed out');
  });

  // ─── tool parts → ToolCallCard ─────────────────────────────────────

  it('maps v5 tool parts to ToolCallCard across the state lifecycle', () => {
    const card = (states: string[], extra: Record<string, unknown> = {}) =>
      firstBody(
        renderUIMessages({
          status: 'streaming',
          messages: [msg('assistant', [{ type: 'tool-getWeather', toolCallId: 'c1', states, ...extra }])],
        })[0]
      );

    expect(card(['input-streaming']).props.status).toBe('running');
    expect(card(['input-available'], { input: { city: 'Oslo' } }).props.status).toBe('running');
    const withInput = card(['input-available'], { input: { city: 'Oslo' } });
    expect(withInput.props.name).toBe('getWeather');
    expect(withInput.props.input).toBe('{\n  "city": "Oslo"\n}');

    const done = card(['output-available'], {
      input: { city: 'Oslo' },
      output: { temp: 21 },
    });
    expect(done.props.status).toBe('done');
    expect(done.props.output).toBe('{\n  "temp": 21\n}');

    expect(card(['output-error']).props.status).toBe('error');
    // unknown/absent states → pending
    expect(card([]).props.status).toBe('pending');
  });

  it('folds a v4 tool-result into its tool-call card, matched by toolCallId', () => {
    const nodes = renderUIMessages({
      status: 'ready',
      messages: [
        msg('assistant', [
          { type: 'tool-call', toolCallId: 'c9', toolName: 'searchDocs', args: { q: 'css' } },
          { type: 'tool-result', toolCallId: 'c9', result: { hits: 3 } },
        ]),
      ],
    });
    const body = bodyOf(nodes[0]);
    expect(body).toHaveLength(1); // two parts, one card
    expect(body[0]!.type).toBe(ToolCallCard);
    expect(body[0]!.props.name).toBe('searchDocs');
    expect(body[0]!.props.input).toContain('"q": "css"');
    expect(body[0]!.props.output).toContain('"hits": 3');
    expect(body[0]!.props.status).toBe('done');
  });

  it('keeps a result-less v4 tool-call running; flags isError results; renders orphan results standalone', () => {
    const pending = renderUIMessages({
      status: 'streaming',
      messages: [msg('assistant', [{ type: 'tool-call', toolCallId: 'c2', toolName: 'run', args: 'ls' }])],
    });
    const pendingCard = firstBody(pending[0]);
    expect(pendingCard.props.status).toBe('running');
    expect(pendingCard.props.input).toBe('ls');
    expect(pendingCard.props.output).toBeUndefined();

    const failed = renderUIMessages({
      status: 'ready',
      messages: [
        msg('assistant', [
          { type: 'tool-call', toolCallId: 'c3', toolName: 'run' },
          { type: 'tool-result', toolCallId: 'c3', result: 'exit 1', isError: true },
        ]),
      ],
    });
    expect(firstBody(failed[0]).props.status).toBe('error');

    const orphan = renderUIMessages({
      status: 'ready',
      messages: [msg('assistant', [{ type: 'tool-result', toolCallId: 'c4', result: 'late' }])],
    });
    const orphanCard = firstBody(orphan[0]);
    expect(orphanCard.type).toBe(ToolCallCard);
    expect(orphanCard.props.output).toBe('late');
    expect(orphanCard.props.status).toBe('done');
  });

  // ─── reasoning → ThinkingIndicator ─────────────────────────────────

  it('shows ThinkingIndicator while reasoning streams, a Disclosure transcript once done', () => {
    const streaming = renderUIMessages({
      status: 'streaming',
      messages: [msg('assistant', [{ type: 'reasoning', text: 'Hmm…', state: 'streaming' }])],
    });
    expect(firstBody(streaming[0]).type).toBe(ThinkingIndicator);

    const done = renderUIMessages({
      status: 'ready',
      messages: [msg('assistant', [{ type: 'reasoning', text: 'Thought it through.', state: 'done' }])],
    });
    const disclosure = firstBody(done[0]);
    expect(disclosure.type).toBe(Disclosure);
    expect(el(disclosure.props.children as ReactNode).props.children).toBe('Thought it through.');
  });

  // ─── status → in-flight presentation ───────────────────────────────

  it('marks the in-flight user message sending and appends waiting dots while submitted', () => {
    const nodes = renderUIMessages({
      status: 'submitted',
      messages: [msg('user', [text('ping')])],
    });
    expect(nodes).toHaveLength(2);
    expect(el(nodes[0]).props.status).toBe('sending');
    expect(el(nodes[1]).type).toBe(ThinkingIndicator);
  });

  it('renders waiting dots inside the bubble for a part-less assistant message', () => {
    const nodes = renderUIMessages({
      status: 'streaming',
      messages: [msg('user', [text('ping')]), msg('assistant', [], 'a0')],
    });
    const assistant = el(nodes[1]);
    expect(assistant.props.role).toBe('assistant');
    expect(el(assistant.props.children as ReactNode).type).toBe(ThinkingIndicator);
  });

  it('renders transport errors as a system bubble', () => {
    const nodes = renderUIMessages({
      status: 'error',
      messages: [msg('user', [text('ping')])],
      error: new Error('socket closed'),
    });
    const last = el(nodes[nodes.length - 1]);
    expect(last.type).toBe(ChatMessage);
    expect(last.props.role).toBe('system');
    expect(last.props.children).toBe('socket closed');

    const fallback = renderUIMessages({ status: 'error', messages: [], error: undefined });
    expect(el(fallback[0]).props.children).toBe('Something went wrong.');
  });

  it('maps source parts to links', () => {
    const nodes = renderUIMessages({
      status: 'ready',
      messages: [
        msg('assistant', [
          { type: 'source', source: { url: 'https://example.com/a', title: 'A doc' } },
        ]),
      ],
    });
    const link = firstBody(nodes[0]);
    expect(link.type).toBe('a');
    expect(link.props.href).toBe('https://example.com/a');
    expect(link.props.children).toBe('A doc');
  });

  // ─── tolerance: empty / malformed / hostile ─────────────────────────

  it('returns no nodes for empty or missing conversations', () => {
    expect(renderUIMessages({})).toEqual([]);
    expect(renderUIMessages({ status: 'ready', messages: [] })).toEqual([]);
    expect(renderUIMessages({ status: 'ready', messages: undefined })).toEqual([]);
  });

  it('tolerates messages without parts and skips unknown part types', () => {
    const nodes = renderUIMessages({
      status: 'ready',
      messages: [
        msg('assistant', [
          { type: 'step-start' },
          { type: 'data-progress', data: { p: 1 } },
          { type: 'file' },
          { type: 'text', text: undefined },
          { type: 'text', text: 42 },
          { type: 'text', text: 'kept' },
        ]),
      ],
    });
    expect(nodes).toHaveLength(1);
    expect(bodyOf(nodes[0])).toHaveLength(1);
    expect(firstBody(nodes[0]).props.children).toBe('kept');
  });

  it('never throws on hostile payloads', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() =>
      renderUIMessages({
        status: 'streaming',
        messages: [
          null,
          7,
          'nope',
          msg('assistant', [
            { type: 'text', text: 42 },
            { type: 'tool-', states: 'not-an-array', input: circular },
            { type: 'tool-call', toolName: 9, args: circular, toolCallId: 1 },
            { type: 'source', source: { title: 'no url' } },
            { type: 'reasoning', text: {} },
            null,
          ]),
        ],
      })
    ).not.toThrow();
  });
});

// ─── useHazeChat hook wiring ────────────────────────────────────────────

describe('useHazeChat', () => {
  it('routes sends through v5 sendMessage, else v4 append, trimming blanks', () => {
    const sendMessage = vi.fn();
    const first = renderHook(() => useHazeChat({ messages: [], status: 'ready', sendMessage }));
    act(() => first.result.current.send('  hello  '));
    expect(sendMessage).toHaveBeenCalledWith({ text: 'hello' });

    const append = vi.fn();
    const second = renderHook(() => useHazeChat({ messages: [], status: 'ready', append }));
    act(() => second.result.current.send('hi'));
    expect(append).toHaveBeenCalledWith({ role: 'user', content: 'hi' });
  });

  it('ignores empty sends, derives busy/error, and passes stop through', () => {
    const sendMessage = vi.fn();
    const stop = vi.fn();
    const { result } = renderHook(() =>
      useHazeChat({ messages: [], status: 'streaming', sendMessage, stop })
    );
    expect(result.current.busy).toBe(true);
    expect(result.current.error).toBe(false);
    act(() => result.current.send('   '));
    expect(sendMessage).not.toHaveBeenCalled();
    act(() => result.current.stop());
    expect(stop).toHaveBeenCalledOnce();

    const failed = renderHook(() => useHazeChat({ messages: [], status: 'error' }));
    expect(failed.result.current.busy).toBe(false);
    expect(failed.result.current.error).toBe(true);
  });

  it('returns ready-to-render nodes that track the conversation', () => {
    const { result, rerender } = renderHook(
      ({ messages }: { messages: unknown }) => useHazeChat({ messages, status: 'ready' }),
      { initialProps: { messages: [msg('user', [text('hello')])] } }
    );
    expect(result.current.messages).toHaveLength(1);
    expect(el(result.current.messages[0]).props.role).toBe('user');

    rerender({ messages: [msg('user', [text('hello')]), msg('assistant', [text('hi')])] });
    expect(result.current.messages).toHaveLength(2);
  });
});
