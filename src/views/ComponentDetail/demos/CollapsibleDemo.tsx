import { css } from '@linaria/core';

import {
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// classNames 槽位演示：一条记录在 <Collapsible> 根上声明，经 context
// 分发到 trigger/content（键名见 CollapsibleClassNames）。
const framedRoot = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-3);
`;

const brandedTrigger = css`
  color: var(--haze-color-primary);
`;

const paddedContent = css`
  padding-top: var(--haze-space-3);
`;

// ─── Collapsible ────────────────────────────────────────────────
export default function CollapsibleDemo() {
  return (
    <>
      <h1>Collapsible</h1>
      <p className={intro}>Controlled collapsible section with trigger and content.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Collapsible>
          <CollapsibleTrigger>
            <Button variant='outline' size='sm'>Toggle Content</Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p style={{ padding: 'var(--haze-space-3) 0', margin: 0 }}>This content is shown when expanded.</p>
          </CollapsibleContent>
        </Collapsible>
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
          One <code>classNames</code> record on the{' '}
          <code>&lt;Collapsible&gt;</code> root reaches every
          sub-component through context (AntD v6 shape):{' '}
          <code>root</code>, <code>trigger</code> and <code>content</code>{' '}
          (the animated row). Here the trio gets a framed card look with
          a primary-toned trigger.
        </p>
        <Collapsible
          defaultOpen
          classNames={{ root: framedRoot, trigger: brandedTrigger, content: paddedContent }}
        >
          <CollapsibleTrigger>
            <Button variant='ghost' size='sm'>Toggle Content</Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p style={{ margin: 0 }}>The frame, trigger color and content spacing all come from the slot classes.</p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className={section}>
        <h2>Collapsible Props</h2>
        <PropsTable of='CollapsibleProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Trigger is a native <strong>&lt;button&gt;</strong></li>
            <li>Content toggles visibility on trigger click</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
