import { AspectRatio } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── AspectRatio ────────────────────────────────────────────────
export default function AspectRatioDemo() {
  return (
    <>
      <h1>AspectRatio</h1>
      <p className={intro}>Container that maintains a fixed aspect ratio.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 400 }}>
          <AspectRatio ratio={16 / 9}>
            <div style={{ width: '100%', height: '100%', background: 'var(--haze-color-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              16:9
            </div>
          </AspectRatio>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AspectRatioProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses CSS <strong>padding-bottom</strong> technique for ratio</li>
            <li>Content is absolutely positioned inside</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
