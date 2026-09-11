// Direct component import until the barrel wiring lands with the Wave 3
// shared-file patches (DescriptionsDemo/JsonViewDemo precedent).
import { Result } from '@/lib/components/Result';
import { Button } from '@/lib';

import PropsTable from '../PropsTable';
import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Result ─────────────────────────────────────────────────────
export default function ResultDemo() {
  return (
    <>
      <h1>Result</h1>
      <p className={intro}>
        Feedback page for success, failure and not-found outcomes.
      </p>

      <div className={section}>
        <h2>Success / Error / Info / Warning</h2>
        <Result
          status='success'
          title='Purchase completed'
          subTitle='A receipt has been sent to your email address.'
          extra={<Button size='sm'>View receipt</Button>}
        />
        <Result
          status='error'
          title='Submission failed'
          subTitle='Please correct the two fields below and try again.'
          extra={
            <>
              <Button size='sm'>Retry</Button>
              <Button size='sm' variant='outline'>
                Go back
              </Button>
            </>
          }
        />
        <Result status='info' title='Maintenance window' subTitle='The dashboard will be read-only until 03:00 UTC.' />
        <Result status='warning' title='Storage almost full' subTitle='4.7 GB of 5 GB used. Old uploads will be purged in 7 days.' />
      </div>

      <div className={section}>
        <h2>404 Page</h2>
        <Result
          status='404'
          title='404'
          subTitle='Sorry, the page you visited does not exist.'
          extra={<Button size='sm'>Back to home</Button>}
        />
      </div>

      <div className={section}>
        <h2>Custom Icon</h2>
        <Result
          icon={<span style={{ fontSize: 48 }}>🎉</span>}
          title='Deployment created'
          subTitle='haze-ui v1.14.0 is rolling out to production.'
        />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ResultProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Default illustrations are decorative SVGs (<strong>aria-hidden</strong>) — title and subTitle carry the message
            </li>
            <li>
              Provide an <strong>icon</strong> to swap in a meaningful image with its own accessible name
            </li>
            <li>
              The <strong>extra</strong> area is a flex row — use real buttons or links for actions
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='result' />
    </>
  );
}
