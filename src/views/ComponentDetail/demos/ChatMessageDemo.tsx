import { useEffect, useRef, useState } from 'react';

import { useControl } from 'react-use-control';

import { css } from '@linaria/core';

import { Button, TextareaCore, ChatMessage } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection, dataTableMeta, dataTableNote } from './shared';

// ─── ChatMessage — edit / resend / branch (recipe) ────────────
type BranchMessage = {
  id: number;
  role: 'user' | 'assistant';
  name: string;
  time: string;
  text: string;
  /** Canned deterministic rewrites — each resend cycles to the next one. */
  alts?: string[];
};

const INITIAL_CONVERSATION: BranchMessage[] = [
  {
    id: 1,
    role: 'user',
    name: 'You',
    time: '10:00',
    text: 'Should a design system ship its own virtualizer, or wrap a headless core?',
  },
  {
    id: 2,
    role: 'assistant',
    name: 'Assistant',
    time: '10:01',
    text: 'Wrap it. A design system owns tokens and markup, not scroll math — reuse a battle-tested core and spend your budget on theming and a11y.',
    alts: [
      'Ship a thin list. Most consumers need 10k rows, not exotic layouts — one small absolute-positioned renderer keeps the bundle honest.',
      'Both: a tiny built-in for chat-shaped lists, an escape hatch to the headless core for grids and variable heights.',
    ],
  },
  {
    id: 3,
    role: 'user',
    name: 'You',
    time: '10:02',
    text: 'What breaks first if we hand-roll it?',
  },
  {
    id: 4,
    role: 'assistant',
    name: 'Assistant',
    time: '10:03',
    text: 'Edge cases: momentum scrolling on iOS, resize observers, RTL coordinates. That is why this recipe composes instead of rewriting.',
    alts: [
      'Keyboard and screen-reader order. Absolutely-positioned rows leave DOM order alone, but focus management and live regions are on you.',
      'Measurement drift. One rounding error per row and the bottom of a 10k-item list is off by a full screen.',
    ],
  },
];

/** Deterministic continuations handed to new branches, cycled by branch
 * count — the same click sequence always grows the same tree. */
const BRANCH_CONTINUATIONS: Omit<BranchMessage, 'id'>[][] = [
  [
    {
      role: 'user',
      name: 'You',
      time: '10:04',
      text: 'Alright — show me the wrap in three lines.',
    },
    {
      role: 'assistant',
      name: 'Assistant',
      time: '10:05',
      text: 'Core list, themed row, scroll-synced pager. Everything else is product code.',
      alts: [
        'Core list, themed row, bottom-anchored log. Ship the boring version first.',
      ],
    },
  ],
  [
    {
      role: 'user',
      name: 'You',
      time: '10:04',
      text: 'And when the list is a grid instead?',
    },
    {
      role: 'assistant',
      name: 'Assistant',
      time: '10:05',
      text: 'Then the single-column stack stops fitting — keep the tokens, swap the renderer for a windowing core that understands columns.',
      alts: [
        'Then columns need a windowing core; keep the tokens, swap the renderer.',
      ],
    },
  ],
];

/** Fixed delay between reflow steps — deterministic, no network involved. */
const RESEND_STEP_MS = 500;

const branchToolbar = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  flex-wrap: wrap;
  margin-bottom: var(--haze-space-3);
`;

const branchTabs = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg-muted);
`;

const branchTab = css`
  padding: var(--haze-space-0) var(--haze-space-3);
  border: none;
  border-radius: var(--haze-radius-sm);
  background: transparent;
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  cursor: pointer;

  &:hover {
    color: var(--haze-color-text);
  }

  &[aria-pressed='true'] {
    background: var(--haze-color-bg);
    color: var(--haze-color-text);
    box-shadow: var(--haze-shadow-sm);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

const branchList = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  padding: 0 var(--haze-space-3);
  max-width: 640px;
`;

const msgActions = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-1);
  flex-shrink: 0;
  padding-top: var(--haze-space-6);
  opacity: 0;
  transition: opacity var(--haze-duration-fast) var(--haze-ease);
`;

const msgRow = css`
  display: flex;
  align-items: flex-start;
  gap: var(--haze-space-2);

  /* Reveal on hover AND focus-within — Tab reaches the transparent
     buttons, and the row lights up around whichever one is focused. */
  &:hover ${msgActions},
  &:focus-within ${msgActions} {
    opacity: 1;
  }
`;

const msgRowUser = css`
  flex-direction: row-reverse;
`;

const msgGrow = css`
  flex: 1;
  min-width: 0;
`;

const msgEditor = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
`;

const msgEditorButtons = css`
  display: flex;
  gap: var(--haze-space-2);
`;

const msgPending = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);

  i {
    width: 0.35em;
    height: 0.35em;
    border-radius: var(--haze-radius-full);
    background: currentColor;
    animation: msgWorkflowPulse var(--haze-duration-slow)
      var(--haze-ease-in-out) infinite;

    &:nth-child(2) {
      animation-delay: calc(var(--haze-duration-slow) / 3);
    }

    &:nth-child(3) {
      animation-delay: calc(var(--haze-duration-slow) / 1.5);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    i {
      animation: none;
      opacity: 0.4;
    }
  }

  @keyframes msgWorkflowPulse {
    0%,
    100% {
      opacity: 0.35;
    }

    50% {
      opacity: 1;
    }
  }
`;

/**
 * Edit / resend / branch over a plain `branches: BranchMessage[][]` tree —
 * each branch owns a full timeline, so switching branches is just an index
 * swap and edits stay branch-local. The active branch rides a
 * controllable-state control (same pattern as the DataTable recipe).
 */
function ChatMessageWorkflowDemo() {
  const [branches, setBranches] = useState<BranchMessage[][]>([
    INITIAL_CONVERSATION,
  ]);
  const [, , activeCtrl] = useControl(undefined, 0);
  const [active, setActive] = useControl(activeCtrl);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  /** Resend variant counter per assistant message id — cycles `alts`. */
  const [variantPick, setVariantPick] = useState<Record<number, number>>({});
  /** Rows in [from, done] are resolved; rows in (done, end) are pending. */
  const [reflow, setReflow] = useState<{ from: number; done: number } | null>(
    null
  );
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const cancelTransient = () => {
    clearTimers();
    setReflow(null);
    setEditingId(null);
    setDraft('');
  };

  const branch = branches[Math.min(active, branches.length - 1)]!;

  const switchBranch = (index: number) => {
    if (index === active) return;
    cancelTransient();
    setActive(index);
  };

  const startEdit = (m: BranchMessage) => {
    clearTimers();
    setReflow(null);
    setEditingId(m.id);
    // start from the text the reader sees (the current variant, if any)
    setDraft(textOf(m));
  };

  const saveEdit = () => {
    const text = draft.trim();
    if (!text || editingId == null) return;
    setBranches((prev) =>
      prev.map((b, i) =>
        i === active
          ? b.map((m) => (m.id === editingId ? { ...m, text } : m))
          : b
      )
    );
    // the edit supersedes any resend variant — show m.text again
    setVariantPick((picks) => ({ ...picks, [editingId]: 0 }));
    setEditingId(null);
    setDraft('');
  };

  const startResend = (from: number) => {
    clearTimers();
    setEditingId(null);
    setDraft('');
    setReflow({ from, done: from - 1 });
    for (let k = from; k < branch.length; k++) {
      timersRef.current.push(
        setTimeout(() => {
          // A newer resend may have restarted the chain — stale steps die.
          setReflow((r) => (r?.from === from ? { ...r, done: k } : r));
          const message = branch[k]!;
          if (message.role === 'assistant' && message.alts) {
            setVariantPick((picks) => ({
              ...picks,
              [message.id]: (picks[message.id] ?? 0) + 1,
            }));
          }
        }, RESEND_STEP_MS * (k - from + 1))
      );
    }
  };

  const branchFrom = (index: number) => {
    const head = branch.slice(0, index + 1);
    const continuation =
      BRANCH_CONTINUATIONS[branches.length % BRANCH_CONTINUATIONS.length]!;
    const idBase = 1000 + branches.length * 10;
    const tail = continuation.map((m, k) => ({ ...m, id: idBase + k }));
    cancelTransient();
    setBranches((prev) => [...prev, [...head, ...tail]]);
    setActive(branches.length);
  };

  const resetDemo = () => {
    cancelTransient();
    setVariantPick({});
    setBranches([INITIAL_CONVERSATION]);
    setActive(0);
  };

  /** pick 0 = original text; each resend after that cycles `alts`. */
  const textOf = (m: BranchMessage): string => {
    const pick = variantPick[m.id] ?? 0;
    if (pick === 0 || !m.alts?.length) return m.text;
    return m.alts[(pick - 1) % m.alts.length]!;
  };

  return (
    <>
      <div className={branchToolbar}>
        {branches.length > 1 ? (
          <span
            className={branchTabs}
            role='group'
            aria-label='Conversation branches'
          >
            {branches.map((b, i) => (
              <button
                key={i}
                type='button'
                className={branchTab}
                aria-pressed={i === active}
                aria-label={`Branch v${i + 1} (${b.length} messages)`}
                onClick={() => switchBranch(i)}
              >
                v{i + 1}
              </button>
            ))}
          </span>
        ) : (
          <span className={dataTableMeta}>
            Single branch — use ⑂ on a message to fork the timeline.
          </span>
        )}
        <Button size='sm' variant='ghost' onClick={resetDemo}>
          Reset demo
        </Button>
      </div>

      <div className={branchList}>
        {branch.map((m, index) => {
          const loading =
            reflow !== null && index >= reflow.from && index > reflow.done;
          const editing = editingId === m.id;
          return (
            <div key={m.id} x-class={[msgRow, m.role === 'user' && msgRowUser]}>
              <ChatMessage
                role={m.role}
                name={m.name}
                timestamp={m.time}
                className={msgGrow}
              >
                {editing ? (
                  <div className={msgEditor}>
                    <TextareaCore
                      value={draft}
                      onChange={setDraft}
                      rows={3}
                      aria-label={`Edit message ${index + 1}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelTransient();
                        }
                      }}
                    />
                    <div className={msgEditorButtons}>
                      <Button
                        size='sm'
                        onClick={saveEdit}
                        disabled={!draft.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={cancelTransient}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : loading ? (
                  <span
                    className={msgPending}
                    role={index === reflow.from ? 'status' : undefined}
                    aria-label={`Re-sending message ${index + 1}`}
                  >
                    <i aria-hidden='true' />
                    <i aria-hidden='true' />
                    <i aria-hidden='true' />
                  </span>
                ) : (
                  textOf(m)
                )}
              </ChatMessage>
              {!editing && !loading && (
                <div className={msgActions}>
                  <Button
                    size='sm'
                    variant='ghost'
                    aria-label={`Edit message ${index + 1}`}
                    onClick={() => startEdit(m)}
                  >
                    ✎
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    aria-label={`Resend message ${index + 1} and regenerate everything after it`}
                    onClick={() => startResend(index)}
                  >
                    ↻
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    aria-label={`Branch from message ${index + 1}`}
                    onClick={() => branchFrom(index)}
                  >
                    ⑂
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── ChatMessage ──────────────────────────────────────────────
export default function ChatMessageDemo() {
  return (
    <>
      <h1>ChatMessage</h1>
      <p className={intro}>
        Chat bubble component with role-based styling for user, assistant, and
        system messages.
      </p>

      <div className={section}>
        <h2>Roles</h2>
        <ChatMessage role='user' name='You' timestamp='10:00 AM'>
          Can you explain how React hooks work?
        </ChatMessage>
        <ChatMessage role='assistant' name='Assistant' timestamp='10:01 AM'>
          Sure! Hooks let you use state and other React features in function
          components. The most common ones are useState and useEffect.
        </ChatMessage>
        <ChatMessage role='system'>Conversation started</ChatMessage>
      </div>

      <div className={section}>
        <h2>With Status</h2>
        <ChatMessage role='user' name='You' status='sent'>
          Message sent successfully.
        </ChatMessage>
        <ChatMessage role='user' name='You' status='error'>
          This message failed to send.
        </ChatMessage>
      </div>

      <div className={section}>
        <h2>Edit / Resend / Branch (recipe)</h2>
        <ChatMessageWorkflowDemo />
        <p className={dataTableNote}>
          The message tree is a plain <code>branches: BranchMessage[][]</code>{' '}
          — every branch owns a full timeline, so branching forks the active
          one after the chosen message (deterministic continuations, cycled
          by branch count) and the switcher above restores each branch&apos;s
          own tail. Edits are branch-local. Resend replays deterministically:
          the target row and everything after it become pending placeholders,
          then resolve one per {RESEND_STEP_MS} ms via a{' '}
          <code>setTimeout</code> chain — user messages return verbatim,
          assistant answers cycle through canned <code>alts</code>. No{' '}
          <code>Math.random</code> anywhere: the same clicks always produce
          the same tree. Row actions stay transparent until the row is
          hovered <em>or</em> focused — <code>:focus-within</code> keeps them
          keyboard-reachable — and each button carries a descriptive{' '}
          <code>aria-label</code>.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ChatMessageProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              User messages are visually reversed with{' '}
              <strong>flex-direction: row-reverse</strong>
            </li>
            <li>System messages are centered with muted styling</li>
            <li>Status text provides visual feedback for message delivery</li>
            <li>
              Recipe rows reveal their action bar on{' '}
              <strong>:focus-within</strong>, so Tab reaches every action
              button; each carries a descriptive <strong>aria-label</strong>,
              the pending row is a <strong>role=&quot;status&quot;</strong>{' '}
              live region, and the editor saves with{' '}
              <strong>Ctrl/Cmd+Enter</strong>, cancels with{' '}
              <strong>Escape</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='chatmessage' />
    </>
  );
}
