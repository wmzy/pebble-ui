import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import {
  Button,
  CodeBlock,
  Flex,
  Input,
  List,
  ListItem,
  Option,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  spacing,
} from '@/lib';
import { COMPACT_OVERRIDES, compact } from '@/lib/tokens/density';
import { SPACING_DEFAULTS } from '@/lib/tokens/spacing';
import { intro, page, section } from '@/views/ComponentDetail/styles';

/*
 * Density guide: the compact class (tokens/density), the 75% spacing scale
 * behind it, the indirect-addressing mechanism that makes it compose with
 * any theme class in any order, and a live default-vs-compact comparison.
 */

const paragraph = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
  margin: 0 0 var(--haze-space-4);
`;

const inlineCode = css`
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  padding: 0.15em 0.4em;
  font-family: var(--haze-font-mono);
  font-size: 0.9em;
`;

const codeMargin = css`
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const note = css`
  background: var(--haze-color-primary-subtle);
  border-left: 3px solid var(--haze-color-primary);
  border-radius: 0 var(--haze-radius-md) var(--haze-radius-md) 0;
  padding: var(--haze-space-3) var(--haze-space-4);
  margin: var(--haze-space-4) 0;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-normal);
`;

const islandRow = css`
  display: flex;
  gap: var(--haze-space-4);
  flex-wrap: wrap;
  align-items: flex-start;
  margin: var(--haze-space-4) 0 var(--haze-space-2);
`;

const island = css`
  flex: 1;
  min-width: 240px;
  max-width: 360px;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
`;

const islandTitle = css`
  font-weight: var(--haze-weight-semibold);
  font-size: var(--haze-text-sm);
`;

const islandSample = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
`;

const demoCaption = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  margin: 0 0 var(--haze-space-6);
`;

const demoStatus = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-mono);
  margin: 0 0 var(--haze-space-3);
`;

const tableWrap = css`
  overflow-x: auto;
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const scaleTable = css`
  border-collapse: collapse;
  width: 100%;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);

  th,
  td {
    border: 1px solid var(--haze-color-border);
    padding: var(--haze-space-2) var(--haze-space-3);
    text-align: start;
    vertical-align: top;
  }

  th {
    background: var(--haze-color-bg-subtle);
    font-weight: var(--haze-weight-medium);
  }

  code {
    font-family: var(--haze-font-mono);
    font-size: 0.9em;
  }
`;

const px = (value: string): number => Number.parseFloat(value);

// Scale table rows come straight from the shipped constants, so the guide
// can never drift from what the classes actually declare.
const SCALE_ROWS = Object.entries(SPACING_DEFAULTS)
  .map(([token, value]) => ({
    token,
    value,
    compact: COMPACT_OVERRIDES[
      token.replace('--haze-space-', '--haze-density-space-') as keyof typeof COMPACT_OVERRIDES
    ],
  }))
  .sort((a, b) => px(a.value) - px(b.value));

const SHIP_ROWS = [
  { name: 'Alice', role: 'Engineer', status: 'Active' },
  { name: 'Bob', role: 'Designer', status: 'Away' },
];

/** The sample set both density islands render — only the container differs. */
function DensitySamples() {
  return (
    <div className={islandSample}>
      <Flex gap='var(--haze-space-2)' wrap>
        <Button size='sm'>Small</Button>
        <Button size='md'>Medium</Button>
        <Button size='sm' variant='outline'>
          Outline
        </Button>
      </Flex>
      <Input size='sm' placeholder='Input' aria-label='Density sample input' />
      <Select size='sm' aria-label='Density sample select'>
        <Option value='a'>Option A</Option>
        <Option value='b'>Option B</Option>
      </Select>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell as='th'>Name</TableCell>
            <TableCell as='th'>Role</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {SHIP_ROWS.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <List variant='unordered'>
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
      </List>
    </div>
  );
}

/**
 * Live default-vs-compact comparison. The right island re-declares the
 * spacing class next to compact — custom properties substitute eagerly at
 * the element that declares them, so a compact island inside a page that
 * already carries spacing must re-declare the scale locally.
 */
function DensityCompareDemo() {
  // Control triple: the Switch takes the control, nothing else writes it.
  const [compactOn, , compactCtrl] = useControl(undefined, false);

  return (
    <div>
      <div className={demoStatus}>
        <Switch checked={compactCtrl} aria-label='Toggle compact density' />
        compact: {compactOn ? 'on (right column)' : 'off'}
      </div>
      <div className={islandRow}>
        <div className={island}>
          <span className={islandTitle}>Default</span>
          <DensitySamples />
        </div>
        <div x-class={[island, spacing, compactOn && compact]}>
          <span className={islandTitle}>Compact (spacing + compact)</span>
          <DensitySamples />
        </div>
      </div>
      <p className={demoCaption}>
        Identical components, identical markup — the right column only adds{' '}
        <code className={inlineCode}>compact</code> next to a local{' '}
        <code className={inlineCode}>spacing</code>. Every{' '}
        <code className={inlineCode}>--haze-space-*</code> reference inside
        (button padding, table cells, list rhythm, the island&apos;s own gap)
        re-resolves to 75%.
      </p>
    </div>
  );
}

export default function DensityGuide() {
  return (
    <div className={page}>
      <h1>Density (compact)</h1>
      <p className={intro}>
        haze-ui&apos;s spacing scale is a set of{' '}
        <code className={inlineCode}>--haze-space-*</code> custom properties
        declared by the <code className={inlineCode}>spacing</code> class.
        Density is a second dimension on top:{' '}
        <code className={inlineCode}>compact</code> shrinks the whole scale
        to 75% — denser paddings, tighter rows, smaller panels — with zero
        per-component code. Add one class next to your token classes and
        every component re-resolves.
      </p>

      <div className={section}>
        <h2>The compact scale</h2>
        <p className={paragraph}>
          Every step of the default scale is on a 4px grid, so 75% of each
          step lands on an exact pixel — no fractional values, nothing
          rounds. The zero step has no compact form: zero is zero at any
          density. Radius, shadow and typography are deliberately not
          density-scaled — <code className={inlineCode}>compact</code>{' '}
          answers the spacing indirection only.
        </p>
        <div className={tableWrap}>
          <table className={scaleTable}>
            <thead>
              <tr>
                <th>token</th>
                <th>default</th>
                <th>compact</th>
              </tr>
            </thead>
            <tbody>
              {SCALE_ROWS.map((row) => (
                <tr key={row.token}>
                  <td>
                    <code>{row.token}</code>
                  </td>
                  <td>
                    <code>{row.value}</code>
                  </td>
                  <td>
                    <code>{row.compact}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={section}>
        <h2>Using compact</h2>
        <p className={paragraph}>
          Put <code className={inlineCode}>compact</code> on the same element
          that carries <code className={inlineCode}>spacing</code> — your app
          root next to the theme classes, or any subtree for a scoped
          island. The order of class names in the string does not matter:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { lightTheme, compact, spacing, typography } from 'haze-ui';

// app root — compact sits next to spacing; any class order works
<div className={\`\${lightTheme} \${compact} \${spacing} \${typography}\`}>
  <App />
</div>

// a compact island inside a default-density page: re-declare spacing
// on the subtree so the scale re-resolves there
<section className={\`\${spacing} \${compact}\`}>
  <DataTable … />
</section>`}
        </CodeBlock>
        <div className={note}>
          <strong>Why order never matters.</strong> A density class that
          re-declared <code className={inlineCode}>--haze-space-3</code>{' '}
          directly would collide with the{' '}
          <code className={inlineCode}>spacing</code> class at the same
          specificity, leaving the winner to stylesheet emission order —
          which differs between per-component css bundles and consumer
          setups. Instead, <code className={inlineCode}>spacing</code>{' '}
          declares{' '}
          <code className={inlineCode}>--haze-space-3: var(--haze-density-space-3, 12px)</code>{' '}
          and <code className={inlineCode}>compact</code> only ever declares{' '}
          <code className={inlineCode}>--haze-density-space-3</code>. The two
          classes never write the same property name, so there is nothing to
          win or lose: the var() reference is substituted eagerly on the
          element that declares it, picking up whatever{' '}
          <code className={inlineCode}>--haze-density-space-3</code> value
          that same element carries — 12px without{' '}
          <code className={inlineCode}>compact</code>, 9px with it. That is
          also why compact must land on (or re-declare{' '}
          <code className={inlineCode}>spacing</code> at) the element you
          want densified: a <code className={inlineCode}>--haze-density-*</code>{' '}
          value on a descendant cannot retroactively change the already
          substituted value it inherits.
        </div>
        <div className={note}>
          <strong>Composability.</strong>{' '}
          <code className={inlineCode}>compact</code> touches only the
          density indirection, so it stacks freely with{' '}
          <code className={inlineCode}>lightTheme</code>,{' '}
          <code className={inlineCode}>darkTheme</code> and the brand preset
          themes — dark compact, violet compact, any combination, in any
          class order.
        </div>
      </div>

      <div className={section}>
        <h2>Live comparison</h2>
        <p className={paragraph}>
          The same Button, Input, Select, Table and List rendered twice —
          the right column adds{' '}
          <code className={inlineCode}>compact</code>. Flip the switch:
        </p>
        <DensityCompareDemo />
      </div>
    </div>
  );
}
