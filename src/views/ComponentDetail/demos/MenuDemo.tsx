import { Button, Menu, MenuItem, MenuDivider, MenuSub, MenuSubTrigger, MenuSubContent } from '@/lib';

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
        <h2>Nested submenus</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Compose submenus from <code>MenuSub</code> wrapping a{' '}
          <code>MenuSubTrigger</code> + <code>MenuSubContent</code> pair —
          and nest them arbitrarily. Hover opens after a short intent
          delay, click toggles, <strong>ArrowRight</strong> (LTR) enters
          with focus on the first item, and <strong>Esc</strong> closes one
          level at a time. The panel mirrors to the inline-start edge
          under <code>dir=&quot;rtl&quot;</code>.
        </p>
        <div className={row}>
          <Menu trigger={<Button variant='outline'>Open Nested Menu</Button>}>
            <MenuItem onSelect={noop}>Rename</MenuItem>
            <MenuSub>
              <MenuSubTrigger>Share</MenuSubTrigger>
              <MenuSubContent>
                <MenuItem onSelect={noop}>Copy link</MenuItem>
                <MenuItem onSelect={noop}>Embed</MenuItem>
                <MenuSub>
                  <MenuSubTrigger>More</MenuSubTrigger>
                  <MenuSubContent>
                    <MenuItem onSelect={noop}>Email</MenuItem>
                    <MenuItem onSelect={noop}>QR code</MenuItem>
                    <MenuItem disabled>Webhook</MenuItem>
                  </MenuSubContent>
                </MenuSub>
              </MenuSubContent>
            </MenuSub>
            <MenuDivider />
            <MenuItem onSelect={noop}>Archive</MenuItem>
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
        <h2>MenuSub Props</h2>
        <PropsTable of='MenuSubProps' />
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
            <li>
              Submenu triggers expose <strong>aria-haspopup</strong> /{' '}
              <strong>aria-expanded</strong>; focus is contained per level
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='menu' />
    </>
  );
}
