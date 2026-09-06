import { Kbd } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Kbd ───────────────────────────────────────────────────────
export default function KbdDemo() {
  return (
    <>
      <h1>Kbd</h1>
      <p className={intro}>
        Inline keyboard key indicator for shortcuts and key combinations.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Kbd size='sm'>Esc</Kbd>
          <Kbd size='md'>Esc</Kbd>
        </div>
      </div>

      <div className={section}>
        <h2>Key combinations</h2>
        <div className={row}>
          <span>
            <Kbd size='sm'>⌘</Kbd> + <Kbd size='sm'>K</Kbd>
          </span>
          <span>
            <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd>
          </span>
          <span>
            Press <Kbd>⌘</Kbd> <Kbd>Option</Kbd> <Kbd>Esc</Kbd>
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='KbdProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a native <strong>&lt;kbd&gt;</strong> element
            </li>
            <li>
              Surrounding text should spell out the action, e.g. “Press{' '}
              <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette”
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='kbd' />
    </>
  );
}
