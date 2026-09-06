import { Button, Empty } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Empty ─────────────────────────────────────────────────────
export default function EmptyDemo() {
  return (
    <>
      <h1>Empty</h1>
      <p className={intro}>Placeholder state when no data is available.</p>

      <div className={section}>
        <h2>Default</h2>
        <Empty />
      </div>

      <div className={section}>
        <h2>Custom Description</h2>
        <Empty description='No search results found' />
      </div>

      <div className={section}>
        <h2>With Action</h2>
        <Empty description='No items yet'>
          <Button size='sm'>Create Item</Button>
        </Empty>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='EmptyProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely presentational — wrap with a container that has{' '}
              <strong>aria-label</strong> if needed
            </li>
            <li>
              Default image is decorative SVG
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='empty' />
    </>
  );
}
