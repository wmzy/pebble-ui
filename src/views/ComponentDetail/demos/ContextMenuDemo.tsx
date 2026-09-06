import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── ContextMenu ────────────────────────────────────────────────
export default function ContextMenuDemo() {
  return (
    <>
      <h1>ContextMenu</h1>
      <p className={intro}>Right-click context menu positioned at cursor.</p>

      <div className={section}>
        <h2>Demo</h2>
        <ContextMenu>
          <ContextMenuTrigger>
            <div style={{ padding: 'var(--haze-space-6)', border: '1px dashed var(--haze-color-border)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>
              Right-click here to open context menu
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Copy</ContextMenuItem>
            <ContextMenuItem>Paste</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Select All</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      <div className={section}>
        <h2>ContextMenu Props</h2>
        <PropsTable of='ContextMenuProps' />
      </div>

      <div className={section}>
        <h2>ContextMenuItem Props</h2>
        <PropsTable of='ContextMenuItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Opens on right-click (contextmenu event)</li>
            <li>Content is positioned at cursor coordinates</li>
            <li>Click outside closes the menu</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
