import { useEffect, useMemo, useState } from 'react';

import type { AgentSubscriber } from '@ag-ui/client';
import { EventType } from '@ag-ui/core';

import {
  ApprovalCard,
  ChatContainer,
  ChatInput,
  ChatMessage,
  StepTimeline,
  StepTimelineItem,
  StreamingText,
  ThinkingIndicator,
  ToolCallCard,
  lightTheme,
  spacing,
  typography,
} from 'haze-ui';
import type { StepStatus, ToolCallStatus } from 'haze-ui';

import { MockAgent, createAgent } from './mockAgent';

/** One committed chat bubble. */
type Bubble = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

/** ToolCallCard view-model accumulated from TOOL_CALL_* events. */
type ToolView = {
  toolCallId: string;
  name: string;
  args: string;
  status: Extract<ToolCallStatus, 'running' | 'done'>;
  output?: string;
};

/** StepTimelineItem view-model accumulated from STEP_* events. */
type StepView = { name: string; status: StepStatus };

/** Payload carried by the mock agent's CUSTOM `approval-required` event. */
type Approval = { toolCallId: string; title: string; description: string };

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default function App() {
  const agent = useMemo(() => createAgent(), []);
  const agentLabel = agent instanceof MockAgent ? 'local MockAgent' : 'HttpAgent';

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepView[]>([]);
  const [tools, setTools] = useState<ToolView[]>([]);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [error, setError] = useState<string | null>(null);

  const failActiveSteps = () =>
    setSteps((prev) =>
      prev.map((s) => (s.status === 'active' ? { ...s, status: 'error' } : s)),
    );

  // AG-UI events → React state. This subscriber is the whole integration:
  // every haze component below is a pure function of these state slices.
  useEffect(() => {
    const subscriber: AgentSubscriber = {
      onRunStartedEvent: () => {
        setThinking(true);
      },
      onTextMessageContentEvent: ({ textMessageBuffer }) => {
        setThinking(false);
        setStreaming(textMessageBuffer);
      },
      onTextMessageEndEvent: ({ textMessageBuffer }) => {
        setBubbles((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', text: textMessageBuffer },
        ]);
        setStreaming(null);
      },
      onStepStartedEvent: ({ event }) => {
        setSteps((prev) => [...prev, { name: event.stepName, status: 'active' }]);
      },
      onStepFinishedEvent: ({ event }) => {
        setSteps((prev) =>
          prev.map((s) => (s.name === event.stepName ? { ...s, status: 'done' } : s)),
        );
      },
      onToolCallStartEvent: ({ event }) => {
        setTools((prev) => [
          ...prev,
          { toolCallId: event.toolCallId, name: event.toolCallName, args: '', status: 'running' },
        ]);
      },
      onToolCallArgsEvent: ({ event, toolCallBuffer }) => {
        setTools((prev) =>
          prev.map((t) =>
            t.toolCallId === event.toolCallId ? { ...t, args: toolCallBuffer } : t,
          ),
        );
      },
      onToolCallResultEvent: ({ event }) => {
        setTools((prev) =>
          prev.map((t) =>
            t.toolCallId === event.toolCallId
              ? { ...t, status: 'done', output: event.content }
              : t,
          ),
        );
      },
      onEvent: ({ event }) => {
        if (event.type === EventType.CUSTOM && event.name === 'approval-required') {
          setApproval(event.value as Approval);
        }
      },
      onRunErrorEvent: ({ event }) => {
        setError(event.message);
        setApproval(null);
        setThinking(false);
        setRunning(false);
        failActiveSteps();
      },
      onRunFinishedEvent: () => {
        setThinking(false);
        setRunning(false);
      },
      onRunFailed: ({ error: err }) => {
        setError(err.message);
        setApproval(null);
        setThinking(false);
        setRunning(false);
        failActiveSteps();
      },
    };
    return agent.subscribe(subscriber).unsubscribe;
  }, [agent]);

  const handleSend = (text: string) => {
    setError(null);
    setSteps([]);
    setTools([]);
    setApproval(null);
    setThinking(true);
    setRunning(true);
    setBubbles((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }]);
    agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: text });
    agent
      .runAgent()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setRunning(false);
      });
  };

  const resolveApproval = (approved: boolean) => {
    if (agent instanceof MockAgent) {
      agent.approval$.next(approved);
    }
    setApproval(null);
  };

  return (
    <div className={`${lightTheme} ${spacing} ${typography} page`}>
      <header className='page-header'>
        <h1>haze-ui × AG-UI protocol</h1>
        <p className='muted'>
          Agent: <code>{agentLabel}</code>. The scripted local mock needs no
          backend; set <code>VITE_AGUI_URL</code> (see .env.example) to swap in
          a real <code>HttpAgent</code>.
        </p>
      </header>

      <main className='layout'>
        <section className='chat-pane'>
          <ChatContainer className='chat-scroll'>
            {bubbles.length === 0 && streaming === null && !thinking && (
              <div className='intro muted'>
                Send a message to start an agent run — steps, tool calls and an
                approval gate will appear on the right.
              </div>
            )}
            {bubbles.map((bubble) => (
              <ChatMessage
                key={bubble.id}
                role={bubble.role}
                name={bubble.role === 'assistant' ? 'agent' : 'you'}
              >
                <div className='plain-text'>{bubble.text}</div>
              </ChatMessage>
            ))}
            {streaming !== null && (
              <ChatMessage role='assistant' name='agent'>
                <StreamingText text={streaming} />
              </ChatMessage>
            )}
            {thinking && <ThinkingIndicator />}
          </ChatContainer>

          {error && (
            <div className='error-banner' role='alert'>
              {error}
            </div>
          )}

          <footer className='composer'>
            <ChatInput
              placeholder='Message the agent…'
              disabled={running}
              onSend={handleSend}
            />
          </footer>
        </section>

        <aside className='telemetry'>
          <h2>Run timeline</h2>
          {steps.length > 0 ? (
            <StepTimeline>
              {steps.map((step) => (
                <StepTimelineItem
                  key={step.name}
                  label={step.name}
                  status={step.status}
                />
              ))}
            </StepTimeline>
          ) : (
            <p className='muted small'>STEP_STARTED / STEP_FINISHED land here.</p>
          )}

          <h2>Tool calls</h2>
          {tools.length > 0 ? (
            tools.map((tool) => (
              <ToolCallCard
                key={tool.toolCallId}
                name={tool.name}
                status={tool.status}
                input={
                  tool.args ? <pre className='json'>{prettyJson(tool.args)}</pre> : undefined
                }
                output={
                  tool.output !== undefined ? (
                    <pre className='json'>{prettyJson(tool.output)}</pre>
                  ) : undefined
                }
              />
            ))
          ) : (
            <p className='muted small'>TOOL_CALL_* events land here.</p>
          )}

          {approval && (
            <ApprovalCard
              title={approval.title}
              description={approval.description}
              approveText='Approve write'
              denyText='Deny'
              onApprove={() => resolveApproval(true)}
              onDeny={() => resolveApproval(false)}
            />
          )}
        </aside>
      </main>
    </div>
  );
}
