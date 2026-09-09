import { Button, ToastContainer, useToast } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Toast ─────────────────────────────────────────────────────
/** Fake network op: settles after 1.5s, rejecting when `fail`. */
function fakeRequest(fail: boolean) {
  return new Promise<string>((resolve, reject) => {
    window.setTimeout(() => {
      if (fail) reject(new Error('Request timed out'));
      else resolve('record #42');
    }, 1500);
  });
}

function ToastDemoInner() {
  const toast = useToast();

  /** Fires a persistent toast, then patches it in place as a fake upload
   * progresses — the toast element never remounts, so no enter/exit
   * animation replays; only the final step arms the auto-dismiss timer. */
  const simulateProgress = () => {
    const id = toast('Uploading report… 0%', { duration: 0 });
    const steps = [25, 55, 80, 100];
    const advance = (index: number) => {
      const progress = steps[index];
      if (progress === undefined) return;
      window.setTimeout(() => {
        if (progress === 100) {
          toast.update(id, {
            content: 'Report uploaded',
            variant: 'success',
            duration: 3000,
          });
        } else {
          toast.update(id, { content: `Uploading report… ${progress}%` });
        }
        advance(index + 1);
      }, 500);
    };
    advance(0);
  };

  return (
    <>
      <h1>Toast</h1>
      <p className={intro}>
        Temporary notification messages via useToast() hook (or the
        module-level <code>toast()</code> twin).
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
          <Button variant='outline' onClick={simulateProgress}>
            update (progress)
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              void toast.promise(fakeRequest(false), {
                loading: 'Saving record…',
                success: (data) => `Saved ${data}`,
              });
            }}
          >
            promise (success)
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              // The toast already surfaces the failure (default error
              // copy from the locale pack); the await still rethrows,
              // so swallow the echo here.
              void toast
                .promise(fakeRequest(true), { loading: 'Saving record…' })
                .catch(() => undefined);
            }}
          >
            promise (failure)
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
            {
              name: 'update(id, patch)',
              type: '{ content?: ReactNode; variant?; duration?: number }',
              description:
                'Patches a toast in place — same element, no enter/exit replay. A new duration re-arms the countdown; an omitted one leaves it running. Available on both useToast() and the module-level toast().',
            },
            {
              name: 'promise(promise, options)',
              type: '{ loading?; success?; error?; duration? }',
              description:
                'Shows a persistent loading toast, then patches it to the success (or danger) copy when the promise settles. success/error accept ReactNode or (value) => ReactNode; omitted copy falls back to the locale pack. Returns the original promise — rejections still reach the caller.',
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
