import { useControl } from 'react-use-control';

import { Switch, TagInput } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

/** Sortable tags: one control owns the tag array, the Switch toggles the
 * sortable mode — reorders write straight back through the control. */
function SortableTagInputExample() {
  const [tags, , tagsCtrl] = useControl(undefined, [
    'react',
    'typescript',
    'linaria',
    'oklch',
  ]);
  const [sortable, , sortableCtrl] = useControl(undefined, true);

  return (
    <>
      <div className={fieldRow}>
        <Switch checked={sortableCtrl} aria-label='Toggle tag sorting' />
        <TagInput value={tagsCtrl} sortable={sortable} placeholder='Add tag' />
      </div>
      <p>Current order: {tags.join(' → ')}</p>
    </>
  );
}

// ─── TagInput ───────────────────────────────────────────────────
export default function TagInputDemo() {
  return (
    <>
      <h1>TagInput</h1>
      <p className={intro}>
        Input field for adding and removing tags, with an opt-in sortable
        mode built on <a href='https://dndkit.com'>dnd-kit</a> (optional
        peers — install <code>@dnd-kit/core</code>,{' '}
        <code>@dnd-kit/sortable</code> and <code>@dnd-kit/utilities</code>{' '}
        only if you use <code>sortable</code>).
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <TagInput placeholder='Type and press Enter' />
        </div>
      </div>

      <div className={section}>
        <h2>Sortable tags</h2>
        <SortableTagInputExample />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TagInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Enter or comma adds a tag</li>
            <li>Backspace on empty input removes last tag</li>
            <li>Remove buttons are keyboard accessible</li>
            <li>
              Sortable mode: focus a tag&apos;s label, press{' '}
              <strong>Space</strong> to lift, arrow keys to move,{' '}
              <strong>Space</strong> to drop, <strong>Escape</strong> to
              cancel
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
