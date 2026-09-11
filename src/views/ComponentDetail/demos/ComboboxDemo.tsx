import { useEffect, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { Button, Combobox } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

import { CssVarsSection } from './shared';

// ─── Combobox ──────────────────────────────────────────────────
// A thousand-option list for the virtualized example.
const MANY_OPTIONS = Array.from({ length: 1000 }, (_, i) => ({
  value: `opt-${i}`,
  label: `Option ${i + 1}`,
}));

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
  { value: 'mango', label: 'Mango' },
  { value: 'orange', label: 'Orange' },
];

const PRODUCE = [
  { value: 'apple', label: 'Apple', group: 'Fruits' },
  { value: 'banana', label: 'Banana', group: 'Fruits' },
  { value: 'cherry', label: 'Cherry', group: 'Fruits' },
  { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
  { value: 'daikon', label: 'Daikon', group: 'Vegetables' },
  { value: 'endive', label: 'Endive', group: 'Vegetables' },
];

// Simulated remote corpus for the remote-search example — stands in
// for a server-side query endpoint.
const REMOTE_LIBRARY = [
  ...FRUITS,
  { value: 'kiwano', label: 'Kiwano' },
  { value: 'kumquat', label: 'Kumquat' },
  { value: 'lychee', label: 'Lychee' },
  { value: 'persimmon', label: 'Persimmon' },
];

export default function ComboboxDemo() {
  // ControlOrValue contract: drive the component through a control,
  // never a bare value (a bare value is only the uncontrolled initial
  // value — later prop changes are ignored).
  const [, , tagsCtrl] = useControl<string[]>(undefined, []);
  // Async-search stand-in for the loading example.
  const [loading, setLoading] = useState(false);
  // Remote-search stand-in: the fake server owns the option list and
  // answers each query after a delay. A pending timer is cancelled on
  // unmount (and superseded by the next query).
  const [remoteOptions, setRemoteOptions] = useState(REMOTE_LIBRARY);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (remoteTimer.current !== null) clearTimeout(remoteTimer.current);
    },
    []
  );
  const handleRemoteSearch = (query: string) => {
    setRemoteLoading(true);
    if (remoteTimer.current !== null) clearTimeout(remoteTimer.current);
    remoteTimer.current = setTimeout(() => {
      setRemoteLoading(false);
      // "Server-side" matching — the component does none of this.
      const needle = query.trim().toLowerCase();
      setRemoteOptions(
        needle === ''
          ? REMOTE_LIBRARY
          : REMOTE_LIBRARY.filter((item) =>
              item.label.toLowerCase().includes(needle)
            )
      );
    }, 500);
  };

  return (
    <>
      <h1>Combobox</h1>
      <p className={intro}>
        Searchable dropdown combining text input with a filterable list.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <Combobox options={FRUITS} placeholder="Search fruits..." />
        </div>
      </div>

      <div className={section}>
        <h2>Multiple</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>multiple</code> turns the trigger into a chip box: selected
          values render as chips, <strong>Enter</strong> toggles the
          highlighted option without closing the panel, and{' '}
          <strong>Backspace</strong> on an empty query drops the last chip.
          The value is <code>string[]</code>; changes flow through{' '}
          <code>onValuesChange</code>.
        </p>
        <div className={fieldRow}>
          <Combobox
            multiple
            options={FRUITS}
            value={tagsCtrl}
            placeholder="Pick fruits..."
          />
        </div>
      </div>

      <div className={section}>
        <h2>Groups</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Options carrying a <code>group</code> label cluster into sticky{' '}
          <code>role=&quot;group&quot;</code> sections (the{' '}
          <code>ComboboxGroup</code> shape). Groups whose every option was
          filtered out hide entirely, and keyboard navigation stays
          continuous across sections. Works with virtualization too.
        </p>
        <div className={fieldRow}>
          <Combobox options={PRODUCE} placeholder="Search produce..." />
        </div>
      </div>

      <div className={section}>
        <h2>Creatable</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          With <code>creatable</code>, a query that matches nothing offers a{' '}
          <code>Create &quot;…&quot;</code> row (copy from{' '}
          <code>LocaleProvider</code>). Committing it calls{' '}
          <code>onCreate</code> and appends the value to a local option set
          that lives until the component unmounts.
        </p>
        <div className={fieldRow}>
          <Combobox options={FRUITS} creatable placeholder="Type 'kiwi'..." />
        </div>
      </div>

      <div className={section}>
        <h2>Match highlighting, loading &amp; empty states</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>highlightMatches</code> wraps the case-insensitive query hit
          in each label with a token-styled <code>&lt;mark&gt;</code>. An
          empty result list shows the <code>combobox.noResults</code> locale
          string unless <code>empty</code> provides custom content.{' '}
          <code>maxHeight</code> (px) caps both the plain and virtualized
          panels — default 200.
        </p>
        <div className={fieldRow}>
          <Combobox
            options={FRUITS}
            highlightMatches
            maxHeight={120}
            empty={<em>No such fruit</em>}
            placeholder="Try 'an'..."
          />
        </div>
        <div className={fieldRow}>
          <Combobox
            options={FRUITS}
            loading={loading}
            placeholder="Async search..."
          />{' '}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLoading((v) => !v)}
          >
            {loading ? 'Stop' : 'Start'} loading
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Remote search</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>onSearch</code> hands the query to you: every transition
          fires the callback — each keystroke, clearing the input (the
          empty query restores the full list), and the reset that follows
          a selection — while the component stops filtering locally and
          renders exactly the <code>options</code> you pass back. Pair
          with <code>loading</code> for the pending state; debouncing is
          the consumer&apos;s concern. This fake server matches on the
          label after a half-second delay — try <code>ki</code>.
        </p>
        <div className={fieldRow}>
          <Combobox
            options={remoteOptions}
            onSearch={handleRemoteSearch}
            loading={remoteLoading}
            placeholder="Async search…"
          />{' '}
          <span
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            {remoteLoading
              ? 'Searching…'
              : `Server returned ${remoteOptions.length} options`}
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Virtualized</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Lists longer than <code>virtualThreshold</code> (default 100)
          render through <code>VirtualList</code> automatically — only the
          visible window of options stays mounted. The explicit{' '}
          <code>virtualized</code> prop overrides the threshold:{' '}
          <code>true</code> (or an <code>{'{ itemHeight, overscan }'}</code>{' '}
          object) always virtualizes, <code>false</code> never does.
        </p>
        <div className={fieldRow}>
          <Combobox
            options={MANY_OPTIONS}
            virtualized
            placeholder="Search 1000 options..."
          />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ComboboxProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;combobox&quot;</strong> with{' '}
              <strong>aria-expanded</strong> and{' '}
              <strong>aria-autocomplete=&quot;list&quot;</strong>
            </li>
            <li>
              Options use <strong>role=&quot;listbox&quot;</strong> and{' '}
              <strong>role=&quot;option&quot;</strong>; groups add{' '}
              <strong>role=&quot;group&quot;</strong> named by their heading
            </li>
            <li>
              <strong>Arrow keys</strong> navigate options,{' '}
              <strong>Enter</strong> selects (toggles in multiple mode),{' '}
              <strong>Backspace</strong> removes the last chip,{' '}
              <strong>Escape</strong> closes
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='combobox' />
    </>
  );
}
