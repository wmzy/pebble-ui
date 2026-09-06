import { ScrollArea } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── ScrollArea ─────────────────────────────────────────────────
export default function ScrollAreaDemo() {
  return (
    <>
      <h1>ScrollArea</h1>
      <p className={intro}>Container with custom styled scrollbar.</p>

      <div className={section}>
        <h2>Demo</h2>
        <ScrollArea maxHeight={200}>
          <div style={{ padding: 'var(--haze-space-2)' }}>
            {Array.from({ length: 30 }, (_, i) => (
              <p key={i} style={{ margin: '0 0 var(--haze-space-2)' }}>Scrollable item {i + 1}</p>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ScrollAreaProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses native overflow with custom scrollbar styling</li>
            <li>Scrollbar is thin and styled via CSS custom properties</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
