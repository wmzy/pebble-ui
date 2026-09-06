import { Chip } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { noop } from './shared';

// ─── Chip ───────────────────────────────────────────────────────
export default function ChipDemo() {
  return (
    <>
      <h1>Chip</h1>
      <p className={intro}>Compact element for tags, labels, and filters.</p>

      <div className={section}>
        <h2>Solid Variants</h2>
        <div className={row}>
          <Chip>Default</Chip>
          <Chip color='primary'>Primary</Chip>
          <Chip color='success'>Success</Chip>
          <Chip color='warning'>Warning</Chip>
          <Chip color='danger'>Danger</Chip>
        </div>
      </div>

      <div className={section}>
        <h2>Outline Variants</h2>
        <div className={row}>
          <Chip variant='outline'>Default</Chip>
          <Chip variant='outline' color='primary'>Primary</Chip>
          <Chip variant='outline' color='success'>Success</Chip>
          <Chip variant='outline' color='danger'>Danger</Chip>
        </div>
      </div>

      <div className={section}>
        <h2>With Close</h2>
        <div className={row}>
          <Chip onClose={noop}>Removable</Chip>
          <Chip color='primary' onClose={noop}>Primary</Chip>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ChipProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as a <strong>&lt;span&gt;</strong></li>
            <li>Close button has <strong>aria-label=&quot;Remove&quot;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
