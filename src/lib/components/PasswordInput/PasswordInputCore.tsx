import type { Ref } from 'react';

import { useState } from 'react';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type PasswordInputCoreProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Forwarded to the inner password `<input>` (not the wrapper div). */
  ref?: Ref<HTMLInputElement>;
};

const wrapper = css`
  position: relative;
  display: inline-flex;
  width: 100%;
  font-family: var(--haze-font-sans);
`;

const input = css`
  width: 100%;
  padding: var(--haze-space-2) var(--haze-space-3);
  padding-inline-end: var(--haze-space-10);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  outline: none;
  transition: border-color var(--haze-duration-fast), box-shadow var(--haze-duration-fast);

  &:focus {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const toggle = css`
  position: absolute;
  inset-inline-end: var(--haze-space-2);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--haze-space-2);
  min-width: 2.5rem;
  min-height: 2.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);

  &:hover {
    color: var(--haze-color-text);
  }
`;

export default function PasswordInputCore({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  ref,
}: PasswordInputCoreProps) {
  const [visible, setVisible] = useState(false);
  const strings = useStrings('passwordInput');

  return (
    <div data-slot="password-input" x-class={[wrapper, className]}>
      <input
        ref={ref}
        data-slot="input"
        x-class={[input]}
        type={visible ? 'text' : 'password'}
        aria-label={strings.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        data-slot="toggle-visibility"
        x-class={[toggle]}
        type="button"
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
        aria-label={visible ? strings.hide : strings.show}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  );
}

export type { PasswordInputCoreProps };
