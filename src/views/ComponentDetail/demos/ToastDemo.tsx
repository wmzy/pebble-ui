import { Button, ToastContainer, useToast } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Toast ─────────────────────────────────────────────────────
function ToastDemoInner() {
  const toast = useToast();

  return (
    <>
      <h1>Toast</h1>
      <p className={intro}>
        Temporary notification messages via useToast() hook.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button variant='outline' onClick={() => toast('Info toast message')}>
            Info
          </Button>
          <Button
            variant='outline'
            onClick={() => toast('Success!', { variant: 'success' })}
          >
            Success
          </Button>
          <Button
            variant='outline'
            onClick={() => toast('Warning toast', { variant: 'warning' })}
          >
            Warning
          </Button>
          <Button
            variant='outline'
            onClick={() => toast('Error occurred', { variant: 'danger' })}
          >
            Danger
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>useToast API</h2>
        <PropsTable
          props={[
            {
              name: 'content',
              type: 'ReactNode',
              description: 'Toast message (first argument)',
            },
            {
              name: 'options.variant',
              type: "'info' | 'success' | 'warning' | 'danger'",
              default: "'info'",
              description: 'Color variant',
            },
            {
              name: 'options.duration',
              type: 'number',
              default: '3000',
              description: 'Auto-dismiss time in ms',
            },
          ]}
        />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Each toast has <strong>role=&quot;alert&quot;</strong>
            </li>
            <li>
              Close button has <strong>aria-label=&quot;Close&quot;</strong>
            </li>
            <li>Toasts auto-dismiss after the configured duration</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='toast' />
    </>
  );
}

export default function ToastDemo() {
  return (
    <ToastContainer>
      <ToastDemoInner />
    </ToastContainer>
  );
}
