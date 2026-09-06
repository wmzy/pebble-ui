import { VirtualList } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── VirtualList ────────────────────────────────────────────────
export default function VirtualListDemo() {
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);

  return (
    <>
      <h1>VirtualList</h1>
      <p className={intro}>Virtualized list for rendering large datasets efficiently.</p>

      <div className={section}>
        <h2>Demo</h2>
        <VirtualList
          items={items}
          height={300}
          itemHeight={32}
          renderItem={(item) => (
            <div style={{ padding: '0 var(--haze-space-3)', lineHeight: '32px', borderBottom: '1px solid var(--haze-color-border)' }}>
              {item}
            </div>
          )}
        />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='VirtualListProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Only visible items are rendered in the DOM</li>
            <li>Uses absolute positioning for item placement</li>
            <li>Native scroll behavior is preserved</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
