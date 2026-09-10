import type { Ref } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type ColorPickerCoreProps = {
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
  className?: string;
  /**
   * Forwarded to the color swatch `<input type='color'>` (not the root
   * div).
   */
  ref?: Ref<HTMLInputElement>;
};

const container = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
  font-family: var(--haze-font-sans);
`;

const previewRow = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
`;

const colorInput = css`
  width: 40px;
  height: 40px;
  border: 2px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: 0;
  cursor: pointer;
  background: none;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: var(--haze-radius-sm);
  }
`;

const textInput = css`
  flex: 1;
  height: 40px;
  padding: 0 var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
  font-family: var(--haze-font-mono);
  outline: none;

  &:focus {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const presetsRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
`;

const presetBtn = css`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--haze-radius-full);
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color var(--haze-duration-fast), transform var(--haze-duration-fast);

  &:hover {
    transform: scale(1.1);
  }
`;

const activePreset = css`
  border-color: var(--haze-color-text);
  box-shadow: 0 0 0 2px var(--haze-color-bg);
`;

export default function ColorPickerCore({
  value,
  onChange,
  presets,
  className,
  ref,
}: ColorPickerCoreProps) {
  const strings = useStrings('colorPicker');
  return (
    <div x-class={[container, className]}>
      <div x-class={[previewRow]}>
        <input
          ref={ref}
          type="color"
          x-class={[colorInput]}
          value={value}
          aria-label={strings.pickColor}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          x-class={[textInput]}
          value={value}
          aria-label={strings.hexColor}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {presets && presets.length > 0 && (
        <div x-class={[presetsRow]}>
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              x-class={[presetBtn, value === color && activePreset]}
              style={{ background: color }}
              aria-label={color}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export type { ColorPickerCoreProps };
