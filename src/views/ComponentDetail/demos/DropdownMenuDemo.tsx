import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

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
            <DropdownMenuItem>Delete</DropdownMenuItem>
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
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Trigger is a native <strong>&lt;button&gt;</strong></li>
            <li>Click outside closes the menu</li>
            <li>Disabled items have <strong>disabled</strong> attribute</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
