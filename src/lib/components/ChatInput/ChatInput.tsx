import type { ControlOrValue } from 'react-use-control';

import { useRef, useCallback } from 'react';
import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type ChatInputProps = {
  value?: ControlOrValue<string>;
  onSend?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
};

const wrapper = css`
  display: flex;
  align-items: flex-end;
  gap: var(--haze-space-2);
  padding: var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  font-family: var(--haze-font-sans);
  transition: border-color var(--haze-duration-fast), box-shadow var(--haze-duration-fast);

  &:focus-within {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const textarea = css`
  flex: 1;
  resize: none;
  border: none;
  outline: none;
  background: none;
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
  min-height: 1.5rem;
  max-height: 10rem;
  padding: 0;
`;

const sendBtn = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-primary);
  color: var(--haze-color-bg);
  border: none;
  cursor: pointer;
  font-size: var(--haze-text-sm);
  transition: opacity var(--haze-duration-fast);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

export default function ChatInput({
  value: valueControl,
  onSend,
  placeholder,
  disabled,
  maxLength,
  className,
}: ChatInputProps) {
  const [value, setValue] = useControl(valueControl, '');
  const ref = useRef<HTMLTextAreaElement>(null);
  const strings = useStrings('chatInput');
  const placeholderLabel = placeholder ?? strings.placeholder;

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    setValue('');
    if (ref.current) {
      ref.current.style.height = 'auto';
    }
  }, [value, disabled, onSend, setValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  };

  return (
    <div x-class={[wrapper, className]}>
      <textarea
        ref={ref}
        x-class={[textarea]}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholderLabel}
        disabled={disabled}
        maxLength={maxLength}
        rows={1}
      />
      <button
        x-class={[sendBtn]}
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label={strings.send}
      >
        &uarr;
      </button>
    </div>
  );
}

export type { ChatInputProps };
