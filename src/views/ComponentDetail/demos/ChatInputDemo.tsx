import { useEffect, useRef, useState } from 'react';

import { useControl } from 'react-use-control';

import { css } from '@linaria/core';

import { Button, FileInput, ChatMessage, ChatInput, UploadCore } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection, dataTableNote, feedToolbar, feedMeta } from './shared';

// ─── ChatInput × Upload — attachment bridge (recipe) ──────────
/** Fixed epoch (2026-01-01 09:00 UTC) — deterministic lastModified. */
const SAMPLE_FILE_TS = Date.UTC(2026, 0, 1, 9, 0, 0);

const SAMPLE_FILE_SPECS = [
  {
    name: 'render-trace.log',
    type: 'text/plain',
    body: [
      '[09:00:00] mount <ChatInput/> 0.9ms',
      '[09:00:01] attach 3 files (bridge) 0.2ms',
      '[09:00:02] send message + attachments 1.1ms',
    ].join('\n'),
  },
  {
    name: 'bundle-report.json',
    type: 'application/json',
    body: '{"component":"ChatInput","cssBytes":1240,"jsBytes":3120,"runtime":"zero"}',
  },
  {
    name: 'focus-ring.svg',
    type: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  },
] as const;

/**
 * Deterministic File fabrication — fixed bodies and a fixed lastModified,
 * so every simulated pick yields byte-identical objects. This is the
 * in-memory stand-in for a real picker (DataTransfer/FileList); nothing
 * is uploaded anywhere.
 */
function makeSampleFiles(): File[] {
  return SAMPLE_FILE_SPECS.map(
    (spec, i) =>
      new File([spec.body], spec.name, {
        type: spec.type,
        lastModified: SAMPLE_FILE_TS + i * 1000,
      })
  );
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

type SentWithAttachments = { text: string; files: File[] };

const attachStack = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  max-width: 560px;
`;

const attachCards = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
`;

const attachCard = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-1) var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg-subtle);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
`;

const attachName = css`
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--haze-color-text);
`;

const attachSize = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  font-variant-numeric: tabular-nums;
`;

const attachRemoveBtn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--haze-space-5);
  height: var(--haze-space-5);
  border: none;
  border-radius: var(--haze-radius-sm);
  background: transparent;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: var(--haze-color-danger);
    background: var(--haze-color-danger-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

const attachComposer = css`
  display: flex;
  align-items: flex-end;
  gap: var(--haze-space-2);
`;

const attachInputGrow = css`
  flex: 1;
  min-width: 0;
`;

const attachSentChips = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
  margin-top: var(--haze-space-2);
`;

const attachSentChip = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-0) var(--haze-space-2);
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
`;

/**
 * ChatInput has no attachment slot, so the recipe bridges one: the pending
 * file list lives in a controllable <code>Control&lt;File[]&gt;</code>, both
 * FileInput (label + hidden native input) and UploadCore (controlled
 * dropzone — value is the whole list, onChange emits the complete next
 * list) write through it, preview cards render above the composer, and
 * send moves text + files into a read-only ChatMessage preview.
 */
function ChatAttachmentBridgeDemo() {
  // The file list is the field value — controllable from outside, same
  // pattern as the DataTable recipe's page slice.
  const [, , filesCtrl] = useControl(undefined, [] as File[]);
  const [files, setFiles] = useControl(filesCtrl);
  const [sent, setSent] = useState<SentWithAttachments[]>([]);

  const addPicked = (picked: File[]) => {
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
  };

  return (
    <div className={attachStack}>
      <div className={feedToolbar}>
        <Button size='sm' variant='outline' onClick={() => addPicked(makeSampleFiles())}>
          Add sample attachments
        </Button>
        {files.length > 0 && (
          <Button
            size='sm'
            variant='ghost'
            onClick={() => setFiles([])}
            aria-label='Clear all pending attachments'
          >
            Clear
          </Button>
        )}
        <span className={feedMeta}>
          {files.length} pending · {sent.length} sent
        </span>
      </div>

      {files.length > 0 && (
        <div className={attachCards} role='group' aria-label='Pending attachments'>
          {files.map((file, i) => (
            <span
              className={attachCard}
              key={`${file.name}-${file.lastModified}-${i}`}
            >
              <span className={attachName}>{file.name}</span>
              <span className={attachSize}>{formatBytes(file.size)}</span>
              <button
                type='button'
                className={attachRemoveBtn}
                aria-label={`Remove attachment ${file.name}`}
                onClick={() =>
                  setFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={attachComposer}>
        <FileInput
          multiple
          onChange={(e) => {
            addPicked(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        >
          📎 Attach
        </FileInput>
        <ChatInput
          className={attachInputGrow}
          placeholder='Type a message — attachments ride along…'
          onSend={(text) => {
            setSent((prev) => [...prev, { text, files }]);
            setFiles([]);
          }}
        />
      </div>

      <UploadCore
        value={files}
        onChange={(next) => setFiles(next.filter((f): f is File => f instanceof File))}
        multiple
      >
        <span>
          …or drop files here to attach — in-memory only, nothing uploads
        </span>
      </UploadCore>

      {sent.length > 0 && (
        <div aria-label='Sent messages with attachments'>
          {sent.map((s, i) => (
            <ChatMessage key={i} role='user' name='You' timestamp='just now'>
              {s.text}
              {s.files.length > 0 && (
                <span className={attachSentChips}>
                  {s.files.map((f, j) => (
                    <span className={attachSentChip} key={j}>
                      📎 {f.name} · {formatBytes(f.size)}
                    </span>
                  ))}
                </span>
              )}
            </ChatMessage>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatStopDemo() {
  const [messages, setMessages] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    []
  );

  const send = (message: string) => {
    setMessages((prev) => [...prev, `You: ${message}`]);
    setGenerating(true);
    // Deterministic canned reply — same input, same transcript.
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setMessages((prev) => [
        ...prev,
        'Assistant: here is the (scripted) rest of that answer.',
      ]);
      setGenerating(false);
    }, 2000);
  };

  const stop = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    setMessages((prev) => [...prev, 'Assistant: — generation stopped.']);
    setGenerating(false);
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <ChatInput
        generating={generating}
        onSend={send}
        onStop={stop}
        placeholder={
          generating ? 'Generating — Enter or ⏹ stops…' : 'Type a message...'
        }
      />
      {messages.length > 0 && (
        <div
          style={{
            marginTop: 'var(--haze-space-3)',
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
          }}
        >
          {messages.map((m, i) => (
            <div key={i}>{m}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ChatInput ────────────────────────────────────────────────
export default function ChatInputDemo() {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <>
      <h1>ChatInput</h1>
      <p className={intro}>
        Auto-resizing textarea with Enter-to-send and Shift+Enter for newlines.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 480 }}>
          <ChatInput
            onSend={(msg) => setMessages((prev) => [...prev, msg])}
            placeholder='Type a message...'
          />
          {messages.length > 0 && (
            <div
              style={{
                marginTop: 'var(--haze-space-3)',
                fontSize: 'var(--haze-text-sm)',
                color: 'var(--haze-color-text-secondary)',
              }}
            >
              Sent: {messages.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className={section}>
        <h2>Stop generation</h2>
        <ChatStopDemo />
        <p className={dataTableNote}>
          <code>generating</code> swaps the send control for a stop control:
          the glyph and <code>aria-label</code> flip to the{' '}
          <code>chat.stopGeneration</code> string, the button stays enabled
          regardless of the draft, and both clicking it and pressing{' '}
          <strong>Enter</strong> call <code>onStop</code> instead of{' '}
          <code>onSend</code> (stopping never clears the composer — the draft
          survives). Here a 2s scripted reply plays the role of the model;
          stopping cancels it.
        </p>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div style={{ maxWidth: 480 }}>
          <ChatInput disabled placeholder='Disabled input' />
        </div>
      </div>

      <div className={section}>
        <h2>Attachments bridge (recipe)</h2>
        <ChatAttachmentBridgeDemo />
        <p className={dataTableNote}>
          ChatInput has no attachment slot, so the recipe bridges one: the
          pending list lives in a controllable <code>Control&lt;File[]&gt;</code>{' '}
          — both <code>FileInput</code> (label + hidden native input; picks
          merge into the same list) and <code>UploadCore</code> (controlled
          dropzone: <code>value</code> is the whole list,{' '}
          <code>onChange</code> emits the complete next list) write through
          that one control, which makes the preview cards above the composer
          the single source of truth. <code>ChatInput</code> only fires{' '}
          <code>onSend</code> for non-empty text, so attachments always ride
          along with a message; sending moves text + files into the
          read-only preview below and clears the list. The{' '}
          <em>Add sample attachments</em> button fabricates{' '}
          <code>File</code> objects in memory (<code>new File</code> with
          fixed bodies and <code>lastModified</code>, the deterministic
          stand-in for <code>DataTransfer</code>-driven picks) — nothing is
          uploaded.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ChatInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Send button has <strong>aria-label=&quot;Send&quot;</strong>;
              while <code>generating</code> it becomes a stop control labeled
              by the <strong>chat.stopGeneration</strong> string
            </li>
            <li>
              <strong>Enter</strong> sends (or stops mid-generation),
              <strong>Shift+Enter</strong> inserts newline
            </li>
            <li>
              Focus ring appears on <strong>:focus-within</strong>
            </li>
            <li>
              Recipe: every remove button carries an{' '}
              <strong>aria-label</strong> naming its file, the pending set
              is a labeled <strong>role=&quot;group&quot;</strong>, the
              dropzone is the library <strong>UploadCore</strong>{' '}
              (<strong>role=&quot;button&quot;</strong>, keyboard-operable),
              and sent attachment chips are plain text so they read together
              with the message
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='chatinput' />
    </>
  );
}
