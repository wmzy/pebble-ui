import type { Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import ColorPickerCore from './ColorPickerCore';

type ColorPickerProps = {
  value?: ControlOrValue<string>;
  presets?: string[];
  onChange?: (color: string) => void;
  className?: string;
  /**
   * Forwarded to the color swatch `<input type='color'>` (not the root
   * div) — the element form bridges and `ref.current.focus()` reach.
   */
  ref?: Ref<HTMLInputElement>;
};

export default function ColorPicker({
  value: valueControl,
  presets,
  onChange,
  className,
  ref,
}: ColorPickerProps) {
  const [value, setValue] = useControl(
    valueControl,
    '#000000'
  );

  return (
    <ColorPickerCore
      ref={ref}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      presets={presets}
      className={className}
    />
  );
}

export type { ColorPickerProps };
