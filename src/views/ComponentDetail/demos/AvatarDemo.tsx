import { Avatar } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Avatar ────────────────────────────────────────────────────
export default function AvatarDemo() {
  return (
    <>
      <h1>Avatar</h1>
      <p className={intro}>Circular image container with fallback support.</p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Avatar size='sm' src='https://i.pravatar.cc/64?u=a' alt='Alice' />
          <Avatar size='md' src='https://i.pravatar.cc/80?u=b' alt='Bob' />
          <Avatar size='lg' src='https://i.pravatar.cc/112?u=c' alt='Carol' />
        </div>
      </div>

      <div className={section}>
        <h2>Fallback</h2>
        <div className={row}>
          <Avatar size='md' alt='Dave' />
          <Avatar size='md' fallback='🎨' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AvatarProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>&lt;img&gt;</strong> with <strong>alt</strong> text
              when image is available
            </li>
            <li>
              Fallback shows first letter of <strong>alt</strong> or custom
              content
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='avatar' />
    </>
  );
}
