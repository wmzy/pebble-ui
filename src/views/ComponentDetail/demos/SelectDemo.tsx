import { useControl } from 'react-use-control';

import { Select, Option, Button } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow, row } from '../styles';

import { CssVarsSection } from './shared';

const FRAMEWORKS = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'angular', label: 'Angular' },
];

// ─── Select ────────────────────────────────────────────────────
export default function SelectDemo() {
  // Control triple: the component takes the control, buttons use the
  // setter (a bare value would be a non-controlled initial value).
  const [picked, setPicked, pickedCtrl] = useControl<string[]>(
    undefined,
    []
  );

  return (
    <>
      <h1>Select</h1>
      <p className={intro}>
        Dropdown selection with native &lt;select&gt; semantics.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={fieldRow}>
          <Select size='sm'>
            <Option value=''>Small select</Option>
            <Option value='a'>Option A</Option>
            <Option value='b'>Option B</Option>
          </Select>
        </div>
        <div className={fieldRow}>
          <Select size='md'>
            <Option value=''>Medium select</Option>
            <Option value='a'>Option A</Option>
            <Option value='b'>Option B</Option>
          </Select>
        </div>
        <div className={fieldRow}>
          <Select size='lg'>
            <Option value=''>Large select</Option>
            <Option value='a'>Option A</Option>
            <Option value='b'>Option B</Option>
          </Select>
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <Select disabled>
            <Option value=''>Disabled</Option>
          </Select>
        </div>
      </div>

      <div className={section}>
        <h2>Multiple selection</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>multiple</code> swaps the native control for a Chip trigger
          plus a listbox popover: selections render as removable chips,{' '}
          <code>placeholder</code> labels the empty trigger, and{' '}
          <code>onValuesChange</code> reports the <code>string[]</code>{' '}
          value after every toggle or chip removal.
        </p>
        <div className={fieldRow}>
          <Select
            multiple
            value={pickedCtrl}
            placeholder='Pick frameworks…'
            onValuesChange={(value) =>
              console.log('onValuesChange:', value)
            }
          >
            {FRAMEWORKS.map((framework) => (
              <Option key={framework.value} value={framework.value}>
                {framework.label}
              </Option>
            ))}
          </Select>
        </div>
        <div className={row}>
          <span
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Value: {picked.length > 0 ? picked.join(', ') : '[]'}
          </span>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setPicked([])}
            disabled={picked.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SelectProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native <strong>&lt;select&gt;</strong> with full
              keyboard support
            </li>
            <li>
              Use <strong>aria-label</strong> or a visible{' '}
              <strong>&lt;label&gt;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate options,{' '}
              <strong>Enter</strong> selects
            </li>
            <li>
              Multiple mode renders a <strong>listbox</strong> popover with{' '}
              <strong>aria-multiselectable</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='select' />
    </>
  );
}
