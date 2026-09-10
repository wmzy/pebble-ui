import { useControl } from 'react-use-control';

import {
  Button,
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Kbd,
} from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

/** The dialog example needs shared state for the button + the mod+k hotkey. */
function CommandPaletteExample() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <p>
        Press <Kbd size='sm'>mod</Kbd> + <Kbd size='sm'>K</Kbd> (macOS ⌘K, elsewhere Ctrl+K)
        anywhere on this page, or:
      </p>
      <Button onClick={() => setOpen(true)}>Open command palette</Button>
      <CommandDialog
        open={openCtrl}
        hotkey='mod+k'
        title='Command Palette'
        placeholder='Type a command...'
      >
        <CommandList>
          <CommandGroup heading='File'>
            <CommandItem shortcut='⌘N'>New File</CommandItem>
            <CommandItem shortcut='⌘O'>Open File…</CommandItem>
            <CommandItem shortcut='⌘S'>Save</CommandItem>
          </CommandGroup>
          <CommandGroup heading='Preferences'>
            <CommandItem keywords={['palette', 'hotkey']}>Settings</CommandItem>
            <CommandItem shortcut='⌘⇧P'>Command Palette</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// ─── Command ────────────────────────────────────────────────────
export default function CommandDemo() {
  return (
    <>
      <h1>Command</h1>
      <p className={intro}>Command palette with filterable list of items.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Command>
          <CommandInput placeholder='Type a command...' />
          <CommandList>
            <CommandGroup heading='File'>
              <CommandItem shortcut='⌘N'>New File</CommandItem>
              <CommandItem shortcut='⌘O'>Open File</CommandItem>
              <CommandItem shortcut='⌘S'>Save</CommandItem>
            </CommandGroup>
            <CommandGroup heading='Other'>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>

      <div className={section}>
        <h2>CommandDialog (mod+k)</h2>
        <p>
          <code>CommandDialog</code> composes <code>Dialog</code> (native top-layer
          <code>&lt;dialog&gt;</code>) with <code>Command</code>: it registers a global
          hotkey (<code>hotkey=&apos;mod+k&apos;</code> — omit the prop to register nothing),
          focuses the input on open, closes on Esc / backdrop / item selection, and
          renders the empty-state copy when filtering leaves nothing.
        </p>
        <CommandPaletteExample />
      </div>

      <div className={section}>
        <h2>Command Props</h2>
        <PropsTable of='CommandProps' />
      </div>

      <div className={section}>
        <h2>CommandInput Props</h2>
        <PropsTable of='CommandInputProps' />
      </div>

      <div className={section}>
        <h2>CommandList Props</h2>
        <PropsTable of='CommandListProps' />
      </div>

      <div className={section}>
        <h2>CommandItem Props</h2>
        <PropsTable of='CommandItemProps' />
      </div>

      <div className={section}>
        <h2>CommandGroup Props</h2>
        <PropsTable of='CommandGroupProps' />
      </div>

      <div className={section}>
        <h2>CommandDialog Props</h2>
        <PropsTable of='CommandDialogProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;combobox&quot;</strong> on the container</li>
            <li>Items use <strong>role=&quot;option&quot;</strong>, groups <strong>role=&quot;group&quot;</strong> named by their heading</li>
            <li>Typing in the input filters items by <code>value</code> / children text / <code>keywords</code></li>
            <li>Groups whose every item was filtered out hide entirely; keyboard focus stays continuous across groups</li>
            <li>CommandDialog traps focus in the native modal dialog and returns it on close</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
