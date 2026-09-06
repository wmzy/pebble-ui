import { useState } from 'react';

import { Button, ApprovalCard } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── ApprovalCard ─────────────────────────────────────────────
export default function ApprovalCardDemo() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'denied'>('pending');

  return (
    <>
      <h1>ApprovalCard</h1>
      <p className={intro}>
        Card with approve/deny actions for human-in-the-loop workflows.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 400 }}>
          {status === 'pending' ? (
            <ApprovalCard
              title='Deploy to Production'
              description='This will deploy version 2.1.0 to all regions.'
              onApprove={() => setStatus('approved')}
              onDeny={() => setStatus('denied')}
            >
              <div style={{ fontSize: 'var(--haze-text-sm)' }}>
                Changes: 12 files modified, 3 new features
              </div>
            </ApprovalCard>
          ) : (
            <div
              style={{
                padding: 'var(--haze-space-4)',
                border: '1px solid var(--haze-color-border)',
                borderRadius: 'var(--haze-radius-md)',
                fontSize: 'var(--haze-text-sm)',
              }}
            >
              {status === 'approved' ? 'Deployment approved!' : 'Deployment denied.'}
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setStatus('pending')}
                style={{ marginLeft: 'var(--haze-space-2)' }}
              >
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ApprovalCardProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Buttons render as native <strong>&lt;button&gt;</strong> elements
            </li>
            <li>Warning border provides visual emphasis for required action</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='approvalcard' />
    </>
  );
}
