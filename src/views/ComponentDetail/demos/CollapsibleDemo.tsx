import {
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

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
