import { useControl } from 'react-use-control';

import { Button, Dialog } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Dialog ────────────────────────────────────────────────────
export default function DialogDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <h1>Dialog</h1>
      <p className={intro}>
        Modal dialog using the native &lt;dialog&gt; element.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        </div>
        <Dialog open={openCtrl} onClose={() => setOpen(false)}>
          <h3 style={{ margin: '0 0 8px' }}>Dialog Title</h3>
          <p
            style={{
              margin: '0 0 16px',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            This is a modal dialog. Press ESC or click the backdrop to close.
          </p>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Dialog>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DialogProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;dialog&gt;</strong> with{' '}
              <strong>showModal()</strong> — automatic{' '}
              <strong>role=&quot;dialog&quot;</strong>
            </li>
            <li>
              <strong>ESC</strong> closes the dialog
            </li>
            <li>Focus is trapped within the dialog while open</li>
            <li>Backdrop click closes the dialog</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='dialog' />
    </>
  );
}
