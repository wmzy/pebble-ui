import { useControl } from 'react-use-control';

import { Rating } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

// ─── Rating ─────────────────────────────────────────────────────
export default function RatingDemo() {
  const [, , valueCtrl] = useControl(undefined, 3);
  const [value] = useControl(valueCtrl);

  return (
    <>
      <h1>Rating</h1>
      <p className={intro}>Star rating with half-star support.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Rating value={valueCtrl} />
          <span style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)' }}>{value} stars</span>
        </div>
      </div>

      <div className={section}>
        <h2>Half Stars</h2>
        <div className={row}>
          <Rating allowHalf />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='RatingProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;radiogroup&quot;</strong> with individual <strong>role=&quot;radio&quot;</strong> stars</li>
            <li>Each star has <strong>aria-checked</strong> and <strong>aria-label</strong></li>
            <li>Click to select, hover to preview</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
