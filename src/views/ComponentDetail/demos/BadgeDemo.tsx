import { Badge } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Badge ─────────────────────────────────────────────────────
export default function BadgeDemo() {
  return (
    <>
      <h1>Badge</h1>
      <p className={intro}>
        Small status indicators for labeling and categorization.
      </p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row}>
          <Badge variant='default'>Default</Badge>
          <Badge variant='success'>Success</Badge>
          <Badge variant='warning'>Warning</Badge>
          <Badge variant='danger'>Danger</Badge>
          <Badge variant='info'>Info</Badge>
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Badge size='sm'>Small</Badge>
          <Badge size='md'>Medium</Badge>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BadgeProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a <strong>&lt;span&gt;</strong> — purely decorative
            </li>
            <li>
              Add <strong>aria-label</strong> if the badge conveys meaning not
              present in surrounding text
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='badge' />
    </>
  );
}
