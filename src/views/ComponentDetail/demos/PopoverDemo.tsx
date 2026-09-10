import { css } from '@linaria/core';

import { Button, Popover } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// classNames 槽位演示：trigger 落在触发器包裹元素上、content 落在浮层
// 面板上（键名见 PopoverClassNames）。
const haloTrigger = css`
  outline: 2px dashed var(--haze-color-primary);
  outline-offset: var(--haze-space-2);
`;

const brandedPanel = css`
  border-color: var(--haze-color-primary);
`;

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
        <h2>classNames slots</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          The <code>classNames</code> record targets the two structural
          parts (AntD v6 shape): <code>trigger</code> lands on the
          clickable wrapper around the children, <code>content</code> on
          the floating panel. Here the trigger gets a primary halo and
          the panel a primary border.
        </p>
        <div className={row}>
          <Popover
            content={<div>The panel border comes from the content slot.</div>}
            classNames={{ trigger: haloTrigger, content: brandedPanel }}
          >
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
