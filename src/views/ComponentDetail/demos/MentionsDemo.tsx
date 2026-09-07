import { Mentions } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

const PEOPLE = [
  { value: 'alice', label: 'Alice Zhang' },
  { value: 'bob', label: 'Bob Li' },
  { value: 'carol', label: 'Carol Wang' },
  { value: 'dave', label: 'Dave Chen' },
];

const CHANNELS = [
  { value: 'general', label: 'General' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'random', label: 'Random' },
  { value: 'release', label: 'Release' },
];

const TEAM = Array.from({ length: 20 }, (_, i) => ({
  value: `member${i + 1}`,
  label: `Member ${i + 1}`,
}));

// ─── Mentions ──────────────────────────────────────────────────
export default function MentionsDemo() {
  return (
    <>
      <h1>Mentions</h1>
      <p className={intro}>
        Textarea that suggests options after a trigger character is typed.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <Mentions
            options={PEOPLE}
            placeholder='Type @ to mention someone…'
            rows={3}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Custom trigger</h2>
        <div className={fieldRow}>
          <Mentions
            options={CHANNELS}
            trigger='#'
            placeholder='Type # to reference a channel…'
            rows={3}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Many options</h2>
        <div className={fieldRow}>
          <Mentions
            options={TEAM}
            placeholder='Type @ and filter by name or number…'
            rows={3}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='MentionsProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              The widget exposes <strong>role=&quot;combobox&quot;</strong>{' '}
              with <strong>aria-expanded</strong> and{' '}
              <strong>aria-controls</strong>; the textarea carries{' '}
              <strong>aria-autocomplete=&quot;list&quot;</strong> and{' '}
              <strong>aria-activedescendant</strong>
            </li>
            <li>
              Suggestions use <strong>role=&quot;listbox&quot;</strong> and{' '}
              <strong>role=&quot;option&quot;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate suggestions,{' '}
              <strong>Enter</strong> or <strong>Tab</strong> inserts,{' '}
              <strong>Escape</strong> closes
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
