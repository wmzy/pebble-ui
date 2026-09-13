/**
 * Fixture for the reduced-motion e2e spec (e2e/reduced-motion.spec.ts):
 * one representative surface per motion family the tokens drive —
 * Button hover transitions (fast), Switch state transitions (normal),
 * Popover panel enter animation (fast, floating tier) and Dialog modal
 * enter animation (normal) — plus the infinite-loop family (Spinner
 * spin / Skeleton shimmer), whose literal loop periods sit outside the
 * token scale and are collapsed per-class instead (single 0.01ms
 * iteration). The motion token class mounted by
 * mountPage collapses every --haze-duration-* to 0ms under
 * prefers-reduced-motion: reduce, so all of these must resolve to 0s
 * computed durations in that mode and keep full values otherwise.
 * The second Dialog (ViewTransitionDialogDemo) additionally drives the
 * opt-in `viewTransition` prop for the spec's View Transitions cases.
 */
import { useControl } from 'react-use-control';
import { createRef } from 'react';

import { Button } from '../../src/lib/components/Button';
import { Dialog } from '../../src/lib/components/Dialog';
import type { DialogHandle } from '../../src/lib/components/Dialog';
import { Popover } from '../../src/lib/components/Popover';
import { Skeleton } from '../../src/lib/components/Skeleton';
import { Spinner } from '../../src/lib/components/Spinner';
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

/**
 * Opt-in View Transitions surface for the view-transition specs below:
 * the same Dialog, but driven through the imperative handle so BOTH the
 * open and the close flips run inside the component's VT-wrapped state
 * outlet (flipOpen). A consumer-driven controlled flip (setOpen on the
 * control) happens outside the component by definition — opt-in VT wraps
 * the component's own interaction paths (handle.open/close, Esc, backdrop
 * click) — so this demo wires #vt-dialog-opener to handle.open() and lets
 * the spec close via Escape. Under prefers-reduced-motion: reduce the
 * same flips degrade to direct state writes (no startViewTransition).
 */
function ViewTransitionDialogDemo() {
  const ref = createRef<DialogHandle>();
  return (
    <section id="vt-dialog-demo">
      <button
        type="button"
        id="vt-dialog-opener"
        onClick={() => ref.current?.open()}
      >
        Open view-transition dialog
      </button>
      <Dialog
        ref={ref}
        viewTransition
        onClose={() => {
          /* 关闭由 handle/Esc 自主完成；onClose 只作通知 */
        }}
        title="View transition"
      >
        <p>View transition dialog body</p>
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
    <section id="spinner-demo">
      <Spinner />
    </section>
    <section id="skeleton-demo">
      <Skeleton width={200} height={20} />
    </section>
    <DialogDemo />
    <ViewTransitionDialogDemo />
  </>
);
