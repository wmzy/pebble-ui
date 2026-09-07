import type { Control } from 'react-use-control';

import type { MockModel, ConversationScript  } from './mock-script';

import type { RunStatus } from './use-chat-run';

import { useEffect, useRef } from 'react';
import { css } from '@linaria/core';
import { RotateCcw } from 'lucide-react';

import {
  Badge,
  Button,
  ChatContainer,
  ChatInput,
  Empty,
  Icon,
  ModelPicker,
  TokenCounter,
} from '@/lib';


import { MODELS } from './mock-script';
import ChatStream from './ChatStream';
import { useChatRun } from './use-chat-run';


const chatPane = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: var(--haze-color-bg);

  /* Inactive panes stay mounted (their runs keep playing) but must leave
   * layout — the class-level display above would otherwise beat the UA's
   * [hidden] { display: none }. */
  &[hidden] {
    display: none;
  }
`;

const chatHeader = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  flex-wrap: wrap;
  padding: var(--haze-space-3) var(--haze-space-4);
  border-bottom: 1px solid var(--haze-color-border);
`;

const modelPick = css`
  width: 220px;
`;

const headerSpacer = css`
  flex: 1;
`;

const tokenBox = css`
  width: 150px;
`;

// ChatContainer owns its scrolling; this class both sizes it as a flex
// child and lets the pane re-anchor to the latest message when the
// conversation becomes visible again (MutationObserver only fires while
// it is on screen).
const scrollHost = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const chatScroll = css`
  flex: 1;
  min-height: 0;
`;

const composer = css`
  border-top: 1px solid var(--haze-color-border);
  padding: var(--haze-space-3);
  background: var(--haze-color-bg);
`;

const emptyState = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const STATUS_META: Record<
  RunStatus,
  { variant: 'default' | 'info' | 'warning' | 'success'; label: string }
> = {
  idle: { variant: 'default', label: 'Ready' },
  running: { variant: 'info', label: 'Generating…' },
  'awaiting-approval': { variant: 'warning', label: 'Needs your approval' },
  done: { variant: 'success', label: 'Complete' },
};

export type ChatPaneProps = {
  script: ConversationScript;
  model: MockModel;
  modelControl: Control<string>;
  active: boolean;
};

export default function ChatPane({
  script,
  model,
  modelControl,
  active,
}: ChatPaneProps) {
  const { items, tokens, status, send, decide, markStreamDone, reset } =
    useChatRun(script, model);

  const scrollHostRef = useRef<HTMLDivElement>(null);

  // Hidden panes keep playing (the assistant keeps working while you read
  // another conversation) — re-anchor to the bottom on re-activation since
  // the auto-scroll observer cannot fire while display:none.
  useEffect(() => {
    if (!active) return;
    const scroller = scrollHostRef.current?.querySelector(`.${chatScroll}`);
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [active]);

  const busy = status === 'running' || status === 'awaiting-approval';
  const statusMeta = STATUS_META[status];
  const placeholder =
    status === 'awaiting-approval'
      ? 'Waiting for your approval above…'
      : status === 'running'
        ? 'Assistant is responding…'
        : script.autoPlay
          ? 'Ask a follow-up…'
          : 'Ask anything — replies are scripted';

  return (
    <section
      className={chatPane}
      aria-label={`Conversation: ${script.title}`}
      hidden={!active}
    >
      <header className={chatHeader}>
        <div className={modelPick}>
          <ModelPicker value={modelControl} options={MODELS} />
        </div>
        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        <div className={headerSpacer} />
        <div className={tokenBox}>
          <TokenCounter used={tokens} max={model.contextTokens} label='Context' />
        </div>
        <Button
          size='sm'
          variant='outline'
          onClick={reset}
          aria-label='Reset conversation and replay'
        >
          <Icon icon={RotateCcw} size='sm' />
          Reset
        </Button>
      </header>
      {items.length === 0 ? (
        <div className={emptyState}>
          <Empty description='Say something — every reply here is scripted, no network involved.' />
        </div>
      ) : (
        <div ref={scrollHostRef} className={scrollHost}>
          <ChatContainer className={chatScroll}>
            <ChatStream
              items={items}
              model={model}
              onStreamDone={markStreamDone}
              onDecide={decide}
            />
          </ChatContainer>
        </div>
      )}
      <div className={composer}>
        <ChatInput
          placeholder={placeholder}
          disabled={busy}
          onSend={send}
        />
      </div>
    </section>
  );
}
