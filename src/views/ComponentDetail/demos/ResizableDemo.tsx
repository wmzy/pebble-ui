import { ResizableGroup, ResizablePanel, ResizableHandle } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Resizable ──────────────────────────────────────────────────
export default function ResizableDemo() {
  return (
    <>
      <h1>Resizable</h1>
      <p className={intro}>Resizable panels with draggable handles.</p>

      <div className={section}>
        <h2>Horizontal</h2>
        <div style={{ height: 200, border: '1px solid var(--haze-color-border)', borderRadius: 'var(--haze-radius-md)' }}>
          <ResizableGroup>
            <ResizablePanel defaultSize={50}>
              <div style={{ padding: 'var(--haze-space-3)', height: '100%' }}>Left Panel</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50}>
              <div style={{ padding: 'var(--haze-space-3)', height: '100%' }}>Right Panel</div>
            </ResizablePanel>
          </ResizableGroup>
        </div>
      </div>

      <div className={section}>
        <h2>ResizableGroup Props</h2>
        <PropsTable of='ResizableGroupProps' />
      </div>

      <div className={section}>
        <h2>ResizablePanel Props</h2>
        <PropsTable of='ResizablePanelProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Handle uses <strong>role=&quot;separator&quot;</strong> with <strong>aria-orientation</strong></li>
            <li>Cursor changes to col-resize or row-resize based on direction</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
