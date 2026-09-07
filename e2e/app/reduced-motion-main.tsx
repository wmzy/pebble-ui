/**
 * Fixture for the reduced-motion e2e spec (e2e/reduced-motion.spec.ts):
 * one representative surface per motion family the tokens drive —
 * Button hover transitions (fast), Switch state transitions (normal),
 * Popover panel enter animation (fast, floating tier) and Dialog modal
 * enter animation (normal). The motion token class mounted by
 * mountPage collapses every --haze-duration-* to 0ms under
 * prefers-reduced-motion: reduce, so all of these must resolve to 0s
 * computed durations in that mode and keep full values otherwise.
 */
import { useControl } from 'react-use-control';

import { Button } from '../../src/lib/components/Button';
import { Dialog } from '../../src/lib/components/Dialog';
import { Popover } from '../../src/lib/components/Popover';
import { Switch } from '../../src/lib/components/Switch';

import { mountPage } from './components/mount';

function DialogDemo() {
  const [, setDialogOpen, dialogControl] = useControl(undefined, false);
  return (
    <section id="dialog-demo">
      <button
        type="button"
        id="dialog-opener"
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
  );
}

mountPage(
  <>
    <section id="button-demo">
      <Button variant="solid">Solid action</Button>
    </section>
    <section id="switch-demo">
      <Switch aria-label="Motion switch" />
    </section>
    <section id="popover-demo">
      <Popover content="Popover body">Open popover</Popover>
    </section>
    <DialogDemo />
  </>
);
