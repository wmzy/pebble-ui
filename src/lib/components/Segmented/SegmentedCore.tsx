import type { ReactNode, Ref } from 'react';

import { css } from '@linaria/core';
import { useCallback } from 'react';

import { mergeRefs } from '../../utils/refs';

type SegmentedOption =
  | string
  | { value: string; label: ReactNode; disabled?: boolean };

type SegmentedCoreProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /**
   * Forwarded to the group's focus target — the selected option's
   * `<button>` (falling back to the first).
   */
  ref?: Ref<HTMLButtonElement>;
};

const container = css`
  display: inline-flex;
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-md);
  padding: 2px;
  gap: 2px;
  font-family: var(--haze-font-sans);
  overflow-x: auto;
`;

const sizes = {
  sm: css`& button { padding: var(--haze-space-0) var(--haze-space-2); font-size: var(--haze-text-xs); }`,
  md: css`& button { padding: var(--haze-space-1) var(--haze-space-3); font-size: var(--haze-text-sm); }`,
  lg: css`& button { padding: var(--haze-space-2) var(--haze-space-4); font-size: var(--haze-text-base); }`,
} as const;

const btn = css`
  border: none;
  border-radius: var(--haze-radius-sm);
  background: transparent;
  color: var(--haze-color-text-secondary);
  cursor: pointer;
  font-family: var(--haze-font-sans);
  font-weight: var(--haze-weight-medium);
  transition: background var(--haze-duration-fast), color var(--haze-duration-fast);
  white-space: nowrap;

  &:hover:not(:disabled) {
    color: var(--haze-color-text);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

const activeBtn = css`
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  box-shadow: var(--haze-shadow-sm);
`;

function normalize(option: SegmentedOption) {
  if (typeof option === 'string')
    return { value: option, label: option, disabled: false };
  return option;
}

export default function SegmentedCore({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ref,
}: SegmentedCoreProps) {
  // The consumer's ref rides the selected option's button — the natural
  // focus target — falling back to the first when nothing is selected;
  // as the selection moves, the ref re-attaches to the new stop.
  const attachStop = useCallback(
    (node: HTMLButtonElement | null) => mergeRefs(ref)(node),
    [ref]
  );
  const stopIndex = Math.max(
    0,
    options.findIndex((opt) => normalize(opt).value === value)
  );
  return (
    <div x-class={[container, sizes[size], className]} role="group">
      {options.map((opt, index) => {
        const { value: val, label, disabled } = normalize(opt);
        return (
          <button
            key={val}
            ref={index === stopIndex ? attachStop : undefined}
            type="button"
            x-class={[btn, value === val && activeBtn]}
            disabled={disabled}
            onClick={() => onChange(val)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export type { SegmentedCoreProps, SegmentedOption };
