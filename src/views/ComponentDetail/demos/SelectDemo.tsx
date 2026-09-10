import { useControl } from 'react-use-control';

import { Select, Option, OptionGroup } from '@/lib/components/Select';
import { Button } from '@/lib';

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

// A thousand-option list for the virtualized multiple example.
const MANY_OPTIONS = Array.from({ length: 1000 }, (_, i) => (
  <Option key={i} value={`opt-${i}`}>
    Option {i + 1}
  </Option>
));

const GROUPED_FRAMEWORKS = [
  <OptionGroup key='frontend' label='Frontend'>
    <Option value='react'>React</Option>
    <Option value='vue'>Vue</Option>
    <Option value='svelte'>Svelte</Option>
  </OptionGroup>,
  <OptionGroup key='backend' label='Backend'>
    <Option value='node'>Node.js</Option>
    <Option value='deno'>Deno</Option>
    <Option value='bun'>Bun</Option>
  </OptionGroup>,
];

const noteStyle = {
  fontSize: 'var(--haze-text-sm)',
  color: 'var(--haze-color-text-secondary)',
  margin: '0 0 var(--haze-space-3)',
} as const;

const valueStyle = {
  fontSize: 'var(--haze-text-sm)',
  color: 'var(--haze-color-text-secondary)',
} as const;

// ─── Select ────────────────────────────────────────────────────
export default function SelectDemo() {
  // Control triple: the component takes the control, buttons use the
  // setter (a bare value would be a non-controlled initial value).
  const [picked, setPicked, pickedCtrl] = useControl<string[]>(
    undefined,
    []
  );
  const [pickedMany, setPickedMany, pickedManyCtrl] = useControl<string[]>(
    undefined,
    []
  );
  const [searched, , searchedCtrl] = useControl<string>(undefined, '');
  const [grouped, , groupedCtrl] = useControl<string>(undefined, '');
  const [groupedMany, setGroupedMany, groupedManyCtrl] = useControl<
    string[]
  >(undefined, []);
  const [tagged, , taggedCtrl] = useControl<string[]>(undefined, [
    'react',
    'vue',
    'svelte',
  ]);
  const [loading, setLoading] = useControl<boolean>(
    undefined,
    false
  );

  return (
    <>
      <h1>Select</h1>
      <p className={intro}>
        Dropdown selection with native &lt;select&gt; semantics, plus
        searchable / grouped / clearable / loading / maxTagCount modes on
        the floating listbox engine.
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
        <h2>Searchable &amp; clearable</h2>
        <p style={noteStyle}>
          <code>searchable</code> swaps the native control for the floating
          listbox with a search input at the top of the panel: typing
          filters options, ↑/↓ move the highlight, Enter picks and
          closes, Escape closes. <code>clearable</code> reveals a × on
          hover/focus-within that empties the value without touching the
          panel (Backspace is the keyboard path).
        </p>
        <div className={fieldRow}>
          <Select
            searchable
            clearable
            value={searchedCtrl}
            placeholder='Pick a framework…'
          >
            {FRAMEWORKS.map((framework) => (
              <Option key={framework.value} value={framework.value}>
                {framework.label}
              </Option>
            ))}
          </Select>
        </div>
        <div className={row}>
          <span style={valueStyle}>
            Value: {searched === '' ? '(none)' : searched}
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Grouped options</h2>
        <p style={noteStyle}>
          <code>OptionGroup</code> labels option clusters. The native path
          renders a real <code>&lt;optgroup&gt;</code>; the floating paths
          render <code>role=&apos;group&apos;</code> sections whose keyboard order
          runs continuously across groups.
        </p>
        <div className={fieldRow}>
          <Select value={groupedCtrl} placeholder='Native grouped…'>
            {GROUPED_FRAMEWORKS}
          </Select>
        </div>
        <div className={fieldRow}>
          <Select
            multiple
            value={groupedManyCtrl}
            placeholder='Floating grouped…'
          >
            {GROUPED_FRAMEWORKS}
          </Select>
        </div>
        <div className={row}>
          <span style={valueStyle}>
            Native: {grouped === '' ? '(none)' : grouped} · Floating:{' '}
            {groupedMany.length > 0 ? groupedMany.join(', ') : '[]'}
          </span>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setGroupedMany([])}
            disabled={groupedMany.length === 0}
          >
            Clear floating
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Multiple selection</h2>
        <p style={noteStyle}>
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
          <span style={valueStyle}>
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
        <h2>maxTagCount &amp; clearable (multiple)</h2>
        <p style={noteStyle}>
          <code>maxTagCount</code> caps the rendered chips — the overflow
          collapses into a <code>+N</code> badge whose tooltip lists the
          hidden labels. <code>clearable</code> empties the whole
          selection in one click.
        </p>
        <div className={fieldRow}>
          <Select
            multiple
            clearable
            maxTagCount={1}
            value={taggedCtrl}
            placeholder='Pick frameworks…'
          >
            {FRAMEWORKS.map((framework) => (
              <Option key={framework.value} value={framework.value}>
                {framework.label}
              </Option>
            ))}
          </Select>
        </div>
        <div className={row}>
          <span style={valueStyle}>
            Selected: {tagged.length} (
            {tagged.length > 0 ? tagged.join(', ') : '[]'})
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Loading</h2>
        <p style={noteStyle}>
          <code>loading</code> marks the floating panel busy: the options
          area shows a spinner with <code>aria-busy=&apos;true&apos;</code>, and
          search filtering stays suspended until the options arrive.
        </p>
        <div className={fieldRow}>
          <Select
            multiple
            searchable
            loading={loading}
            placeholder='Pick frameworks…'
          >
            {FRAMEWORKS.map((framework) => (
              <Option key={framework.value} value={framework.value}>
                {framework.label}
              </Option>
            ))}
          </Select>
        </div>
        <div className={row}>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setLoading((v) => !v)}
          >
            {loading ? 'Finish loading' : 'Start loading'}
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Virtualized multiple</h2>
        <p style={noteStyle}>
          <code>virtualized</code> renders the listbox options through{' '}
          <code>VirtualList</code>: only the visible window (plus a small
          overscan) stays mounted, keeping thousand-option lists fast.
          Keyboard navigation scrolls the highlighted row into view, and{' '}
          <code>aria-posinset</code>/<code>aria-setsize</code> keep the
          unmounted remainder semantically addressable. Pass an object to
          tune <code>{'{ itemHeight, overscan }'}</code>.
        </p>
        <div className={fieldRow}>
          <Select
            multiple
            virtualized
            value={pickedManyCtrl}
            placeholder='Pick numbers…'
          >
            {MANY_OPTIONS}
          </Select>
        </div>
        <div className={row}>
          <span style={valueStyle}>Selected: {pickedMany.length}</span>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setPickedMany([])}
            disabled={pickedMany.length === 0}
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
            <li>
              The floating triggers are APG select-only comboboxes:{' '}
              <strong>role=&quot;combobox&quot;</strong> with aria-expanded,
              aria-controls and aria-activedescendant for the keyboard
              highlight
            </li>
            <li>
              Searchable panels put the search input inside the popup —
              focus moves there on open, and the input mirrors{' '}
              <strong>aria-activedescendant</strong> so screen readers
              announce highlight moves while typing
            </li>
            <li>
              Option groups are native <strong>optgroup</strong> elements
              on the select path and <strong>role=&apos;group&apos;</strong> sections
              on the floating paths
            </li>
            <li>
              The clear × and chip removes are pointer-only by design
              (nested interactive controls inside a button are invalid
              HTML); keyboard users clear with <strong>Backspace</strong>{' '}
              and remove chips with Backspace or the listbox
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='select' />
    </>
  );
}
