import { Timeline, TimelineItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Timeline ───────────────────────────────────────────────────
export default function TimelineDemo() {
  return (
    <>
      <h1>Timeline</h1>
      <p className={intro}>Vertical timeline for displaying events in chronological order.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Timeline>
          <TimelineItem title='Order placed' description='Your order has been placed successfully.' time='2 minutes ago' color='primary' />
          <TimelineItem title='Payment confirmed' description='Payment processed.' time='1 minute ago' color='success' />
          <TimelineItem title='Shipped' description='Package is on its way.' color='warning' />
          <TimelineItem title='Delivered' />
        </Timeline>
      </div>

      <div className={section}>
        <h2>TimelineItem Props</h2>
        <PropsTable of='TimelineItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Container uses <strong>role=&quot;list&quot;</strong></li>
            <li>Each item uses <strong>role=&quot;listitem&quot;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
