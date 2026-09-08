import { useRef } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { Button, Fullscreen } from '@/lib';

import PropsTable from '../PropsTable';
import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Fullscreen ─────────────────────────────────────────────────
const box = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-4);
  height: 220px;
  border: 1px dashed var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg-subtle);
`;

const boxLabel = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
`;

const mirror = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
`;

export default function FullscreenDemo() {
  // Control object: the trigger click, an Esc press and this read-out all
  // share one state (SidebarDemo pattern — never useState + bare boolean).
  const [fullscreen, , fullscreenCtrl] = useControl(undefined, false);
  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <h1>Fullscreen</h1>
      <p className={intro}>
        Wrap-mode Fullscreen API binding: the single child becomes the
        trigger, the browser does the work. The `fullscreen` state is
        controllable both ways — prop writes request/exit, and browser-side
        changes (including the Esc shortcut) write back and fire `onChange`.
      </p>

      <div className={section}>
        <h2>Targeting an element</h2>
        <div className={box} ref={boxRef}>
          <span className={boxLabel}>
            This box goes fullscreen — press the trigger, then Esc to leave.
          </span>
          <Fullscreen fullscreen={fullscreenCtrl} target={boxRef}>
            <Button variant="outline">
              {fullscreen ? 'Currently fullscreen' : 'Enter fullscreen'}
            </Button>
          </Fullscreen>
          <span className={mirror}>fullscreen: {String(fullscreen)}</span>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='FullscreenProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>The wrapped child keeps its own semantics and onClick</li>
            <li>
              Browsers announce fullscreen mode and expose Esc to exit — the
              state syncs back through <strong>onChange</strong>
            </li>
            <li>
              Without the Fullscreen API (iOS Safari) the trigger stays inert
              instead of throwing
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
