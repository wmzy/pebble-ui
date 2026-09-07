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

// ─── Chart ─────────────────────────────────────────────────────
export default function ChartDemo() {
  return (
    <>
      <h1>Chart</h1>
      <p className={intro}>
        Line, area and bar charts over <a href='https://recharts.com'>recharts</a>{' '}
        (an optional peer — install it only if you render charts), with every
        color, font and grid line resolved from haze tokens. Series colors
        cycle through the semantic palette; pass your own as any CSS color
        string.
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
          {`<Chart type='bar' data={revenue} xKey='month' series={series} showLegend />`}
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
