import { useControl } from 'react-use-control';

import { Button, BottomSheet } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

// ─── BottomSheet ────────────────────────────────────────────────
export default function BottomSheetDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <h1>BottomSheet</h1>
      <p className={intro}>Bottom sheet overlay panel for mobile-friendly interactions.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Bottom Sheet</Button>
        </div>
        <BottomSheet open={openCtrl} onClose={() => setOpen(false)}>
          <p style={{ margin: 0 }}>Bottom sheet content. Click the backdrop to close.</p>
          <Button onClick={() => setOpen(false)} size='sm' variant='outline' style={{ marginTop: 'var(--haze-space-3)' }}>
            Close
          </Button>
        </BottomSheet>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BottomSheetProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Overlay click closes the sheet</li>
            <li>Sheet has a drag handle indicator</li>
            <li>Safe area insets are respected for mobile</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
