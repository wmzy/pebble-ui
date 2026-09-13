import type { ControlOrValue } from 'react-use-control';

import { useState, useRef, useEffect } from 'react';
import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type InlineEditProps = {
  value?: ControlOrValue<string>;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const display = css`
  cursor: text;
  padding: var(--haze-space-1) var(--haze-space-2);
  border-radius: var(--haze-radius-md);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  min-height: 1.75rem;
  min-width: 2rem;
  border: 1px solid transparent;
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-muted);
  }
`;

const editing = css`
  padding: var(--haze-space-1) var(--haze-space-2);
  border: 1px solid var(--haze-color-primary);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  outline: none;
  box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  min-width: 2rem;
`;

const placeholderStyle = css`
  color: var(--haze-color-text-muted);
  font-style: italic;
`;

export default function InlineEdit({
  value: valueControl,
  onChange,
  placeholder,
  disabled,
  className,
}: InlineEditProps) {
  const [value, setValue] = useControl(valueControl, '');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const strings = useStrings('inlineEdit');
  const placeholderLabel = placeholder ?? strings.placeholder;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    if (disabled) return;
    setDraft(value);
    setIsEditing(true);
  };

  const commit = () => {
    setIsEditing(false);
    if (draft !== value) {
      setValue(draft);
      onChange?.(draft);
    }
  };

  const cancel = () => {
    setIsEditing(false);
    setDraft(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        data-slot='inline-edit'
        x-class={[editing, className]}
        aria-label={placeholderLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <span
      data-slot='inline-edit'
      x-class={[display, !value && placeholderStyle, className]}
      onClick={startEditing}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') startEditing(); }}
    >
      {value || placeholderLabel}
    </span>
  );
}

export type { InlineEditProps };
