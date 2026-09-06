import { useControl } from 'react-use-control';

import { Button, Stepper, Step } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Stepper ───────────────────────────────────────────────────
export default function StepperDemo() {
  const [active, setActive, activeCtrl] = useControl(undefined, 1);

  return (
    <>
      <h1>Stepper</h1>
      <p className={intro}>Step-by-step progress indicator for multi-step flows.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Stepper activeStep={activeCtrl}>
          <Step title='Account' description='Create account' />
          <Step title='Profile' description='Add details' />
          <Step title='Confirm' description='Review & submit' />
        </Stepper>
        <div className={row} style={{ marginTop: 'var(--haze-space-4)' }}>
          <Button size='sm' variant='outline' onClick={() => { setActive(Math.max(0, active - 1)); }} disabled={active <= 0}>
            Back
          </Button>
          <Button size='sm' onClick={() => { setActive(Math.min(2, active + 1)); }} disabled={active >= 2}>
            Next
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Stepper Props</h2>
        <PropsTable of='StepperProps' />
      </div>

      <div className={section}>
        <h2>Step Props</h2>
        <PropsTable of='StepProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Container uses <strong>role=&quot;list&quot;</strong>
            </li>
            <li>
              Each step uses <strong>role=&quot;listitem&quot;</strong>
            </li>
            <li>
              Visual state (active/completed/pending) is conveyed through color and icon
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='stepper' />
    </>
  );
}
