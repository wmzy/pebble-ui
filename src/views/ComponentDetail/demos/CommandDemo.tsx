import { Command, CommandInput, CommandList, CommandItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

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
            <CommandItem>New File</CommandItem>
            <CommandItem>Open File</CommandItem>
            <CommandItem>Save</CommandItem>
            <CommandItem>Settings</CommandItem>
          </CommandList>
        </Command>
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
        <h2>CommandItem Props</h2>
        <PropsTable of='CommandItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;combobox&quot;</strong> on the container</li>
            <li>Items use <strong>role=&quot;option&quot;</strong></li>
            <li>Typing in the input filters items by text content</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
