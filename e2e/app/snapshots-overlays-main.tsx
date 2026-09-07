/**
 * Fixture for the overlay pixel baselines (e2e/snapshots.spec.ts):
 * Tooltip, Popover, DropdownMenu and Combobox start closed and are
 * opened by the spec through their real triggers, one per test (fresh
 * page each) — several popover=auto panels cannot be open at once, the
 * browser would light-dismiss all but the last. Dialog opens from an
 * opener button for the same reason (a statically-open modal would
 * block every other section's trigger). Toast is fired with
 * duration: 0, which arms no auto-dismiss timer, so it stays mounted
 * until the screenshot is taken.
 *
 * Demo content intentionally mirrors e2e/app/main.tsx so the
 * regenerated popover/dialog/dropdown baselines stay comparable to the
 * originals. Generous vertical gaps keep open panels clear of the next
 * section's trigger, like the smoke page.
 */
import { css } from '@linaria/core';
import { createRoot } from 'react-dom/client';
import { useControl } from 'react-use-control';

import { Button } from '../../src/lib/components/Button';
import { Combobox } from '../../src/lib/components/Combobox';
import { Dialog } from '../../src/lib/components/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../src/lib/components/DropdownMenu';
import { Popover } from '../../src/lib/components/Popover';
import { ToastContainer, useToast } from '../../src/lib/components/Toast';
import { Tooltip } from '../../src/lib/components/Tooltip';
import { lightTheme } from '../../src/lib/tokens/colors';
import { motion } from '../../src/lib/tokens/motion';
import { spacing } from '../../src/lib/tokens/spacing';
import { typography } from '../../src/lib/tokens/typography';

const shell = css`
  min-height: 100vh;
  box-sizing: border-box;
  margin: 0;
  padding: 32px 48px 480px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 280px;
`;

/* Room above the tooltip trigger for the default 'top' bubble — without
   it the first screenful would flip the placement to 'bottom'. */
const tooltipRoom = css`
  margin-top: 96px;
`;

const demoBtn = css`
  padding: 6px 16px;
`;

const comboboxWidth = css`
  width: 240px;
`;

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian' },
];

function ToastDemo() {
  const notify = useToast();
  return (
    // duration 0: no auto-dismiss timer is armed — the toast stays
    // mounted until the baseline capture is done.
    <button
      type="button"
      id="toast-opener"
      className={demoBtn}
      onClick={() => notify('Saved successfully', { variant: 'success', duration: 0 })}
    >
      Show toast
    </button>
  );
}

function App() {
  const [, setDialogOpen, dialogControl] = useControl(undefined, false);

  return (
    <div className={`${shell} ${lightTheme} ${spacing} ${typography} ${motion}`}>
      <section data-snap="tooltip" className={tooltipRoom}>
        <Tooltip content="Keyboard shortcut: Ctrl K">
          <Button variant="outline">Hover for help</Button>
        </Tooltip>
      </section>

      <section data-snap="popover">
        <Popover content="Popover body">Open popover</Popover>
      </section>

      <section data-snap="dropdown-menu">
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Apple</DropdownMenuItem>
            <DropdownMenuItem>Banana</DropdownMenuItem>
            <DropdownMenuItem>Cherry</DropdownMenuItem>
            <DropdownMenuItem>Durian</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Elderberry</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      <section data-snap="combobox">
        <Combobox
          value="banana"
          options={FRUITS}
          placeholder="Pick a fruit"
          className={comboboxWidth}
        />
      </section>

      <section data-snap="dialog">
        <button
          type="button"
          id="dialog-opener"
          className={demoBtn}
          onClick={() => setDialogOpen(true)}
        >
          Open dialog
        </button>
        <Dialog
          open={dialogControl}
          onClose={() => setDialogOpen(false)}
          title="Confirm action"
        >
          <p>Dialog body</p>
        </Dialog>
      </section>

      <ToastContainer>
        <ToastDemo />
      </ToastContainer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
