import type {
  ChangeEvent,
  ComponentPropsWithoutRef,
  KeyboardEvent,
  SyntheticEvent,
} from 'react';

import { css } from '@linaria/core';
import { useEffect, useId, useRef, useState } from 'react';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { useStrings } from '../LocaleProvider';

export type MentionsOption = {
  /** Text inserted after the trigger character when picked. */
  value: string;
  /** Display text; falls back to `value` when omitted. */
  label?: string;
};

type MentionsCoreProps = {
  value: string;
  onChange: (value: string) => void;
  options: MentionsOption[];
  /**
   * Single character that opens the suggestion panel while typing.
   * Defaults to '@'.
   */
  trigger?: string;
  placeholder?: string;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'value' | 'onChange' | 'placeholder' | 'className' | 'style'
>;

const wrapper = css`
  position: relative;
  display: inline-block;
  width: 100%;
`;

const textareaClass = css`
  display: block;
  width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  padding: var(--haze-space-2) var(--haze-space-3);
  resize: vertical;
  box-sizing: border-box;
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &::placeholder {
    color: var(--haze-color-text-muted);
  }

  &:hover {
    border-color: var(--haze-color-border-hover);
  }

  &:focus {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Same tier-aware width contract as Combobox's listbox: the fallback
 * tier's containing block is the textarea-width wrapper, so `100%`
 * matches it; the anchored tier's containing block is the viewport-wide
 * position-area region, so the second declaration re-pins the panel to
 * the trigger's border-box width and drops as invalid on engines
 * without anchor positioning.
 */
const listbox = css`
  box-sizing: border-box;
  min-width: 100%;
  min-width: anchor-size(width);
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);
`;

const option = css`
  display: flex;
  align-items: center;
  padding: var(--haze-space-2) var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  cursor: pointer;
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }
`;

const highlightedStyle = css`
  background: var(--haze-color-bg-subtle);
`;

const noMatch = css`
  display: flex;
  align-items: center;
  padding: var(--haze-space-2) var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
`;

/** The mention token the caret currently sits in, if any. */
type MentionMarker = {
  /** Index of the trigger character. */
  start: number;
  /** Caret position when the marker was recorded — the token's end. */
  end: number;
  /** Text between the trigger and the caret; filters the options. */
  query: string;
};

/**
 * Finds the mention token at the caret: a trigger character at the
 * start of the text or right after whitespace, with nothing but
 * non-whitespace between it and the caret. The word-boundary rule keeps
 * email-like text ("a@b") from opening the panel.
 */
function findMentionMarker(
  text: string,
  caret: number,
  trigger: string
): MentionMarker | null {
  const head = Math.min(caret, text.length);
  for (let i = head - 1; i >= 0; i -= 1) {
    const ch = text[i];
    // Unreachable (i < head <= length), but the checked index signature
    // says otherwise — treat it as end-of-text.
    if (ch === undefined) return null;
    if (/\s/.test(ch)) return null;
    // The trigger only opens a token at the start of the text or right
    // after whitespace; "a@b" stays plain text.
    const before = i > 0 ? text[i - 1] : undefined;
    if (ch === trigger && (before === undefined || /\s/.test(before))) {
      return { start: i, end: head, query: text.slice(i + 1, head) };
    }
  }
  return null;
}

export default function MentionsCore({
  value,
  onChange,
  options,
  trigger = '@',
  placeholder,
  className,
  'aria-label': ariaLabel,
  ...rest
}: MentionsCoreProps) {
  const strings = useStrings('mentions');
  const [open, setOpen] = useState(false);
  const [marker, setMarker] = useState<MentionMarker | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const floating = useFloating({
    open,
    setOpen,
    triggerRef: textareaRef,
    panelRef,
    animated: true,
  });

  // Case-insensitive prefix match against both the insertion value and
  // the display label, per the typing that followed the trigger.
  const filtered = marker
    ? options.filter((o) => {
        const q = marker.query.toLowerCase();
        return (
          o.value.toLowerCase().startsWith(q) ||
          (o.label?.toLowerCase().startsWith(q) ?? false)
        );
      })
    : [];

  // Stable, SSR-safe DOM id per option row: listbox id + index, both
  // deterministic across renders and re-opens (no random values). The
  // textarea's aria-activedescendant points here so screen readers
  // announce the keyboard highlight on rows that never receive DOM focus.
  const optionId = (index: number) => `${id}-option-${index}`;

  // Only while the popup is open — a closed listbox must not own the
  // textarea's active descendant. No highlight (or an out-of-range one
  // after the option list shrank) omits the attribute entirely.
  const activeDescendant =
    open && filtered[highlightIndex] ? optionId(highlightIndex) : undefined;

  // Editing the token invalidates the highlight — adjust during render
  // (React-endorsed reset) so the first filtered frame already drops a
  // stale highlight, keyed on token identity + query so a brand-new
  // token resets even when its query starts out identical.
  const markerKey = marker ? `${marker.start}:${marker.query}` : '';
  const [prevMarkerKey, setPrevMarkerKey] = useState(markerKey);
  if (markerKey !== prevMarkerKey) {
    setPrevMarkerKey(markerKey);
    setHighlightIndex(-1);
  }

  // After an insertion the caret must land right after the inserted
  // mention, but the DOM value re-renders from the committed `value` —
  // stash the offset and apply it once that commit lands.
  const pendingCaretRef = useRef<number | null>(null);
  useEffect(() => {
    const caret = pendingCaretRef.current;
    if (caret === null) return;
    pendingCaretRef.current = null;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(caret, caret);
  }, [value]);

  /** Recomputes the token (and panel visibility) from the live caret. */
  const syncFromCaret = (text: string, caret: number) => {
    const nextMarker = findMentionMarker(text, caret, trigger);
    setMarker(nextMarker);
    setOpen(nextMarker !== null);
  };

  const insertMention = (optionToInsert: MentionsOption) => {
    if (!marker) return;
    const text = textareaRef.current?.value ?? value;
    const end = Math.min(marker.end, text.length);
    const insertion = `${trigger}${optionToInsert.value} `;
    onChange(text.slice(0, marker.start) + insertion + text.slice(end));
    pendingCaretRef.current = marker.start + insertion.length;
    setMarker(null);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // The panel is typing-driven; without an open panel every key keeps
    // its native textarea behavior (newlines, caret moves, tabbing away).
    if (!open) return;
    if (e.key === 'ArrowDown') {
      // Keep the caret put while navigating the suggestion list.
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      // With the panel open, Enter/Tab always commits a mention — the
      // highlighted row when the user navigated, otherwise the first
      // option (the AntD Mentions / GitHub convention: no explicit
      // highlight still means "top suggestion").
      const selected = filtered[highlightIndex] ?? filtered[0];
      if (selected) {
        // No newline / focus move — the mention replaces the token.
        e.preventDefault();
        insertMention(selected);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    syncFromCaret(e.target.value, e.target.selectionStart);
  };

  // Caret moves without edits (clicks, arrow keys) re-evaluate the token
  // too, so the panel follows the caret in and out of mention tokens.
  const handleSelect = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    syncFromCaret(el.value, el.selectionStart);
  };

  return (
    <div
      // Combobox semantics live on the wrapper, not the textarea:
      // html-aria forbids role overrides on textarea (unlike input), and
      // axe flags aria-expanded on a plain textbox — the focused textarea
      // below still carries the APG combobox attrs that are legal there
      // (aria-autocomplete/controls/activedescendant).
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={id}
      aria-label={ariaLabel ?? placeholder ?? strings.label}
      x-class={[wrapper, className]}
    >
      <textarea
        ref={textareaRef}
        style={floating.triggerStyle}
        aria-label={ariaLabel ?? placeholder ?? strings.label}
        aria-autocomplete="list"
        aria-controls={id}
        aria-activedescendant={activeDescendant}
        className={textareaClass}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onSelect={handleSelect}
        onPointerDown={floating.onTriggerPointerDown}
        onKeyDown={handleKeyDown}
        {...rest}
      />
      <FloatingPanel
        ref={panelRef}
        behavior={floating}
        placement="bottom-span"
        id={id}
        role="listbox"
        visualClass={listbox}
      >
        {filtered.length === 0 ? (
          // An aria-disabled option keeps the listbox's required owned
          // elements satisfied while nothing is actually selectable.
          <div
            role="option"
            aria-selected="false"
            aria-disabled="true"
            className={noMatch}
          >
            {strings.noMatch}
          </div>
        ) : (
          filtered.map((o, i) => (
            <div
              key={o.value}
              role="option"
              id={optionId(i)}
              aria-selected={i === highlightIndex}
              aria-setsize={filtered.length}
              aria-posinset={i + 1}
              x-class={[option, i === highlightIndex && highlightedStyle]}
              onClick={() => insertMention(o)}
            >
              {o.label ?? o.value}
            </div>
          ))
        )}
      </FloatingPanel>
    </div>
  );
}

export type { MentionsCoreProps };
