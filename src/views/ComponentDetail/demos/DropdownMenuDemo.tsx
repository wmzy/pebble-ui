import type { DropdownMenuDataItem } from '@/lib';

import { useControl } from 'react-use-control';

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

/** A small bare svg for the icon slot demos (sized to 1em by the slot). */
function DemoIcon() {
  return (
    <svg viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <rect x='2' y='2' width='12' height='12' rx='3' stroke='currentColor' strokeWidth='1.5' />
    </svg>
  );
}

// ─── Selection items ───────────────────────────────────────────
function SelectionDropdown() {
  // Controlled state: the content unmounts while closed, so the demo
  // keeps the values alive outside the menu.
  const [, , showBookingsCtrl] = useControl(undefined, true);
  const [, , showPricesCtrl] = useControl(undefined, false);
  const [, , densityCtrl] = useControl(undefined, 'comfortable');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant='outline'>View Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup label='Bookings'>
          <DropdownMenuCheckboxItem checked={showBookingsCtrl}>
            Show bookings
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showPricesCtrl}>
            Show prices
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup label='Density' value={densityCtrl}>
          <DropdownMenuRadioItem value='compact'>Compact</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='comfortable'>Comfortable</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Data-driven items ─────────────────────────────────────────
const dataItems: DropdownMenuDataItem[] = [
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

// ─── DropdownMenu ───────────────────────────────────────────────
export default function DropdownMenuDemo() {
  return (
    <>
      <h1>DropdownMenu</h1>
      <p className={intro}>Dropdown menu with trigger, content, items, and separators.</p>

      <div className={section}>
        <h2>Demo</h2>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant='outline'>Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <code>DropdownMenuCheckboxItem</code> toggles a boolean option;{' '}
          <code>DropdownMenuRadioGroup</code> +{' '}
          <code>DropdownMenuRadioItem</code> form a single-select cluster;{' '}
          <code>DropdownMenuGroup</code> labels a section with a
          non-interactive heading. Unlike plain items, toggling or
          selecting keeps the menu open, and Enter/Space activate the
          focused item.
        </p>
        <SelectionDropdown />
      </div>

      <div className={section}>
        <h2>Icons, shortcut hints and the items data API</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Items accept an <code>icon</code> (inline-start slot) and a{' '}
          <code>kbdLabel</code> shortcut hint (inline end), and{' '}
          <code>danger</code> marks destructive actions. Passing{' '}
          <code>items</code> replaces composed children entirely — the
          menu renders behind a default <code>⋯</code> trigger, with{' '}
          <code>checkbox</code>, <code>radio</code> (through a group's{' '}
          <code>value</code>), labeled <code>group</code>,{' '}
          <code>divider</code> and recursive <code>sub</code> entries.
        </p>
        <div style={{ display: 'flex', gap: 'var(--haze-space-3)', alignItems: 'center' }}>
          <DropdownMenu items={dataItems} />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant='outline'>Compound with slots</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem icon={<DemoIcon />} kbdLabel='⌘N'>
                New file
              </DropdownMenuItem>
              <DropdownMenuItem kbdLabel='⌘S'>Save</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup label='Danger zone'>
                <DropdownMenuItem danger>Revert changes</DropdownMenuItem>
                <DropdownMenuCheckboxItem danger>Track deletions</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
          Compose submenus from <code>DropdownMenuSub</code> wrapping a{' '}
          <code>DropdownMenuSubTrigger</code> +{' '}
          <code>DropdownMenuSubContent</code> pair — nesting composes
          arbitrarily. Hover opens after a short intent delay, click
          toggles, <strong>ArrowRight</strong> (LTR) enters with focus on
          the first item, and <strong>Esc</strong> closes one level at a
          time.
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant='outline'>Open Nested Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuItem>Embed</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Email</DropdownMenuItem>
                    <DropdownMenuItem>QR code</DropdownMenuItem>
                    <DropdownMenuItem disabled>Webhook</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={section}>
        <h2>DropdownMenu Props</h2>
        <PropsTable of='DropdownMenuProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuContent Props</h2>
        <PropsTable of='DropdownMenuContentProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuItem Props</h2>
        <PropsTable of='DropdownMenuItemProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuCheckboxItem Props</h2>
        <PropsTable of='DropdownMenuCheckboxItemProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuRadioGroup Props</h2>
        <PropsTable of='DropdownMenuRadioGroupProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuRadioItem Props</h2>
        <PropsTable of='DropdownMenuRadioItemProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuGroup Props</h2>
        <PropsTable of='DropdownMenuGroupProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuSub Props</h2>
        <PropsTable of='DropdownMenuSubProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Trigger is a native <strong>&lt;button&gt;</strong></li>
            <li>
              Checkbox and radio options use{' '}
              <strong>menuitemcheckbox</strong> /{' '}
              <strong>menuitemradio</strong> with{' '}
              <strong>aria-checked</strong>; groups are{' '}
              <strong>role=&quot;group&quot;</strong> named by their label
            </li>
            <li>Click outside closes the menu</li>
            <li>Disabled items have <strong>disabled</strong> attribute</li>
            <li>
              Submenu triggers expose <strong>aria-haspopup</strong> /{' '}
              <strong>aria-expanded</strong>; focus is contained per level
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
