import { useControl } from 'react-use-control';

import { Button, ConfirmDialog } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

// ─── ConfirmDialog ──────────────────────────────────────────────
export default function ConfirmDialogDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <h1>ConfirmDialog</h1>
      <p className={intro}>Confirmation dialog with confirm/cancel actions.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Confirm Dialog</Button>
        </div>
        <ConfirmDialog
          open={openCtrl}
          title='Delete Item'
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          variant='danger'
        >
          Are you sure you want to delete this item? This action cannot be undone.
        </ConfirmDialog>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ConfirmDialogProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Overlay click closes the dialog</li>
            <li>Confirm and cancel buttons are keyboard accessible</li>
            <li>Danger variant uses red confirm button</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
