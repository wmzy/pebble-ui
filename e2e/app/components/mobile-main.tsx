/**
 * Mobile harness for e2e/mobile.spec.ts (chromium-mobile project, Pixel 7
 * emulation): the viewport/touch-sensitive overlay contracts a desktop
 * viewport cannot vouch for — BottomSheet swipeToDismiss drag-dismiss
 * (tall body so the 88px floor, not height/4, is the threshold), Drawer
 * right-edge coverage, Dialog small-screen width, tap-opened Popover.
 *
 * Every opener is a plain button; the sheet gets an id through ...rest so
 * the spec can address it directly (Drawer/Dialog are native <dialog>s
 * without rest spread — the spec locates them by their content).
 */
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import BottomSheet from '../../../src/lib/components/BottomSheet/BottomSheet';
import Dialog from '../../../src/lib/components/Dialog/Dialog';
import Drawer from '../../../src/lib/components/Drawer/Drawer';
import Popover from '../../../src/lib/components/Popover/Popover';

import { mountPage } from './mount';

/* Harness buttons get a hit area above the 24px touch minimum. */
const opener = css`
  padding: 6px 16px;
`;

/* Bare span trigger gets the same (same rationale as collision-main). */
const popoverTrigger = css`
  padding: 6px 12px;
`;

function App() {
  const [, setSheetOpen, sheetControl] = useControl(undefined, false);
  const [, setDrawerOpen, drawerControl] = useControl(undefined, false);
  const [, setDialogOpen, dialogControl] = useControl(undefined, false);
  const [sheetCloses, setSheetCloses] = useControl(undefined, 0);

  return (
    <>
      <button
        type='button'
        id='sheet-opener'
        className={opener}
        onClick={() => setSheetOpen(true)}
      >
        Open sheet
      </button>
      <button
        type='button'
        id='drawer-opener'
        className={opener}
        onClick={() => setDrawerOpen(true)}
      >
        Open drawer
      </button>
      <button
        type='button'
        id='dialog-opener'
        className={opener}
        onClick={() => setDialogOpen(true)}
      >
        Open dialog
      </button>
      <div>
        <Popover content='Popover body'>
          <span id='popover-trigger' className={popoverTrigger}>
            Popover trigger
          </span>
        </Popover>
      </div>
      {/* Close counter: pins that drag-dismiss exits through onClose. */}
      <p id='sheet-close-count'>{sheetCloses}</p>

      <BottomSheet
        id='mobile-sheet'
        open={sheetControl}
        swipeToDismiss
        onClose={() => {
          setSheetOpen(false);
          setSheetCloses((n) => n + 1);
        }}
      >
        <h2>Sheet title</h2>
        <p>
          Sheet body with enough height that the dismiss threshold stays at
          the 88px floor instead of height/4 — the drag distances in the
          spec stay deterministic.
        </p>
        <p>
          Second paragraph. Third line of filler. Fourth line of filler.
          Fifth line of filler. Sixth line of filler. Seventh line of
          filler. Eighth line of filler. Ninth line of filler.
        </p>
        <p>
          Third paragraph. Tenth line of filler. Eleventh line of filler.
          Twelfth line of filler. Thirteenth line of filler. Fourteenth
          line. Fifteenth line. Sixteenth line. Seventeenth line.
        </p>
      </BottomSheet>

      <Drawer
        open={drawerControl}
        placement='right'
        onClose={() => setDrawerOpen(false)}
      >
        <h2>Drawer heading</h2>
        <p>Drawer body</p>
      </Drawer>

      <Dialog
        open={dialogControl}
        onClose={() => setDialogOpen(false)}
        title='Confirm action'
      >
        <p>Dialog body</p>
      </Dialog>
    </>
  );
}

mountPage(<App />);
