import { Combobox } from '@/lib';

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

export default function ComboboxDemo() {
  const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'grape', label: 'Grape' },
    { value: 'mango', label: 'Mango' },
    { value: 'orange', label: 'Orange' },
  ];

  return (
    <>
      <h1>Combobox</h1>
      <p className={intro}>
        Searchable dropdown combining text input with a filterable list.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <Combobox options={fruits} placeholder="Search fruits..." />
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
              <strong>role=&quot;option&quot;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate options,{' '}
              <strong>Enter</strong> selects, <strong>Escape</strong> closes
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='combobox' />
    </>
  );
}
