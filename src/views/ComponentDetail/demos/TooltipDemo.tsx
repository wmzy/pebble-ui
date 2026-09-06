import { Button, Tooltip } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Tooltip ───────────────────────────────────────────────────
export default function TooltipDemo() {
  return (
    <>
      <h1>Tooltip</h1>
      <p className={intro}>
        Informational popup triggered by hover or focus, using pure CSS.
      </p>

      <div className={section}>
        <h2>Positions</h2>
        <div className={row}>
          <Tooltip content='Top tooltip' position='top'>
            <Button variant='outline'>Top</Button>
          </Tooltip>
          <Tooltip content='Bottom tooltip' position='bottom'>
            <Button variant='outline'>Bottom</Button>
          </Tooltip>
          <Tooltip content='Left tooltip' position='left'>
            <Button variant='outline'>Left</Button>
          </Tooltip>
          <Tooltip content='Right tooltip' position='right'>
            <Button variant='outline'>Right</Button>
          </Tooltip>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TooltipProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;tooltip&quot;</strong> with{' '}
              <strong>aria-describedby</strong>
            </li>
            <li>
              Visible on <strong>hover</strong> and{' '}
              <strong>focus-within</strong>
            </li>
            <li>Content is always in the DOM for screen readers</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tooltip' />
    </>
  );
}
