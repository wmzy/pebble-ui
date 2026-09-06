import { Avatar, AvatarGroup } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── AvatarGroup ───────────────────────────────────────────────
export default function AvatarGroupDemo() {
  return (
    <>
      <h1>AvatarGroup</h1>
      <p className={intro}>
        Overlapping avatar stack with an overflow counter for large teams.
      </p>

      <div className={section}>
        <h2>Basic stack</h2>
        <div className={row}>
          <AvatarGroup>
            <Avatar src='https://i.pravatar.cc/64?u=a' alt='Alice' />
            <Avatar src='https://i.pravatar.cc/64?u=b' alt='Bob' />
            <Avatar src='https://i.pravatar.cc/64?u=c' alt='Carol' />
          </AvatarGroup>
        </div>
      </div>

      <div className={section}>
        <h2>Max with overflow counter</h2>
        <div className={row}>
          <AvatarGroup max={3}>
            <Avatar src='https://i.pravatar.cc/64?u=a' alt='Alice' />
            <Avatar src='https://i.pravatar.cc/64?u=b' alt='Bob' />
            <Avatar src='https://i.pravatar.cc/64?u=c' alt='Carol' />
            <Avatar src='https://i.pravatar.cc/64?u=d' alt='Dave' />
            <Avatar src='https://i.pravatar.cc/64?u=e' alt='Eve' />
          </AvatarGroup>
        </div>
      </div>

      <div className={section}>
        <h2>Total override</h2>
        <p>
          When the full set is virtualized or paginated, pass{' '}
          <code>total</code> to display it instead of the rendered remainder.
        </p>
        <div className={row}>
          <AvatarGroup max={2} total={99}>
            <Avatar src='https://i.pravatar.cc/64?u=a' alt='Alice' />
            <Avatar src='https://i.pravatar.cc/64?u=b' alt='Bob' />
            <Avatar src='https://i.pravatar.cc/64?u=c' alt='Carol' />
            <Avatar src='https://i.pravatar.cc/64?u=d' alt='Dave' />
            <Avatar src='https://i.pravatar.cc/64?u=e' alt='Eve' />
          </AvatarGroup>
        </div>
      </div>

      <div className={section}>
        <h2>Sizes follow the stacked avatars</h2>
        <div className={row}>
          <AvatarGroup max={3}>
            <Avatar size='lg' src='https://i.pravatar.cc/112?u=a' alt='Alice' />
            <Avatar size='lg' src='https://i.pravatar.cc/112?u=b' alt='Bob' />
            <Avatar size='lg' src='https://i.pravatar.cc/112?u=c' alt='Carol' />
            <Avatar size='lg' src='https://i.pravatar.cc/112?u=d' alt='Dave' />
          </AvatarGroup>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AvatarGroupProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Add <strong>aria-label</strong> to describe the group, e.g.
              aria-label=&quot;Team members&quot;
            </li>
            <li>
              The overflow chip exposes its count as text (“+2”), readable by
              screen readers
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='avatarGroup' />
    </>
  );
}
