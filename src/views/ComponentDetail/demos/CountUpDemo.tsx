import { useState } from 'react';

import { css } from '@linaria/core';

import { CountUp, Button, Stat, StatGroup  } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// CountUp inherits size and color; give the standalone examples stat weight.
const big = css`
  font-size: var(--haze-text-2xl);
  font-weight: var(--haze-weight-bold);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-tight);
`;

const row = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--haze-space-4);
`;

/** `to` is a plain prop — changing it re-animates from the shown value. */
function RetriggerExample() {
  const [target, setTarget] = useState(500);
  return (
    <div className={row}>
      <CountUp to={target} duration={1200} className={big} />
      <Button size='sm' variant='outline' onClick={() => setTarget(target + 500)}>
        +500
      </Button>
    </div>
  );
}

// ─── CountUp ───────────────────────────────────────────────────
export default function CountUpDemo() {
  return (
    <>
      <h1>CountUp</h1>
      <p className={intro}>
        Animated number transitions with rAF + ease-out cubic; honors
        prefers-reduced-motion with an instant jump.
      </p>

      <div className={section}>
        <h2>Basic</h2>
        <CountUp to={9821} duration={1800} className={big} />
      </div>

      <div className={section}>
        <h2>Decimals & custom format</h2>
        <div className={row}>
          <CountUp to={98.76} decimals={2} duration={1600} className={big} />
          <CountUp to={4200} duration={1600} className={big} format={(n) => `$${n.toLocaleString()}`} />
        </div>
      </div>

      <div className={section}>
        <h2>Re-animating on target change</h2>
        <RetriggerExample />
      </div>

      <div className={section}>
        <h2>With Stat</h2>
        <StatGroup>
          <Stat
            title='Bandwidth used'
            value='GB'
            prefix={<CountUp to={9820.4} decimals={1} duration={2000} className={big} />}
            trend='up'
            trendValue='+8%'
          />
          <Stat
            title='Error rate'
            value='%'
            prefix={<CountUp to={0.42} decimals={2} duration={1600} className={big} />}
            trend='down'
            trendValue='-0.05pt'
            description='4xx + 5xx share of total requests'
          />
        </StatGroup>
      </div>

      <div className={section}>
        <h2>CountUp Props</h2>
        <PropsTable of='CountUpProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Counts are presentational — pair with a labeled container (e.g. Stat&#39;s <code>title</code>) for semantics</li>
            <li><code>prefers-reduced-motion: reduce</code> skips the animation entirely (value jumps to the target)</li>
            <li><code>font-variant-numeric: tabular-nums</code> keeps digit widths stable while counting</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
