import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
        <h2>DropdownMenuSub Props</h2>
        <PropsTable of='DropdownMenuSubProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Trigger is a native <strong>&lt;button&gt;</strong></li>
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
