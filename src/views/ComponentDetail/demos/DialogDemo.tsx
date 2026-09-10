import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { Button, Dialog } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// classNames 槽位演示：root 落在 <dialog> 面板上、header 落在 title 渲染的
// <h2> 上（键名见 DialogClassNames）。
const brandedPanel = css`
  border-color: var(--haze-color-primary);
  box-shadow:
    var(--haze-shadow-xl),
    0 0 0 1px var(--haze-color-primary);
`;

const brandedHeader = css`
  color: var(--haze-color-primary);
`;

// ─── Dialog ────────────────────────────────────────────────────
export default function DialogDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);
  const [, , brandedCtrl] = useControl(undefined, false);
  const [, setBrandedOpen] = useControl(brandedCtrl);

  return (
    <>
      <h1>Dialog</h1>
      <p className={intro}>
        Modal dialog using the native &lt;dialog&gt; element.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        </div>
        <Dialog open={openCtrl} onClose={() => setOpen(false)}>
          <h3 style={{ margin: '0 0 8px' }}>Dialog Title</h3>
          <p
            style={{
              margin: '0 0 16px',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            This is a modal dialog. Press ESC or click the backdrop to close.
          </p>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Dialog>
      </div>

      <div className={section}>
        <h2>classNames slots</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          The <code>classNames</code> record targets structural parts
          (AntD v6 shape): <code>root</code> lands on the{' '}
          <code>&lt;dialog&gt;</code> panel, <code>header</code> on the{' '}
          <code>title</code>&apos;s <code>&lt;h2&gt;</code>. Slot classes
          arrive after the component defaults, so this panel keeps its
          layout but wears a primary border.
        </p>
        <div className={row}>
          <Button variant='outline' onClick={() => setBrandedOpen(true)}>
            Open with classNames
          </Button>
        </div>
        <Dialog
          open={brandedCtrl}
          onClose={() => setBrandedOpen(false)}
          title='Branded dialog'
          classNames={{ root: brandedPanel, header: brandedHeader }}
        >
          <p
            style={{
              margin: 0,
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            The panel border and title color come from the slot classes.
          </p>
        </Dialog>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DialogProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;dialog&gt;</strong> with{' '}
              <strong>showModal()</strong> — automatic{' '}
              <strong>role=&quot;dialog&quot;</strong>
            </li>
            <li>
              <strong>ESC</strong> closes the dialog
            </li>
            <li>Focus is trapped within the dialog while open</li>
            <li>Backdrop click closes the dialog</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='dialog' />
    </>
  );
}
