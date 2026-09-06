import { TagGroup, TagGroupItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { noop } from './shared';

// ─── TagGroup ───────────────────────────────────────────────────
export default function TagGroupDemo() {
  return (
    <>
      <h1>TagGroup</h1>
      <p className={intro}>Group of tags with optional close buttons.</p>

      <div className={section}>
        <h2>Demo</h2>
        <TagGroup>
          <TagGroupItem>React</TagGroupItem>
          <TagGroupItem>TypeScript</TagGroupItem>
          <TagGroupItem onClose={noop}>Removable</TagGroupItem>
        </TagGroup>
      </div>

      <div className={section}>
        <h2>TagGroup Props</h2>
        <PropsTable of='TagGroupProps' />
      </div>

      <div className={section}>
        <h2>TagGroupItem Props</h2>
        <PropsTable of='TagGroupItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Group uses <strong>role=&quot;group&quot;</strong></li>
            <li>Close button has <strong>aria-label=&quot;Remove&quot;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
