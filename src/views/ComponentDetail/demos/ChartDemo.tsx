import { Chart } from '@/lib/components/Chart';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row, codeBlock } from '../styles';

const revenue = [
  { month: 'Jan', saas: 28, services: 12 },
  { month: 'Feb', saas: 32, services: 14 },
  { month: 'Mar', saas: 36, services: 11 },
  { month: 'Apr', saas: 44, services: 16 },
  { month: 'May', saas: 41, services: 19 },
  { month: 'Jun', saas: 52, services: 21 },
];

const productMix = [
  { product: 'SaaS', revenue: 46 },
  { product: 'Services', revenue: 28 },
  { product: 'Support', revenue: 16 },
  { product: 'Training', revenue: 10 },
];

const skills = [
  { skill: 'Syntax', you: 8, team: 6 },
  { skill: 'Types', you: 7, team: 7 },
  { skill: 'Runtime', you: 6, team: 5 },
  { skill: 'Tooling', you: 9, team: 6 },
  { skill: 'Testing', you: 7, team: 8 },
];

const cohort = [
  { height: 150, runners: 48, lifters: 55 },
  { height: 158, runners: 52, lifters: 60 },
  { height: 166, runners: 55, lifters: 68 },
  { height: 174, runners: 59, lifters: 75 },
  { height: 182, runners: 63, lifters: 82 },
  { height: 190, runners: 66, lifters: 90 },
];

// ─── Chart ─────────────────────────────────────────────────────
export default function ChartDemo() {
  return (
    <>
      <h1>Chart</h1>
      <p className={intro}>
        Line, area, bar, pie, donut, radar and scatter charts over{' '}
        <a href='https://recharts.com'>recharts</a> (an optional peer —
        install it only if you render charts), with every color, font and
        grid line resolved from haze tokens. Series colors cycle through
        the semantic palette; pass your own as any CSS color string.
      </p>

      <div className={section}>
        <h2>Line chart</h2>
        <div className={row}>
          <Chart
            type='line'
            data={revenue}
            xKey='month'
            series={[
              { key: 'saas', label: 'SaaS' },
              { key: 'services', label: 'Services' },
            ]}
            showLegend
          />
        </div>
        <pre className={codeBlock}>
          {`<Chart
  type='line'
  data={revenue}
  xKey='month'
  series={[{ key: 'saas', label: 'SaaS' }, { key: 'services', label: 'Services' }]}
  showLegend
/>`}
        </pre>
      </div>

      <div className={section}>
        <h2>Area chart</h2>
        <div className={row}>
          <Chart
            type='area'
            data={revenue}
            xKey='month'
            series={[{ key: 'saas', label: 'SaaS' }]}
            height={220}
          />
        </div>
        <pre className={codeBlock}>
          {`<Chart type='area' data={revenue} xKey='month' series={[{ key: 'saas' }]} height={220} />`}
        </pre>
      </div>

      <div className={section}>
        <h2>Bar chart</h2>
        <div className={row}>
          <Chart
            type='bar'
            data={revenue}
            xKey='month'
            series={[
              { key: 'saas', label: 'SaaS' },
              { key: 'services', label: 'Services' },
            ]}
            showLegend
          />
        </div>
        <pre className={codeBlock}>
          {`<Chart
  type='bar'
  data={revenue}
  xKey='month'
  series={[{ key: 'saas', label: 'SaaS' }, { key: 'services', label: 'Services' }]}
  showLegend
/>`}
        </pre>
      </div>

      <div className={section}>
        <h2>Custom series colors</h2>
        <p className={row}>
          Any CSS color works, including <code>var(--haze-color-…)</code>{' '}
          tokens or hex values from your own palette.
        </p>
        <div className={row}>
          <Chart
            type='line'
            data={revenue}
            xKey='month'
            series={[
              { key: 'saas', color: 'var(--haze-color-danger)' },
              { key: 'services', color: 'var(--haze-color-info)' },
            ]}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Pie &amp; donut</h2>
        <p className={row}>
          Each datum is one sector named by <code>xKey</code>;{' '}
          <code>innerRadius</code> above 0 turns the pie into a donut. Sector
          fills cycle the semantic palette (wrapping past five sectors).
        </p>
        <div className={row}>
          <Chart
            type='pie'
            data={productMix}
            xKey='product'
            series={[{ key: 'revenue' }]}
            height={240}
            showLegend
          />
          <Chart
            type='pie'
            data={productMix}
            xKey='product'
            series={[{ key: 'revenue' }]}
            innerRadius={60}
            height={240}
            showLegend
          />
        </div>
        <pre className={codeBlock}>
          {`<Chart
  type='pie'
  data={productMix}
  xKey='product'
  series={[{ key: 'revenue' }]}
  innerRadius={60}
  showLegend
/>`}
        </pre>
      </div>

      <div className={section}>
        <h2>Custom tooltip</h2>
        <p className={row}>
          <code>renderTooltip</code> replaces the recharts default with your
          own markup — hover the chart to see it. It receives the hovered
          label plus one entry per series (or sector) with{' '}
          <code>name</code>, <code>value</code>, <code>color</code> and the
          source <code>dataEntry</code>.
        </p>
        <div className={row}>
          <Chart
            type='line'
            data={revenue}
            xKey='month'
            series={[
              { key: 'saas', label: 'SaaS' },
              { key: 'services', label: 'Services' },
            ]}
            renderTooltip={(payload) => (
              <div
                style={{
                  background: 'var(--haze-color-bg)',
                  border: '1px solid var(--haze-color-border)',
                  borderRadius: 'var(--haze-radius-md)',
                  padding: 'var(--haze-space-2) var(--haze-space-3)',
                  fontSize: 'var(--haze-text-sm)',
                }}
              >
                <strong>{String(payload.label)}</strong>
                {payload.entries.map((entry) => (
                  <div key={entry.name} style={{ color: entry.color }}>
                    {entry.name}: {String(entry.value)}
                  </div>
                ))}
              </div>
            )}
          />
        </div>
        <pre className={codeBlock}>
          {`<Chart
  type='line'
  data={revenue}
  xKey='month'
  series={[{ key: 'saas', label: 'SaaS' }, { key: 'services', label: 'Services' }]}
  renderTooltip={(payload) => (
    <div>
      <strong>{String(payload.label)}</strong>
      {payload.entries.map((entry) => (
        <div key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {String(entry.value)}
        </div>
      ))}
    </div>
  )}
/>`}
        </pre>
      </div>

      <div className={section}>
        <h2>Horizontal bars</h2>
        <p className={row}>
          <code>{"layout='vertical'"}</code> on the cartesian charts swaps the
          axes — bars grow left-to-right from category labels.
        </p>
        <div className={row}>
          <Chart
            type='bar'
            layout='vertical'
            data={revenue}
            xKey='month'
            series={[{ key: 'saas', label: 'SaaS' }]}
            height={240}
          />
        </div>
        <pre className={codeBlock}>
          {`<Chart
  type='bar'
  layout='vertical'
  data={revenue}
  xKey='month'
  series={[{ key: 'saas' }]}
  height={240}
/>`}
        </pre>
      </div>

      <div className={section}>
        <h2>Radar chart</h2>
        <p className={row}>
          Each datum is one spoke named by <code>xKey</code>; every series is
          one translucent polygon over the spokes, so overlapping series stay
          readable.
        </p>
        <div className={row}>
          <Chart
            type='radar'
            data={skills}
            xKey='skill'
            series={[
              { key: 'you', label: 'You' },
              { key: 'team', label: 'Team average' },
            ]}
            showLegend
          />
        </div>
        <pre className={codeBlock}>
          {`<Chart
  type='radar'
  data={skills}
  xKey='skill'
  series={[{ key: 'you', label: 'You' }, { key: 'team', label: 'Team average' }]}
  showLegend
/>`}
        </pre>
      </div>

      <div className={section}>
        <h2>Scatter chart</h2>
        <p className={row}>
          Both axes are numeric: <code>xKey</code> picks the X column and each
          series <code>key</code> the Y column — one point per datum, one
          point set per series.
        </p>
        <div className={row}>
          <Chart
            type='scatter'
            data={cohort}
            xKey='height'
            series={[
              { key: 'runners', label: 'Runners' },
              { key: 'lifters', label: 'Lifters' },
            ]}
            showLegend
          />
        </div>
        <pre className={codeBlock}>
          {`<Chart
  type='scatter'
  data={cohort}
  xKey='height'
  series={[{ key: 'runners', label: 'Runners' }, { key: 'lifters', label: 'Lifters' }]}
  showLegend
/>`}
        </pre>
      </div>

      <div className={section}>
        <h2>Chart Props</h2>
        <PropsTable of='ChartProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Charts are informative graphics — pair them with a text or table
              alternative for screen-reader users (the demo data tables are a
              good pattern)
            </li>
            <li>
              Colors default to semantic tokens that meet contrast rules on
              both light and dark themes
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
