import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { FloatButton, FloatButtonGroup } from '@/lib/components/FloatButton';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── FloatButton ───────────────────────────────────────────────
const pad = css`
  min-height: 10rem;
  border: 1px dashed var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

const stack = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
`;

const code = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
`;

export default function FloatButtonDemo() {
  const [groupOpen, setGroupOpen, groupControl] = useControl(undefined, false);

  return (
    <>
      <h1>FloatButton</h1>
      <p className={intro}>
        A floating action button pinned to the bottom corner of the screen — the universal
        {' “primary action”'} affordance. Renders a button, or a real anchor with{' '}
        <code>href</code>. For scroll-to-top specifically, keep BackToTop.
      </p>

      <div className={section}>
        <h2>Standalone</h2>
        <div className={pad}>
          <span>Three FABs are anchored bottom-end of the viewport →</span>
        </div>
        <FloatButton aria-label="Create" />
        <FloatButton description="Ask AI" variant="outline" shape="square" />
        <FloatButton href="#floatbutton" description="Read docs" variant="ghost" />
      </div>

      <div className={section}>
        <h2>Group with expandable menu</h2>
        <div className={stack}>
          <p className={code}>open = {String(groupOpen)}</p>
          <div className={pad}>The trigger expands a stack of FloatButtons; plus rotates into an ×.</div>
        </div>
        <FloatButtonGroup
          open={groupControl}
          description="Actions"
          onOpenChange={(open) => setGroupOpen(open)}
        >
          <FloatButton aria-label="Edit" description="Edit" variant="outline" />
          <FloatButton aria-label="Copy" description="Copy" variant="outline" />
          <FloatButton aria-label="Share" description="Share" variant="outline" />
        </FloatButtonGroup>
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Icon-only buttons need a name — pass <strong>aria-label</strong> (spreads
              through like any native attribute) or a <strong>description</strong>.
            </li>
            <li>
              The group trigger reports state via <strong>aria-expanded</strong> and{' '}
              <strong>aria-controls</strong>; collapsed items leave the tab order once the
              collapse settles.
            </li>
            <li>
              Activating a menu item dismisses the menu; <strong>Escape</strong> closes it.
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
