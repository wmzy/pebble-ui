import { useState } from 'react';
import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import { ConversationItem, ConversationList } from '@/lib';

import { intro, page } from '@/views/ComponentDetail/styles';

import { CONVERSATIONS, MODELS } from './mock-script';
import ChatPane from './ChatPane';

const frame = css`
  display: flex;
  height: 660px;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  overflow: hidden;
  background: var(--haze-color-bg);
`;

const side = css`
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-inline-end: 1px solid var(--haze-color-border);
  background: var(--haze-color-bg-subtle);
`;

const sideHead = css`
  padding: var(--haze-space-3) var(--haze-space-4);
  border-bottom: 1px solid var(--haze-color-border);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--haze-color-text-muted);
`;

const convList = css`
  flex: 1;
  padding: var(--haze-space-2);
  gap: var(--haze-space-1);
`;

export default function AIShowcase() {
  const [activeId, setActiveId] = useState(CONVERSATIONS[0]!.id);
  // One control shared by every pane's ModelPicker: switching the model in
  // any conversation retunes all of them (speed + style of the mock run).
  const [modelValue, , modelCtrl] = useControl(undefined, MODELS[1]!.value);
  const model = MODELS.find((m) => m.value === modelValue) ?? MODELS[1]!;

  return (
    <div className={page}>
      <h1>AI Showcase</h1>
      <p className={intro}>
        The AI suite in one scripted conversation — no network, just timers.
        Switch conversations, pick a model to change the mock pacing, expand
        the reasoning transcript, approve or deny the release, and replay it
        all with Reset.
      </p>
      <div className={frame}>
        <aside className={side}>
          <div className={sideHead}>Conversations</div>
          <ConversationList className={convList}>
            {CONVERSATIONS.map((c) => (
              <ConversationItem
                key={c.id}
                title={c.title}
                subtitle={c.subtitle}
                active={c.id === activeId}
                onClick={() => setActiveId(c.id)}
              />
            ))}
          </ConversationList>
        </aside>
        {CONVERSATIONS.map((c) => (
          <ChatPane
            key={c.id}
            script={c}
            model={model}
            modelControl={modelCtrl}
            active={c.id === activeId}
          />
        ))}
      </div>
    </div>
  );
}
