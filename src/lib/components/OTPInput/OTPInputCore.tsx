import type { Ref } from 'react';

import { useRef, useCallback } from 'react';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';
import { mergeRefs } from '../../utils/refs';

type OTPInputCoreProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Forwarded to the first cell's `<input>`. */
  ref?: Ref<HTMLInputElement>;
};

const container = css`
  display: inline-flex;
  gap: var(--haze-space-2);
  font-family: var(--haze-font-sans);
`;

const cell = css`
  width: 2.5rem;
  height: 2.75rem;
  text-align: center;
  font-size: var(--haze-text-lg);
  font-family: var(--haze-font-mono);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  outline: none;
  transition: border-color var(--haze-duration-fast), box-shadow var(--haze-duration-fast);

  &:focus {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

export default function OTPInputCore({
  length = 6,
  value,
  onChange,
  className,
  ref,
}: OTPInputCoreProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const strings = useStrings('otpInput');
  // The forwarded ref rides cell 0 — the first cell is the component's
  // focus entry point.
  const setFirstCellRef = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(ref)(node),
    [ref]
  );

  const handleChange = useCallback(
    (index: number, char: string) => {
      const next = value.split('');
      next[index] = char.slice(-1);
      const joined = next.join('').slice(0, length);
      onChange(joined);

      if (char && index < length - 1) {
        refs.current[index + 1]?.focus();
      }
    },
    [value, length, onChange],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    },
    [value],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      refs.current[nextIndex]?.focus();
    },
    [length, onChange],
  );

  return (
    <div x-class={[container, className]}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
            if (i === 0) setFirstCellRef(el);
          }}
          x-class={[cell]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          aria-label={formatString(strings.digitLabel, { index: i + 1, total: length })}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

export type { OTPInputCoreProps };
