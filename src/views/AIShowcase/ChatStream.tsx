import type { MockModel } from './mock-script';

import type { ChatItem } from './use-chat-run';

import { useControl } from 'react-use-control';
import { css } from '@linaria/core';
import { Check, ChevronDown, X } from 'lucide-react';

import {
  ApprovalCard,
  Avatar,
  ChatMessage,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Icon,
  MarkdownRenderer,
  StreamingText,
  ThinkingIndicator,
  ToolCallCard,
} from '@/lib';


// Deterministic fake clock — stable timestamps keep the demo (and its
// smoke test) reproducible without dragging Date into the render.
function fakeTime(id: number): string {
  return `09:${String(40 + (id % 20)).padStart(2, '0')}`;
}

const textBody = css`
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

// MarkdownRenderer styles every block it parses but has no table pass of
// its own — demo-side styles for the embedded HTML table in the answer.
const mdAnswer = css`
  & table {
    margin: 0 0 var(--haze-space-3);
    border-collapse: collapse;
    font-size: var(--haze-text-sm);

    & th,
    & td {
      border: 1px solid var(--haze-color-border);
      padding: var(--haze-space-1) var(--haze-space-2);
      text-align: start;
    }

    & th {
      background: var(--haze-color-bg-muted);
      font-weight: var(--haze-weight-medium);
    }

    & td code {
      white-space: nowrap;
    }
  }
`;

const reasoningBody = css`
  margin: 0;
  padding: var(--haze-space-3);
  border-inline-start: 2px solid var(--haze-color-border);
  background: var(--haze-color-bg-subtle);
  border-radius: 0 var(--haze-radius-md) var(--haze-radius-md) 0;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-relaxed);
  color: var(--haze-color-text-secondary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-width: 62ch;
`;

// CollapsibleTrigger renders its own <button>, so the affordance is styled
// here (no nested button) — ghost-like inline trigger.
const thoughtTrigger = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1) var(--haze-space-2);
  margin-inline-start: calc(-1 * var(--haze-space-2));
  border: none;
  border-radius: var(--haze-radius-md);
  background: none;
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);

  &:hover {
    background: var(--haze-color-bg-muted);
    color: var(--haze-color-text-secondary);
  }
`;

const thoughtChevron = css`
  transition: transform var(--haze-duration-fast) var(--haze-ease);
`;

const thoughtChevronOpen = css`
  transform: rotate(180deg);
`;

const approvalWrap = css`
  max-width: 460px;
  margin: var(--haze-space-1) 0;
`;

const decisionStrip = css`
  display: flex;
  align-items: baseline;
  gap: var(--haze-space-2);
  max-width: 460px;
  margin: var(--haze-space-1) 0;
  padding: var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
`;

const decisionApproved = css`
  border-color: var(--haze-color-success);
`;

const decisionDenied = css`
  border-color: var(--haze-color-danger);
`;

const decisionIconApproved = css`
  color: var(--haze-color-success);
`;

const decisionIconDenied = css`
  color: var(--haze-color-danger);
`;

const decisionIcon = css`
  flex-shrink: 0;
  align-self: center;
`;

const decisionTitle = css`
  color: var(--haze-color-text);
  font-weight: var(--haze-weight-medium);
`;

/** Thinking → collapsible reasoning transcript. */
function ReasoningBlock({
  label,
  reasoning,
}: {
  label: string;
  reasoning: string;
}) {
  // One control, two readers: Collapsible's internal trigger writes it,
  // this component reads it to rotate the chevron.
  const [open, , openCtrl] = useControl(undefined, false);
  return (
    <Collapsible open={openCtrl}>
      <CollapsibleTrigger className={thoughtTrigger}>
        {label}
        <Icon
          icon={ChevronDown}
          size='sm'
          className={thoughtChevron}
          x-class={[open && thoughtChevronOpen]}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className={reasoningBody}>{reasoning}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export type ChatStreamProps = {
  items: ChatItem[];
  model: MockModel;
  onStreamDone: (id: number) => void;
  onDecide: (id: number, decision: 'approved' | 'denied') => void;
};

export default function ChatStream({
  items,
  model,
  onStreamDone,
  onDecide,
}: ChatStreamProps) {
  return (
    <>
      {items.map((item) => {
        switch (item.kind) {
          case 'message':
            return (
              <ChatMessage
                key={item.id}
                role={item.role}
                name={item.role === 'user' ? 'You' : model.label}
                timestamp={fakeTime(item.id)}
                status={item.role === 'user' ? 'sent' : undefined}
                avatar={
                  <Avatar size='sm' fallback={item.role === 'user' ? 'YZ' : 'AI'} />
                }
              >
                <div className={textBody}>{item.text}</div>
              </ChatMessage>
            );
          case 'thinking':
            return item.phase === 'active' ? (
              <ThinkingIndicator key={item.id} text={item.label} />
            ) : (
              <ReasoningBlock
                key={item.id}
                label={`Thought for ${item.seconds}s`}
                reasoning={item.reasoning}
              />
            );
          case 'tool':
            return (
              <ToolCallCard
                key={item.id}
                name={item.name}
                input={item.input}
                output={item.output}
                status={item.status}
              />
            );
          case 'approval':
            return item.status === 'pending' ? (
              <div key={item.id} className={approvalWrap}>
                <ApprovalCard
                  title={item.title}
                  description={item.description}
                  approveText='Approve release'
                  denyText='Deny'
                  onApprove={() => onDecide(item.id, 'approved')}
                  onDeny={() => onDecide(item.id, 'denied')}
                >
                  {item.detail}
                </ApprovalCard>
              </div>
            ) : (
              <div
                key={item.id}
                x-class={[
                  decisionStrip,
                  item.status === 'approved' ? decisionApproved : decisionDenied,
                ]}
              >
                <Icon
                  icon={item.status === 'approved' ? Check : X}
                  size='sm'
                  className={decisionIcon}
                  x-class={[
                    item.status === 'approved'
                      ? decisionIconApproved
                      : decisionIconDenied,
                  ]}
                />
                <span>
                  <span className={decisionTitle}>{item.title}</span> —{' '}
                  {item.status === 'approved'
                    ? 'approved by you, proceeding'
                    : 'denied by you, action held'}
                </span>
              </div>
            );
          case 'stream':
            return (
              <ChatMessage
                key={item.id}
                role='assistant'
                name={model.label}
                timestamp={fakeTime(item.id)}
                avatar={<Avatar size='sm' fallback='AI' />}
              >
                <StreamingText
                  text={item.text}
                  speed={model.streamSpeed}
                  showCursor={!item.done}
                  onComplete={() => onStreamDone(item.id)}
                />
              </ChatMessage>
            );
          case 'markdown':
            return (
              <ChatMessage
                key={item.id}
                role='assistant'
                name={model.label}
                timestamp={fakeTime(item.id)}
                avatar={<Avatar size='sm' fallback='AI' />}
              >
                <div className={mdAnswer}>
                  <MarkdownRenderer content={item.content} />
                </div>
              </ChatMessage>
            );
        }
      })}
    </>
  );
}
