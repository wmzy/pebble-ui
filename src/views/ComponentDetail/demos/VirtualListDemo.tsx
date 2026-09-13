import { VirtualList } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── VirtualList ────────────────────────────────────────────────
export default function VirtualListDemo() {
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);
  const cards = Array.from({ length: 2000 }, (_, i) => `Card ${i + 1}`);
  const tiles = Array.from({ length: 3000 }, (_, i) => i + 1);

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
        <h2>Horizontal orientation</h2>
        <p>
          <code>orientation=&quot;horizontal&quot;</code> mirrors the windowing system onto the
          x axis: <code>itemHeight</code> is each item&rsquo;s width, sticky group headers pin
          to the inline-start edge, and offsets stay logical so RTL keeps item 0 at the
          inline-start (right) edge. Pass <code>width</code> to fix the scrollport width;
          otherwise it fills its container.
        </p>
        <VirtualList
          orientation="horizontal"
          items={cards}
          height={150}
          itemHeight={200}
          overscan={2}
          renderItem={(item) => (
            <div
              style={{
                boxSizing: 'border-box',
                height: '100%',
                padding: 'var(--haze-space-3)',
                background: 'var(--haze-color-bg-subtle)',
                border: '1px solid var(--haze-color-border)',
                borderRadius: 'var(--haze-radius-md)',
                fontSize: 'var(--haze-text-sm)',
                color: 'var(--haze-color-text-secondary)',
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              {item}
            </div>
          )}
        />
      </div>

      <div className={section}>
        <h2>Grid mode (columns)</h2>
        <p>
          <code>columns &gt; 1</code> virtualizes both axes: rows are windowed like a
          vertical list (<code>itemHeight</code> = row height, dynamic measurement
          included), columns are windowed against the rendered width
          (<code>columnWidth</code>, defaulting to <code>itemHeight</code>). Items flow
          row-major; <code>scrollToIndex</code> maps an item index onto its row and
          column. Grid mode is vertical-only.
        </p>
        <VirtualList
          items={tiles}
          columns={6}
          columnWidth={120}
          height={360}
          itemHeight={100}
          overscan={2}
          renderItem={(item) => (
            <div
              style={{
                boxSizing: 'border-box',
                height: '100%',
                padding: 'var(--haze-space-2)',
                background: 'var(--haze-color-primary-subtle)',
                borderRadius: 'var(--haze-radius-md)',
                fontSize: 'var(--haze-text-base)',
                color: 'var(--haze-color-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
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
            <li>Horizontal and grid modes keep the same native-scroll semantics — arrow keys, wheel and touch all work</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
