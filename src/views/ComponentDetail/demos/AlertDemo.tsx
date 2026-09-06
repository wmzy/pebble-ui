import { useState } from 'react';

import { Button, Alert } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Alert ─────────────────────────────────────────────────────
export default function AlertDemo() {
  const [key, setKey] = useState(0);

  return (
    <>
      <h1>Alert</h1>
      <p className={intro}>Contextual feedback messages for user actions.</p>

      <div className={section}>
        <h2>Variants</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
            maxWidth: 480,
          }}
        >
          <Alert variant='info'>This is an informational alert.</Alert>
          <Alert variant='success'>Operation completed successfully.</Alert>
          <Alert variant='warning'>Please review before proceeding.</Alert>
          <Alert variant='danger'>An error occurred. Please try again.</Alert>
        </div>
      </div>

      <div className={section}>
        <h2>Closable</h2>
        <div style={{ maxWidth: 480 }}>
          <Alert key={key} variant='info' closable>
            This alert can be dismissed. Click the × button.
          </Alert>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setKey((k) => k + 1)}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AlertProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;alert&quot;</strong> — announced by screen
              readers immediately
            </li>
            <li>
              Close button has <strong>aria-label=&quot;Close&quot;</strong>
            </li>
            <li>Focus management: close button is keyboard accessible</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='alert' />
    </>
  );
}
