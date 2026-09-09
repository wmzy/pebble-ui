import { useControl } from 'react-use-control';

import { Button, BottomSheet, Input, Switch } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow, row } from '../styles';

// ─── BottomSheet ────────────────────────────────────────────────
export default function BottomSheetDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  // 移动端示例：手势开关 + 带 input 的 sheet（键盘避让）。
  // Switch 走 useControl 直写（ControlOrValue 契约，无需 onChange）
  const [, , mobileCtrl] = useControl(undefined, false);
  const [, setMobileOpen] = useControl(mobileCtrl);
  const [swipe, , swipeCtrl] = useControl(undefined, false);

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
        <h2>Mobile: swipe to dismiss &amp; virtual keyboard</h2>
        <div className={fieldRow}>
          <Switch
            checked={swipeCtrl}
            aria-label='Toggle swipe-to-dismiss gesture'
          />
          <Button variant='outline' size='sm' onClick={() => setMobileOpen(true)}>
            Open mobile sheet
          </Button>
        </div>
        <p className={intro}>
          With <code>swipeToDismiss</code> on, drag the sheet down past the threshold to
          dismiss it (scrolled content hands the gesture back to native scrolling until it
          returns to the top). With <code>virtualKeyboard</code> on, focusing the input
          lifts the sheet above the on-screen keyboard.
        </p>
        <BottomSheet
          open={mobileCtrl}
          onClose={() => setMobileOpen(false)}
          swipeToDismiss={swipe}
          virtualKeyboard
        >
          <Input aria-label='Message' placeholder='Focus me — the sheet lifts above the keyboard' />
          <div style={{ marginTop: 'var(--haze-space-4)', display: 'grid', gap: 'var(--haze-space-2)' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <p key={i} style={{ margin: 0 }}>
                Scrollable row {i + 1} — drag down from the top of this list to dismiss.
              </p>
            ))}
          </div>
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
            <li>The swipe gesture is a pointer-only affordance; Escape and the backdrop remain the keyboard paths</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
