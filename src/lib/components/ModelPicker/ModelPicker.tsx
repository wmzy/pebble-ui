import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type ModelOption = {
  value: string;
  label: string;
  description?: string;
  contextLength?: string;
};

type ModelPickerProps = {
  value?: ControlOrValue<string>;
  onChange?: (value: string) => void;
  options: ModelOption[];
  disabled?: boolean;
  className?: string;
};

const wrapper = css`
  font-family: var(--haze-font-sans);
`;

const select = css`
  width: 100%;
  padding: var(--haze-space-2) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-sans);
  outline: none;
  cursor: pointer;
  transition: border-color var(--haze-duration-fast), box-shadow var(--haze-duration-fast);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  /* physical: CSS has no logical background-position keywords — the
     [dir='rtl'] rule below mirrors the chevron to the inline end. */
  background-position: right 0.75rem center;
  padding-inline-end: var(--haze-space-8);

  [dir='rtl'] & {
    background-position: left 0.75rem center;
  }

  &:focus {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function ModelPicker({
  value: valueControl,
  onChange,
  options,
  disabled,
  className,
}: ModelPickerProps) {
  const [value, setValue] = useControl(valueControl, '');
  const strings = useStrings('modelPicker');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div x-class={[wrapper, className]}>
      <select x-class={[select]} aria-label={strings.label} value={value} onChange={handleChange} disabled={disabled}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}{opt.contextLength ? ` (${opt.contextLength})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export type { ModelPickerProps, ModelOption };
