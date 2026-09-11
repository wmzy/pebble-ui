import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { Signature } from '@/lib/components/Signature';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Signature ─────────────────────────────────────────────────
const row = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-4);
  align-items: flex-start;
`;

const readout = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
  max-width: 22rem;
  overflow-wrap: anywhere;
`;

const previewFrame = css`
  border: 1px dashed var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-2);
`;

const previewImg = css`
  display: block;
  max-width: 100%;
`;

export default function SignatureDemo() {
  const [value, setValue, control] = useControl(undefined, '');

  return (
    <>
      <h1>Signature</h1>
      <p className={intro}>
        A canvas handwriting pad. Drawing, undo and clear all commit a PNG data URL into
        the controllable <code>value</code> — wire it straight into a form field.
      </p>

      <div className={section}>
        <h2>Basic</h2>
        <div className={row}>
          <div>
            <Signature value={control} onChange={setValue} width={360} height={180} />
          </div>
          <div>
            <p className={readout}>{value || '(nothing signed yet)'}</p>
            {value ? (
              <div className={previewFrame}>
                <img className={previewImg} src={value} alt="Committed signature preview" width={180} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={section}>
        <h2>Custom pen and labels</h2>
        <Signature penColor="#b91c1c" penWidth={3} undoLabel="Undo stroke" clearLabel="Erase all" />
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <Signature disabled width={280} height={140} />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Pointer-driven drawing (with pointer capture, so strokes survive leaving the
              canvas); <strong>Undo</strong> / <strong>Clear</strong> are real buttons and
              keyboard-operable.
            </li>
            <li>
              Label the pad through the root (e.g. <strong>aria-label</strong> on the
              component spreads to the wrapper).
            </li>
            <li>High-DPI screens render crisp strokes via devicePixelRatio scaling.</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
