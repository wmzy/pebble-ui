import type { MenuDataItem } from '@/lib';

import { useControl } from 'react-use-control';

import {
  Button,
  Menu,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuGroup,
  MenuDivider,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
} from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { noop, CssVarsSection } from './shared';

/** A small bare svg for the icon slot demos (sized to 1em by the slot). */
function DemoIcon() {
  return (
    <svg viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <rect x='2' y='2' width='12' height='12' rx='3' stroke='currentColor' strokeWidth='1.5' />
    </svg>
  );
}

// ─── Selection items ───────────────────────────────────────────
function SelectionMenu() {
  const [showGrid, , showGridCtrl] = useControl(undefined, true);
  const [snapGuides, , snapGuidesCtrl] = useControl(undefined, false);
  const [theme, , themeCtrl] = useControl(undefined, 'light');
  return (
    <div className={row}>
      <Menu trigger={<Button variant='outline'>View Options</Button>}>
        <MenuGroup label='Canvas'>
          <MenuCheckboxItem checked={showGridCtrl}>Show grid</MenuCheckboxItem>
          <MenuCheckboxItem checked={snapGuidesCtrl}>Snap to guides</MenuCheckboxItem>
        </MenuGroup>
        <MenuDivider />
        <MenuRadioGroup label='Theme' value={themeCtrl}>
          <MenuRadioItem value='light'>Light</MenuRadioItem>
          <MenuRadioItem value='dark'>Dark</MenuRadioItem>
          <MenuRadioItem value='system'>System</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>
      <span
        style={{
          alignSelf: 'center',
          fontSize: 'var(--haze-text-sm)',
          color: 'var(--haze-color-text-muted)',
        }}
      >
        grid: {String(showGrid)} · snap: {String(snapGuides)} · theme: {theme}
      </span>
    </div>
  );
}

// ─── Data-driven items ─────────────────────────────────────────
const dataItems: MenuDataItem[] = [
  { type: 'item', label: 'Rename', kbdLabel: 'F2', icon: <DemoIcon /> },
  { type: 'item', label: 'Duplicate', kbdLabel: '⌘D' },
  { type: 'divider' },
  {
    type: 'group',
    label: 'Share',
    children: [
      { type: 'item', label: 'Copy link' },
      { type: 'checkbox', label: 'Anyone can edit' },
    ],
  },
  {
    type: 'group',
    label: 'Sort by',
    value: 'name',
    children: [
      { type: 'radio', value: 'name', label: 'Name' },
      { type: 'radio', value: 'date', label: 'Date modified' },
    ],
  },
  { type: 'divider' },
  { type: 'item', label: 'Delete', danger: true },
  {
    type: 'sub',
    label: 'More',
    children: [
      { type: 'item', label: 'Export as PDF' },
      { type: 'item', label: 'Move to trash', danger: true },
    ],
  },
];

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
        <h2>Selection items: checkboxes, radios and groups</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>MenuCheckboxItem</code> toggles a boolean option;{' '}
          <code>MenuRadioGroup</code> + <code>MenuRadioItem</code> form a
          single-select cluster; <code>MenuGroup</code> labels a section
          with a non-interactive heading. Toggling or selecting keeps the
          menu open, and Enter/Space activate the focused item — the
          checkable items are full keyboard citizens (arrows, Home/End,
          typeahead).
        </p>
        <SelectionMenu />
      </div>

      <div className={section}>
        <h2>Danger items, icons and shortcut hints</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Any item accepts <code>danger</code> for destructive actions, an{' '}
          <code>icon</code> rendered in an inline-start slot, and a{' '}
          <code>kbdLabel</code> shortcut hint pushed to the inline end.
        </p>
        <div className={row}>
          <Menu trigger={<Button variant='outline'>File</Button>}>
            <MenuItem icon={<DemoIcon />} kbdLabel='⌘N'>
              New file
            </MenuItem>
            <MenuItem kbdLabel='⌘S'>Save</MenuItem>
            <MenuDivider />
            <MenuGroup label='Danger zone'>
              <MenuItem danger>Revert changes</MenuItem>
              <MenuCheckboxItem danger>Track deletions</MenuCheckboxItem>
            </MenuGroup>
          </Menu>
        </div>
      </div>

      <div className={section}>
        <h2>Data-driven items</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Pass <code>items</code> instead of composed children:{' '}
          <code>item</code>, <code>checkbox</code>, <code>radio</code>,{' '}
          <code>group</code> (with an optional <code>value</code> to make it
          a radio group), <code>divider</code> and recursive{' '}
          <code>sub</code> entries render through the same components as the
          compound API.
        </p>
        <div className={row}>
          <Menu trigger={<Button variant='outline'>Data-driven Menu</Button>} items={dataItems} />
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
        <h2>MenuCheckboxItem Props</h2>
        <PropsTable of='MenuCheckboxItemProps' />
      </div>

      <div className={section}>
        <h2>MenuRadioGroup Props</h2>
        <PropsTable of='MenuRadioGroupProps' />
      </div>

      <div className={section}>
        <h2>MenuRadioItem Props</h2>
        <PropsTable of='MenuRadioItemProps' />
      </div>

      <div className={section}>
        <h2>MenuGroup Props</h2>
        <PropsTable of='MenuGroupProps' />
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
            <li>
              Checkbox and radio options use{' '}
              <strong>menuitemcheckbox</strong> /{' '}
              <strong>menuitemradio</strong> with{' '}
              <strong>aria-checked</strong>; groups are{' '}
              <strong>role=&quot;group&quot;</strong> named by their label
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
