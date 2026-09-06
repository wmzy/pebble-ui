import { StepTimeline, StepTimelineItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── StepTimeline ─────────────────────────────────────────────
export default function StepTimelineDemo() {
  return (
    <>
      <h1>StepTimeline</h1>
      <p className={intro}>
        Vertical timeline showing steps with status markers (pending, active,
        done, error).
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 360 }}>
          <StepTimeline>
            <StepTimelineItem label='Connected' description='API linked' status='done' />
            <StepTimelineItem label='Processing' description='Analyzing data...' status='active' />
            <StepTimelineItem label='Review' status='pending' />
            <StepTimelineItem label='Deploy' status='pending' />
          </StepTimeline>
        </div>
      </div>

      <div className={section}>
        <h2>Error State</h2>
        <div style={{ maxWidth: 360 }}>
          <StepTimeline>
            <StepTimelineItem label='Upload' description='File sent' status='done' />
            <StepTimelineItem label='Validate' description='Schema mismatch' status='error' />
            <StepTimelineItem label='Complete' status='pending' />
          </StepTimeline>
        </div>
      </div>

      <div className={section}>
        <h2>StepTimeline Props</h2>
        <PropsTable of='StepTimelineProps' />
      </div>

      <div className={section}>
        <h2>StepTimelineItem Props</h2>
        <PropsTable of='StepTimelineItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Status is conveyed through color and icon (checkmark, exclamation)
            </li>
            <li>
              Connecting line uses CSS <strong>::before</strong> pseudo-element
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='steptimeline' />
    </>
  );
}
