import { Stat, StatGroup } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Stat ───────────────────────────────────────────────────────
export default function StatDemo() {
  return (
    <>
      <h1>Stat</h1>
      <p className={intro}>Statistics display with trend indicators.</p>

      <div className={section}>
        <h2>Demo</h2>
        <StatGroup>
          <Stat title='Total Users' value='12,345' trend='up' trendValue='12%' description='vs last month' />
          <Stat title='Revenue' value='$45,678' trend='down' trendValue='3%' description='vs last month' />
          <Stat title='Active Now' value='89%' trend='neutral' trendValue='0%' />
        </StatGroup>
      </div>

      <div className={section}>
        <h2>Stat Props</h2>
        <PropsTable of='StatProps' />
      </div>

      <div className={section}>
        <h2>StatGroup Props</h2>
        <PropsTable of='StatGroupProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Purely presentational components</li>
            <li>Trend uses color and arrow symbols for visual indication</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
