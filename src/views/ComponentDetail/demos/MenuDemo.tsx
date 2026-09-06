import { Button, Menu, MenuItem, MenuDivider } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { noop, CssVarsSection } from './shared';

// ─── Menu ──────────────────────────────────────────────────────
export default function MenuDemo() {
  return (
    <>
      <h1>Menu</h1>
      <p className={intro}>Dropdown menu with keyboard navigation.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Menu trigger={<Button variant='outline'>Open Menu</Button>}>
            <MenuItem onSelect={noop}>Edit</MenuItem>
            <MenuItem onSelect={noop}>Duplicate</MenuItem>
            <MenuDivider />
            <MenuItem onSelect={noop}>Archive</MenuItem>
            <MenuItem disabled>Delete</MenuItem>
          </Menu>
        </div>
      </div>

      <div className={section}>
        <h2>Menu Props</h2>
        <PropsTable of='MenuProps' />
      </div>

      <div className={section}>
        <h2>MenuItem Props</h2>
        <PropsTable of='MenuItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;menu&quot;</strong> and{' '}
              <strong>role=&quot;menuitem&quot;</strong>
            </li>
            <li>Click outside closes the menu</li>
            <li>
              Disabled items have <strong>disabled</strong> attribute
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='menu' />
    </>
  );
}
