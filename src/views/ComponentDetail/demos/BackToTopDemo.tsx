import { BackToTop } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── BackToTop ──────────────────────────────────────────────────
export default function BackToTopDemo() {
  return (
    <>
      <h1>BackToTop</h1>
      <p className={intro}>Fixed scroll-to-top button that appears after scrolling.</p>

      <div className={section}>
        <h2>Demo</h2>
        <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)' }}>
          Scroll down to see the button appear at the bottom-right corner.
        </p>
        <BackToTop threshold={100} />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BackToTopProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>aria-label=&quot;Back to top&quot;</strong></li>
            <li>Smooth scroll animation</li>
            <li>Hidden with opacity and pointer-events when below threshold</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
