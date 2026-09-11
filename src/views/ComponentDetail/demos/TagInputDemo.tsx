import { useControl } from 'react-use-control';

import { SortableTagInput, TagInput } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, fieldRow } from '../styles';

/** Sortable tags: one control owns the tag array — reorders write
 * straight back through the control. */
function SortableTagInputExample() {
  const [tags, , tagsCtrl] = useControl(undefined, [
    'react',
    'typescript',
    'linaria',
    'oklch',
  ]);

  return (
    <>
      <div className={fieldRow}>
        <SortableTagInput value={tagsCtrl} placeholder='Add tag' />
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
        Input field for adding and removing tags. Drag-and-drop reordering
        lives in the sibling <code>SortableTagInput</code> (and{' '}
        <code>SortableTagGroup</code>) built on{' '}
        <a href='https://dndkit.com'>dnd-kit</a> — a haze-ui dependency,
        installed with the package and bundled only when you import a
        Sortable variant.
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
              SortableTagInput: focus a tag&apos;s label, press{' '}
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
