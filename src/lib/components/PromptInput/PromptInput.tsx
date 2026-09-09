import type {
  ChangeEvent,
  ComponentPropsWithoutRef,
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  SyntheticEvent,
} from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { FloatingPanel, useFloating } from '../../utils/floating';
import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';

type PromptInputProps = {
  /** Free-form draft text. */
  value?: ControlOrValue<string>;
  /** Value callback fired on every text edit (same value the control gets). */
  onChange?: (value: string) => void;
  /**
   * Inline removable tags rendered before the text (context attachments
   * for the prompt). They are never consumed by submit — removal is the
   * only mutation the component performs.
   */
  tags?: ControlOrValue<string[]>;
  /** Value callback fired when a tag is removed. */
  onTagsChange?: (tags: string[]) => void;
  /**
   * Trigger characters that open the suggestion listbox while typing.
   * Defaults to `['@']`. Inert without `getSuggestions`.
   */
  triggers?: string[];
  /**
   * Suggestions for the token at the caret: called with the trigger
   * character and the text typed after it. Async responses are applied
   * in request order — a stale response is discarded once a newer
   * request has been issued.
   */
  getSuggestions?: (
    trigger: string,
    query: string
  ) => string[] | Promise<string[]>;
  /**
   * Fired when the submit key is pressed with non-empty text; the draft
   * clears afterwards (tags stay). Enter still commits a highlighted
   * suggestion first while the listbox is open.
   */
  onSubmit?: () => void;
  /**
   * `'enter'` (default): Enter submits, Shift+Enter inserts a newline.
   * `'mod-enter'`: only Ctrl/Cmd+Enter submits, plain Enter newlines.
   */
  submitKey?: 'enter' | 'mod-enter';
  placeholder?: string;
  disabled?: boolean;
  /** Auto-grow cap in text rows; beyond it the textarea scrolls. */
  maxRows?: number;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'value' | 'onChange' | 'placeholder' | 'className' | 'style' | 'rows'
>;

/* The field chrome lives on the container (TagInput pattern): tags and
   the borderless textarea flow inside it, and :focus-within paints the
   Input-style focus ring. position:relative anchors the fallback-tier
   suggestion panel. */
const container = css`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--haze-space-1);
  width: 100%;
  box-sizing: border-box;
  min-height: 2.25rem;
  padding: var(--haze-space-2) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &:hover {
    border-color: var(--haze-color-border-hover);
  }

  &:focus-within {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const containerDisabled = css`
  opacity: 0.5;
  cursor: not-allowed;

  &:hover {
    border-color: var(--haze-color-border);
  }
`;

/* Tags flow inline with the textarea; the ul wraps while staying a flex
   participant of the container. */
const tagList = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const tag = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-0) var(--haze-space-2);
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
`;

const removeBtn = css`
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  padding: var(--haze-space-1);
  min-width: 1.5rem;
  min-height: 1.5rem;

  &:hover:not(:disabled) {
    color: var(--haze-color-text);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const textareaClass = css`
  flex: 1;
  min-width: 8rem;
  border: none;
  outline: none;
  background: none;
  resize: none;
  overflow-y: auto;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-relaxed);
  color: var(--haze-color-text);
  padding: 0;

  &::placeholder {
    color: var(--haze-color-text-muted);
  }
`;

/**
 * Same tier-aware width contract as Mentions' listbox: the fallback
 * tier's containing block is the field-width container, so `100%`
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

const hintRow = css`
  display: flex;
  align-items: center;
  padding: var(--haze-space-2) var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
`;

/** The trigger token the caret currently sits in, if any. */
type SuggestMarker = {
  /** The trigger character that opened the token. */
  trigger: string;
  /** Index of the trigger character. */
  start: number;
  /** Caret position when the marker was recorded — the token's end. */
  end: number;
  /** Text between the trigger and the caret; the async query. */
  query: string;
};

/**
 * Finds the trigger token at the caret: a trigger character at the
 * start of the text or right after whitespace, with nothing but
 * non-whitespace between it and the caret. The word-boundary rule keeps
 * email-like text ("a@b") from opening the panel.
 */
function findSuggestMarker(
  text: string,
  caret: number,
  triggers: string[]
): SuggestMarker | null {
  const head = Math.min(caret, text.length);
  for (let i = head - 1; i >= 0; i -= 1) {
    const ch = text[i];
    // Unreachable (i < head <= length), but the checked index signature
    // says otherwise — treat it as end-of-text.
    if (ch === undefined) return null;
    if (/\s/.test(ch)) return null;
    // A trigger only opens a token at the start of the text or right
    // after whitespace; "a@b" stays plain text.
    const before = i > 0 ? text[i - 1] : undefined;
    if (triggers.includes(ch) && (before === undefined || /\s/.test(before))) {
      return {
        trigger: ch,
        start: i,
        end: head,
        query: text.slice(i + 1, head),
      };
    }
  }
  return null;
}

/** Computed px value as a positive number, 0 when unresolvable (jsdom). */
function readablePx(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Line height in px; `normal`/unresolvable falls back to 1.5 × font. */
function readableLineHeight(computed: CSSStyleDeclaration): number {
  const line = readablePx(computed.lineHeight);
  if (line > 0) return line;
  return readablePx(computed.fontSize) * 1.5;
}

export default function PromptInput({
  value: valueControl,
  onChange,
  tags: tagsControl,
  onTagsChange,
  triggers = ['@'],
  getSuggestions,
  onSubmit,
  submitKey = 'enter',
  placeholder,
  disabled,
  maxRows,
  className,
  'aria-label': ariaLabel,
  ...rest
}: PromptInputProps) {
  const strings = useStrings('promptInput');
  const [value, setValue] = useControl(valueControl, '');
  const [tags, setTags] = useControl(tagsControl, []);

  const [marker, setMarker] = useState<SuggestMarker | null>(null);
  // The token an Escape dismissed — the panel stays closed for it until
  // the caret re-enters or the token changes (null = nothing dismissed).
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Request sequence for async getSuggestions: only the newest request's
  // response may land — stale ones are dropped on arrival.
  const requestSeqRef = useRef(0);
  // After an insertion the caret must land right after the inserted
  // token, but the DOM value re-renders from the committed `value` —
  // stash the offset and apply it once that commit lands.
  const pendingCaretRef = useRef<number | null>(null);

  const completionEnabled = Boolean(getSuggestions && triggers.length > 0);
  const markerKey = marker
    ? `${marker.trigger}:${marker.start}:${marker.query}`
    : '';
  const open =
    completionEnabled && marker !== null && dismissedKey !== markerKey;

  // Editing the token invalidates the highlight — adjust during render
  // (React-endorsed reset) so the first filtered frame already drops a
  // stale highlight. Caret moves that recompute the same token keep it.
  const [prevMarkerKey, setPrevMarkerKey] = useState(markerKey);
  if (markerKey !== prevMarkerKey) {
    setPrevMarkerKey(markerKey);
    setHighlightIndex(-1);
  }
  // Any caret re-entry into a token re-arms the panel after Escape —
  // the dismissed key belongs to the previous caret visit only.
  const [prevMarker, setPrevMarker] = useState(marker);
  if (marker !== prevMarker) {
    setPrevMarker(marker);
    setDismissedKey(null);
  }

  const setOpen = useCallback<Dispatch<SetStateAction<boolean>>>(
    (next) => {
      if (next === false) setDismissedKey(markerKey);
    },
    [markerKey]
  );

  const floating = useFloating({
    open,
    setOpen,
    triggerRef: textareaRef,
    panelRef,
    animated: true,
  });

  // Auto-grow: one row tall, expanding with the content up to maxRows
  // (beyond it the textarea scrolls — overflow-y lives in its class).
  // External control writes land here too, so the height always tracks
  // the committed value.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    let height = el.scrollHeight;
    if (maxRows) {
      const computed = getComputedStyle(el);
      const linePx = readableLineHeight(computed);
      if (linePx > 0) {
        const padY =
          readablePx(computed.paddingTop) + readablePx(computed.paddingBottom);
        height = Math.min(height, maxRows * linePx + padY);
      }
    }
    el.style.height = `${height}px`;
  }, [value, maxRows, disabled]);

  useEffect(() => {
    const caret = pendingCaretRef.current;
    if (caret === null) return;
    pendingCaretRef.current = null;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(caret, caret);
  }, [value]);

  const label = ariaLabel ?? placeholder ?? strings.label;

  // Stable, SSR-safe DOM id per option row: listbox id + index. The
  // textarea's aria-activedescendant points here so screen readers
  // announce the keyboard highlight on rows that never receive focus.
  const optionId = (index: number) => `${id}-option-${index}`;
  const current = suggestions[highlightIndex];
  // Only while the popup is open — a closed listbox must not own the
  // textarea's active descendant.
  const activeDescendant =
    open && current !== undefined ? optionId(highlightIndex) : undefined;

  /** Fetches suggestions for the token at the caret, guarding races. */
  const fetchSuggestions = (atMarker: SuggestMarker | null) => {
    const seq = ++requestSeqRef.current;
    if (!atMarker || !getSuggestions) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const result = getSuggestions(atMarker.trigger, atMarker.query);
    if (Array.isArray(result)) {
      setSuggestions(result);
      setLoading(false);
      return;
    }
    setLoading(true);
    void result.then(
      (list) => {
        // A newer request has been issued since — drop the stale list.
        if (requestSeqRef.current !== seq) return;
        setSuggestions(list);
        setLoading(false);
      },
      () => {
        if (requestSeqRef.current !== seq) return;
        setSuggestions([]);
        setLoading(false);
      }
    );
  };

  /** Recomputes the token (and panel visibility) from the live caret. */
  const syncFromCaret = (text: string, caret: number) => {
    const next = completionEnabled
      ? findSuggestMarker(text, caret, triggers)
      : null;
    setMarker(next);
    fetchSuggestions(next);
  };

  const updateText = (next: string) => {
    setValue(next);
    onChange?.(next);
  };

  const updateTags = (next: string[]) => {
    setTags(next);
    onTagsChange?.(next);
  };

  const insertSuggestion = (suggestion: string) => {
    if (!marker) return;
    const text = textareaRef.current?.value ?? value;
    const end = Math.min(marker.end, text.length);
    const insertion = `${marker.trigger}${suggestion} `;
    updateText(text.slice(0, marker.start) + insertion + text.slice(end));
    pendingCaretRef.current = marker.start + insertion.length;
    setMarker(null);
    fetchSuggestions(null);
    setDismissedKey(null);
    setHighlightIndex(-1);
  };

  const submit = () => {
    if (disabled || !value.trim()) return;
    onSubmit?.();
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (e.key === 'ArrowDown') {
        // Keep the caret put while navigating the suggestion list.
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        // Enter/Tab with the panel open commits a suggestion — the
        // highlighted row when the user navigated, otherwise the first
        // one (the AntD Mentions / GitHub convention). With nothing
        // selectable the key keeps its native behavior: mid-token Enter
        // is a newline, not a submit.
        const selected = suggestions[highlightIndex] ?? suggestions[0];
        if (selected !== undefined) {
          e.preventDefault();
          insertSuggestion(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        // Close the panel but keep the text (and the token) intact.
        setDismissedKey(markerKey);
        return;
      }
    }
    // Backspace on empty text removes the last tag (composer habit —
    // focus and caret stay in the textarea).
    if (e.key === 'Backspace' && value === '' && tags.length > 0) {
      e.preventDefault();
      updateTags(tags.slice(0, -1));
      return;
    }
    const mod = e.metaKey || e.ctrlKey;
    const wantsSubmit =
      submitKey === 'mod-enter'
        ? mod && e.key === 'Enter'
        : e.key === 'Enter' && !mod && !e.shiftKey;
    if (wantsSubmit) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateText(e.target.value);
    syncFromCaret(e.target.value, e.target.selectionStart);
  };

  // Caret moves without edits (clicks, arrow keys) re-evaluate the token
  // too, so the panel follows the caret in and out of trigger tokens.
  const handleSelect = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    syncFromCaret(el.value, el.selectionStart);
  };

  return (
    <div
      // Combobox semantics live on the wrapper, not the textarea
      // (html-aria forbids role overrides on textarea, and axe flags
      // aria-expanded on a plain textbox) — and only when completion is
      // enabled; without getSuggestions the component is a plain
      // auto-growing textbox.
      role={completionEnabled ? 'combobox' : undefined}
      aria-expanded={completionEnabled ? open : undefined}
      aria-haspopup={completionEnabled ? 'listbox' : undefined}
      aria-controls={completionEnabled ? id : undefined}
      aria-label={label}
      x-class={[container, disabled && containerDisabled, className]}
    >
      {tags.length > 0 && (
        <ul className={tagList}>
          {tags.map((tag, i) => (
            <li key={`${tag}:${i}`} className={tag}>
              {tag}
              <button
                type="button"
                className={removeBtn}
                aria-label={formatString(strings.removeTag, { tag })}
                disabled={disabled}
                onClick={() => updateTags(tags.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={textareaRef}
        rows={1}
        style={completionEnabled ? floating.triggerStyle : undefined}
        className={textareaClass}
        value={value}
        placeholder={placeholder}
        aria-label={label}
        aria-autocomplete={completionEnabled ? 'list' : undefined}
        aria-controls={completionEnabled ? id : undefined}
        aria-activedescendant={activeDescendant}
        disabled={disabled}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onPointerDown={
          completionEnabled ? floating.onTriggerPointerDown : undefined
        }
        {...rest}
      />
      {completionEnabled && (
        <FloatingPanel
          ref={panelRef}
          behavior={floating}
          placement="bottom-span"
          id={id}
          role="listbox"
          visualClass={listbox}
        >
          {loading ? (
            // An aria-disabled option keeps the listbox's required owned
            // elements satisfied while nothing is actually selectable.
            <div
              role="option"
              aria-selected="false"
              aria-disabled="true"
              className={hintRow}
            >
              {strings.loading}
            </div>
          ) : suggestions.length === 0 ? (
            <div
              role="option"
              aria-selected="false"
              aria-disabled="true"
              className={hintRow}
            >
              {strings.noMatch}
            </div>
          ) : (
            suggestions.map((suggestion, i) => (
              <div
                key={`${suggestion}:${i}`}
                role="option"
                id={optionId(i)}
                aria-selected={i === highlightIndex}
                aria-setsize={suggestions.length}
                aria-posinset={i + 1}
                x-class={[option, i === highlightIndex && highlightedStyle]}
                onClick={() => insertSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            ))
          )}
        </FloatingPanel>
      )}
    </div>
  );
}

export type { PromptInputProps };
