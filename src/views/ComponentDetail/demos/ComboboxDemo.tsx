import { Combobox } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

import { CssVarsSection } from './shared';

// ─── Combobox ──────────────────────────────────────────────────
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
          <Combobox options={fruits} placeholder='Search fruits...' />
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
