import { useState } from 'react';

import { ConversationList, ConversationItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── ConversationList ─────────────────────────────────────────
export default function ConversationListDemo() {
  const [active, setActive] = useState('chat-1');

  const conversations = [
    { id: 'chat-1', title: 'New Chat', subtitle: 'Start a conversation' },
    { id: 'chat-2', title: 'Project Planning', subtitle: 'Yesterday' },
    { id: 'chat-3', title: 'Code Review', subtitle: '3 days ago' },
    { id: 'chat-4', title: 'Bug Investigation', subtitle: 'Last week' },
  ];

  return (
    <>
      <h1>ConversationList</h1>
      <p className={intro}>
        Sidebar list of conversations with active state and subtitle support.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div
          style={{
            maxWidth: 280,
            border: '1px solid var(--haze-color-border)',
            borderRadius: 'var(--haze-radius-md)',
            overflow: 'hidden',
          }}
        >
          <ConversationList>
            {conversations.map((c) => (
              <ConversationItem
                key={c.id}
                title={c.title}
                subtitle={c.subtitle}
                active={active === c.id}
                onClick={() => setActive(c.id)}
              />
            ))}
          </ConversationList>
        </div>
      </div>

      <div className={section}>
        <h2>ConversationList Props</h2>
        <PropsTable of='ConversationListProps' />
      </div>

      <div className={section}>
        <h2>ConversationItem Props</h2>
        <PropsTable of='ConversationItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Active item has <strong>aria-current=&quot;true&quot;</strong>
            </li>
            <li>
              Items render as <strong>&lt;button&gt;</strong> for keyboard
              accessibility
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='conversationlist' />
    </>
  );
}
