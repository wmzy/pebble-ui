import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useEffect, useId, useRef, useState } from 'react';
import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import { mergeRefs } from '../../utils/refs';

import { useStrings } from '../LocaleProvider';

type InlineCompletionProps = {
  /** The remaining completion, rendered as ghost text after `value`. */
  suggestion?: string;
  value?: ControlOrValue<string>;
  /** Fired after the suggestion has been accepted into `value` (Tab). */
  onAccept?: () => void;
  /** Fired when the active suggestion is dismissed (Escape). */
  onDismiss?: () => void;
  /** Render a `<textarea>` host instead of a single-line `<input>`. */
  multiline?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Screen-reader hint, announced while a suggestion is active.
   * Default from `inlineCompletion.hint` in the locale packs. */
  hint?: string;
  /** Visible rows of the `multiline` host. */
  rows?: number;
  /** Native change event passthrough — stays a native handler (Input
   * sugar contract); the value itself leaves through the `value` control. */
  onChange?: ComponentPropsWithoutRef<'input'>['onChange'];
  className?: string;
  /** Forwarded to the host input/textarea — form bridges and
   * `ref.current.focus()` reach the focusable element, not the wrapper. */
  ref?: Ref<HTMLInputElement | HTMLTextAreaElement>;
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  'value' | 'onChange' | 'size' | 'defaultValue'
>;

const wrapper = css`
  position: relative;
  display: flex;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  font-family: var(--haze-font-mono);
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);

  &:focus-within {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

/* The host paints above the ghost (both positioned, host later in DOM)
   with a transparent background so the ghost's suffix shows through. */
const host = css`
  position: relative;
  flex: 1;
  min-width: 0;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--haze-color-text);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  padding: var(--haze-space-2) var(--haze-space-3);
  resize: vertical;

  &::placeholder {
    color: var(--haze-color-text-muted);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* Mirrors the host's font/padding exactly — that is the alignment
   contract of the overlay. pointer-events:none keeps clicks on the host. */
const ghost = css`
  position: absolute;
  inset: 0;
  padding: var(--haze-space-2) var(--haze-space-3);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  white-space: pre;
  overflow: hidden;
  pointer-events: none;
  color: var(--haze-color-text-muted);
`;

const ghostMultiline = css`
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

/* The typed prefix is already painted by the host input above the
   overlay — rendering it again in the muted ghost color would double-
   paint (anti-aliasing fringe), so its copy here is fully transparent
   and only serves to push the suggestion suffix into position. */
const ghostTyped = css`
  color: transparent;
`;

const srOnly = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export default function InlineCompletion({
  suggestion,
  value: valueControl,
  onAccept,
  onDismiss,
  multiline = false,
  placeholder,
  disabled,
  hint,
  rows,
  className,
  ref,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  'aria-describedby': ariaDescribedby,
  ...rest
}: InlineCompletionProps) {
  const strings = useStrings('inlineCompletion');
  const resolvedHint = hint ?? strings.hint;
  const [value, setValue] = useControl(valueControl, '');
  // Purely internal UI state (focus reveal + per-suggestion dismissal),
  // never exposed as a prop — useState is the sanctioned case here.
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const ghostRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const hintId = useId();

  // A new suggestion is a fresh completion offer: dismissal of the
  // previous one must not leak into it.
  const prevSuggestionRef = useRef(suggestion);
  useEffect(() => {
    if (prevSuggestionRef.current !== suggestion) {
      prevSuggestionRef.current = suggestion;
      setDismissed(false);
    }
  }, [suggestion]);

  const hasSuggestion = suggestion !== undefined && suggestion !== '';
  const active = hasSuggestion && !dismissed && focused;
  const describedBy = active
    ? [ariaDescribedby, hintId].filter(Boolean).join(' ')
    : ariaDescribedby;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValue(e.target.value);
    // The consumer's onChange keeps native-event handler semantics
    // (Input sugar contract); the host union only differs in the
    // element type of the same event shape.
    onChange?.(e as React.ChangeEvent<HTMLInputElement>);
  };

  const syncGhostScroll = () => {
    const hostEl = hostRef.current;
    const ghostEl = ghostRef.current;
    if (!hostEl || !ghostEl) return;
    ghostEl.scrollTop = hostEl.scrollTop;
    ghostEl.scrollLeft = hostEl.scrollLeft;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (active) {
      if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setValue((prev) => prev + suggestion);
        setDismissed(true);
        onAccept?.();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setDismissed(true);
        onDismiss?.();
        return;
      }
    }
    onKeyDown?.(e as React.KeyboardEvent<HTMLInputElement>);
  };

  const sharedHandlers = {
    ref: mergeRefs(hostRef, ref),
    value,
    onChange: handleChange,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFocused(true);
      onFocus?.(e as React.FocusEvent<HTMLInputElement>);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFocused(false);
      onBlur?.(e as React.FocusEvent<HTMLInputElement>);
    },
    onKeyDown: handleKeyDown,
    onScroll: syncGhostScroll,
    placeholder,
    disabled,
    'aria-describedby': describedBy,
  };

  return (
    <div x-class={[wrapper, className]}>
      {active && (
        <div
          ref={ghostRef}
          aria-hidden='true'
          x-class={[ghost, multiline && ghostMultiline]}
        >
          <span x-class={[ghostTyped]}>{value}</span>
          <span>{suggestion}</span>
        </div>
      )}
      {/* The public contract is input props; the textarea host accepts the
          same DOM surface (strict React 19 handler generics make the
          element-typed flavors formally incompatible), hence the one cast. */}
      {multiline ? (
        <textarea
          x-class={[host]}
          rows={rows ?? 3}
          {...sharedHandlers}
          {...(rest as ComponentPropsWithoutRef<'textarea'>)}
        />
      ) : (
        <input x-class={[host]} {...sharedHandlers} {...rest} />
      )}
      {active && (
        <span id={hintId} x-class={[srOnly]}>
          {resolvedHint}
        </span>
      )}
    </div>
  );
}

export type { InlineCompletionProps };
