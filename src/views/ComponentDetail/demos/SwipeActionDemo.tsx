import { SwipeAction } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── SwipeAction ────────────────────────────────────────────────
export default function SwipeActionDemo() {
  return (
    <>
      <h1>SwipeAction</h1>
      <p className={intro}>Swipe-to-reveal actions for touch and pointer interactions.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 400, border: '1px solid var(--haze-color-border)', borderRadius: 'var(--haze-radius-md)' }}>
          <SwipeAction
            left={<div style={{ padding: 'var(--haze-space-3)', color: 'var(--haze-color-success)' }}>Archive</div>}
            right={<div style={{ padding: 'var(--haze-space-3)', color: 'var(--haze-color-danger)' }}>Delete</div>}
          >
            <div style={{ padding: 'var(--haze-space-4)', background: 'var(--haze-color-bg)' }}>Swipe left or right</div>
          </SwipeAction>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SwipeActionProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses pointer events for cross-device support</li>
            <li>Content slides with CSS transform</li>
            <li>Resets position on pointer release</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
