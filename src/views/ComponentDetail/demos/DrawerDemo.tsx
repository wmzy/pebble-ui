import { useControl } from 'react-use-control';

import { Button, Drawer } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Drawer ────────────────────────────────────────────────────
export default function DrawerDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <h1>Drawer</h1>
      <p className={intro}>Slide-out panel anchored to a screen edge.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        </div>
        <Drawer open={openCtrl} onClose={() => setOpen(false)}>
          <div style={{ padding: 'var(--haze-space-4)' }}>
            <h3 style={{ margin: '0 0 var(--haze-space-3)' }}>Drawer Title</h3>
            <p style={{ color: 'var(--haze-color-text-secondary)' }}>
              Drawer content goes here. Click the backdrop or press ESC to close.
            </p>
            <Button onClick={() => setOpen(false)} size='sm' variant='outline'>
              Close
            </Button>
          </div>
        </Drawer>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DrawerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;dialog&gt;</strong> with{' '}
              <strong>showModal()</strong>
            </li>
            <li>
              <strong>ESC</strong> closes the drawer
            </li>
            <li>Focus is trapped within the drawer while open</li>
            <li>Backdrop click closes the drawer</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='drawer' />
    </>
  );
}
