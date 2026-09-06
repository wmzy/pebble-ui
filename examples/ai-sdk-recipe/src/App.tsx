import { useChat } from '@ai-sdk/react';
import type { DynamicToolUIPart, ToolUIPart, UIMessage } from 'ai';

import {
  Button,
  ChatContainer,
  ChatInput,
  ChatMessage,
  StreamingText,
  ThinkingIndicator,
  ToolCallCard,
  lightTheme,
  spacing,
  typography,
} from 'haze-ui';
import type { ToolCallStatus } from 'haze-ui';

/** One entry of UIMessage['parts'], with the SDK's default generics applied. */
type Part = UIMessage['parts'][number];

/** AI SDK tool invocation state → haze-ui ToolCallCard status. */
const toolStatusMap: Record<string, ToolCallStatus> = {
  'input-streaming': 'pending',
  'input-available': 'running',
  'approval-requested': 'pending',
  'approval-responded': 'running',
  'output-available': 'done',
  'output-error': 'error',
  'output-denied': 'error',
};

function jsonBlock(value: unknown) {
  return <pre className='json'>{JSON.stringify(value, null, 2) ?? String(value)}</pre>;
}

function isToolPart(part: Part): part is DynamicToolUIPart | ToolUIPart {
  return part.type === 'dynamic-tool' || part.type.startsWith('tool-');
}

function toolName(part: DynamicToolUIPart | ToolUIPart): string {
  return part.type === 'dynamic-tool' ? part.toolName : part.type.slice('tool-'.length);
}

function MessageParts({ message, streaming }: { message: UIMessage; streaming: boolean }) {
  return (
    <>
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return streaming && part.state === 'streaming' ? (
            <StreamingText key={index} text={part.text} />
          ) : (
            <div key={index} className='plain-text'>
              {part.text}
            </div>
          );
        }

        if (part.type === 'reasoning') {
          // this recipe surfaces live reasoning as the thinking animation;
          // completed reasoning is intentionally collapsed
          return streaming && part.state === 'streaming' ? (
            <ThinkingIndicator key={index} text='Reasoning…' />
          ) : null;
        }

        if (isToolPart(part)) {
          const status = toolStatusMap[part.state] ?? 'pending';
          return (
            <ToolCallCard
              key={index}
              name={toolName(part)}
              status={status}
              input={part.input !== undefined ? jsonBlock(part.input) : undefined}
              output={
                part.state === 'output-available'
                  ? jsonBlock(part.output)
                  : part.state === 'output-error'
                    ? part.errorText
                    : undefined
              }
            />
          );
        }

        // 'step-start', file, source and data-* parts are out of scope here
        return null;
      })}
    </>
  );
}

export default function App() {
  // useChat defaults to POST /api/chat (DefaultChatTransport) — the endpoint
  // this app's vite dev/preview server provides (see vite.config.ts).
  const { messages, sendMessage, status, error, stop, regenerate } = useChat();

  const busy = status === 'submitted' || status === 'streaming';
  const lastMessage = messages[messages.length - 1];
  const streamingLastAssistant =
    status === 'streaming' && lastMessage?.role === 'assistant';
  const awaitingFirstChunk =
    status === 'submitted' ||
    (streamingLastAssistant &&
      !lastMessage.parts.some((p) => p.type === 'text' || isToolPart(p)));

  return (
    <div className={`${lightTheme} ${spacing} ${typography} page`}>
      <header className='page-header'>
        <h1>haze-ui × Vercel AI SDK</h1>
        <p className='muted'>
          <code>useChat</code> streaming into ChatContainer / ChatMessage /
          StreamingText / ToolCallCard. Set <code>OPENAI_API_KEY</code> (see
          .env.example) to talk to a real model.
        </p>
      </header>

      <ChatContainer className='chat-scroll'>
        {messages.length === 0 && (
          <div className='intro muted'>
            Ask anything — assistant text streams via StreamingText, tool calls
            render as ToolCallCard.
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            name={message.role === 'assistant' ? 'agent' : 'you'}
            status={
              message.role === 'user' && status === 'submitted' && message === lastMessage
                ? 'sending'
                : message.role === 'assistant' && status === 'error' && message === lastMessage
                  ? 'error'
                  : undefined
            }
          >
            <MessageParts
              message={message}
              streaming={
                streamingLastAssistant && message === lastMessage ? true : false
              }
            />
          </ChatMessage>
        ))}

        {awaitingFirstChunk && <ThinkingIndicator />}
      </ChatContainer>

      {error && (
        <div className='error-banner' role='alert'>
          {error.message}
        </div>
      )}

      <footer className='composer'>
        <ChatInput
          placeholder='Message the agent…'
          disabled={busy}
          onSend={(text) => {
            void sendMessage({ text });
          }}
        />
        <div className='composer-actions'>
          {busy ? (
            <Button size='sm' variant='outline' onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button
              size='sm'
              variant='outline'
              disabled={messages.length === 0}
              onClick={() => {
                void regenerate();
              }}
            >
              Regenerate
            </Button>
          )}
          <span className='muted status-chip'>status: {status}</span>
        </div>
      </footer>
    </div>
  );
}
