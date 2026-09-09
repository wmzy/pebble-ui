import { useState } from 'react';
import { useControl } from 'react-use-control';

import { PromptInput } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

const PEOPLE = ['Alice Zhang', 'Bob Li', 'Carol Wang', 'Dave Chen'];
const COMMANDS = ['summarize', 'translate', 'analyze'];

/**
 * Fake async suggestion source with latency: the PromptInput drops stale
 * responses, so quick typing only ever shows the newest query's list.
 */
function suggest(trigger: string, query: string): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const pool = trigger === '/' ? COMMANDS : PEOPLE;
      const q = query.toLowerCase();
      resolve(pool.filter((item) => item.toLowerCase().startsWith(q)));
    }, 250);
  });
}

/** One control per controllable state: text and tags both round-trip
 * through the parent, driven exactly like the SidebarDemo pattern. */
function ControlledPromptExample() {
  const [text, setText, textCtrl] = useControl(undefined, '');
  const [tags, setTags, tagsCtrl] = useControl(undefined, ['gpt-5']);

  return (
    <>
      <div className={fieldRow}>
        <PromptInput
          value={textCtrl}
          tags={tagsCtrl}
          placeholder='Ask anything — draft lives in the parent'
        />
      </div>
      <div className={fieldRow}>
        <button onClick={() => setText('Rewritten externally')}>Rewrite</button>
        <button onClick={() => setTags([...tags, 'vision'])}>Add tag</button>
        <output>
          draft: {text || '—'} | tags: {tags.join(', ') || '—'}
        </output>
      </div>
    </>
  );
}

/** Basic composer: Enter submits, the draft clears, submissions stack up. */
function SubmitLogExample() {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <>
      <div className={fieldRow}>
        <PromptInput
          placeholder='Type a prompt and press Enter…'
          maxRows={4}
          onSubmit={() => setSent((prev) => [...prev, 'submitted'])}
        />
      </div>
      <p>Submissions: {sent.length}</p>
    </>
  );
}

// ─── PromptInput ────────────────────────────────────────────────
export default function PromptInputDemo() {
  return (
    <>
      <h1>PromptInput</h1>
      <p className={intro}>
        AI prompt composer: auto-growing free text with inline removable
        tags, trigger-character suggestion listboxes (async-friendly, stale
        responses dropped), and submit-on-key — all four states
        controllable through <code>useControl</code>.
      </p>

      <div className={section}>
        <h2>Basic composer</h2>
        <SubmitLogExample />
      </div>

      <div className={section}>
        <h2>Controlled text and tags</h2>
        <ControlledPromptExample />
      </div>

      <div className={section}>
        <h2>Mentions with async suggestions</h2>
        <p>
          Type <code>@</code> to mention a teammate or <code>/</code> for a
          command — suggestions arrive after 250 ms; only the latest
          response is applied.
        </p>
        <div className={fieldRow}>
          <PromptInput
            triggers={['@', '/']}
            getSuggestions={suggest}
            tags={['attachment.pdf']}
            placeholder='Ask @someone to /summarize this…'
            maxRows={4}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Submit with mod-enter</h2>
        <p>
          With <code>submitKey=&quot;mod-enter&quot;</code>, plain Enter
          inserts newlines and only Ctrl/Cmd+Enter submits — for drafts
          where Enter must stay free-form.
        </p>
        <div className={fieldRow}>
          <PromptInput
            submitKey='mod-enter'
            placeholder='Write multi-line, press ⌘/Ctrl+Enter to submit…'
            maxRows={4}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <PromptInput
            disabled
            tags={['ctx']}
            placeholder='Disabled composer…'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='PromptInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              With <code>getSuggestions</code>, the widget exposes{' '}
              <strong>role=&quot;combobox&quot;</strong> with{' '}
              <strong>aria-expanded</strong> /{' '}
              <strong>aria-controls</strong>; the textarea carries{' '}
              <strong>aria-autocomplete=&quot;list&quot;</strong> and{' '}
              <strong>aria-activedescendant</strong> for the keyboard
              highlight
            </li>
            <li>
              Suggestions are a <strong>listbox</strong> of{' '}
              <strong>options</strong>: ArrowDown/ArrowUp navigate, Enter
              or Tab commits, Escape closes without touching the text
            </li>
            <li>
              Tags form a list; each remove button is labelled{' '}
              <em>Remove &lt;tag&gt;</em> (localized via the{' '}
              <code>promptInput</code> strings section)
            </li>
            <li>
              Backspace on empty text removes the last tag; focus never
              leaves the textarea
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
