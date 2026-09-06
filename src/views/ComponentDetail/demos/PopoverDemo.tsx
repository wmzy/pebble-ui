import { Button, Popover } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Popover ───────────────────────────────────────────────────
export default function PopoverDemo() {
  return (
    <>
      <h1>Popover</h1>
      <p className={intro}>
        Click-triggered floating panel for additional content.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Popover content={<div>Popover content goes here.</div>}>
            <Button variant='outline'>Toggle Popover</Button>
          </Popover>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='PopoverProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Trigger has <strong>aria-expanded</strong> and{' '}
              <strong>aria-controls</strong>
            </li>
            <li>
              Panel is hidden with <strong>display: none</strong> when closed
            </li>
            <li>Click trigger to toggle open/close</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='popover' />
    </>
  );
}
