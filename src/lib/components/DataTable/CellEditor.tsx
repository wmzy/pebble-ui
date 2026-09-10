import { useRef, useState } from 'react';

import { css } from '@linaria/core';

import { InputCore } from '../Input';

type CellEditorProps = {
  /** Built-in editor variant: text saves the raw draft, number parses it. */
  kind: 'text' | 'number';
  /** Current cell value — stringified into the draft. */
  value: unknown;
  /** Accessible name for the editor input. */
  ariaLabel: string;
  /**
   * Commits the draft: the text variant reports the raw string, the number
   * variant a parsed number (`null` when the draft is empty). Called once
   * (Enter or blur); the editor then unmounts as DataTable exits edit mode.
   */
  onSave: (next: string | number | null) => void;
  /** Discards the draft (Escape). */
  onCancel: () => void;
};

/* Counteracts the cell padding so the input fills the row height without
 * growing the row while editing; `min-width` keeps it shrinkable inside
 * narrow `table-layout: fixed` columns. */
const editorInput = css`
  min-width: 0;
  margin-block: calc(-1 * var(--haze-space-1));
`;

/** Primitive-safe draft seed: string/number values seed the editor, anything
 * else (objects, booleans) starts from an empty draft. */
function seedDraft(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

/**
 * The built-in inline cell editor behind `editable` + `meta.editor:
 * 'text' | 'number'`. Enters with focus and the draft selected; Enter
 * saves, Escape cancels, blur saves. After a keyboard exit (Enter/Escape)
 * focus returns to the cell so Tab keeps walking the row.
 */
export default function CellEditor({
  kind,
  value,
  ariaLabel,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [draft, setDraft] = useState(() => seedDraft(value));
  // Enter/blur both fire in some sequences (focus moves on commit) — the
  // flag keeps exactly one exit per editing session.
  const settled = useRef(false);

  const settle = (save: boolean) => {
    if (settled.current) return;
    settled.current = true;
    if (!save) {
      onCancel();
      return;
    }
    if (kind === 'number') {
      onSave(draft.trim() === '' ? null : Number(draft));
    } else {
      onSave(draft);
    }
  };

  return (
    <InputCore
      size='sm'
      type={kind === 'number' ? 'number' : 'text'}
      className={editorInput}
      autoFocus
      aria-label={ariaLabel}
      value={draft}
      onChange={setDraft}
      onFocus={(event) => event.target.select()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          settle(true);
          event.currentTarget.closest('td')?.focus();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          settle(false);
          event.currentTarget.closest('td')?.focus();
        }
      }}
      onBlur={() => settle(true)}
    />
  );
}

export type { CellEditorProps };
