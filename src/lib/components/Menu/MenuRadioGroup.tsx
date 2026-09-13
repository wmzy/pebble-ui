import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useId } from 'react';

import { useMenuRadioGroup, MenuRadioGroupProvider } from '../../utils/menuRadio';

import { menuGroupLabel } from './menu-item-styles';

type MenuRadioGroupProps = {
  /** Selected value — controlled control or uncontrolled initial value ('' = none). */
  value?: ControlOrValue<string>;
  /** Fires when the selection changes, whatever drove it (click, Enter, Space). */
  onValueChange?: (value: string) => void;
  /** Optional non-interactive heading naming the radio group (aria-labelledby). */
  label?: ReactNode;
  className?: string;
  /** The group's `MenuRadioItem`s. */
  children: ReactNode;
};

const group = css`
  display: block;
`;

/**
 * State container for a single-select cluster of `MenuRadioItem`s
 * (`role="group"`): owns the selected value through the standard
 * `ControlOrValue` prop and exposes it to the items.
 */
export default function MenuRadioGroup({
  value,
  onValueChange,
  label,
  className,
  children,
}: MenuRadioGroupProps) {
  const state = useMenuRadioGroup(value, onValueChange);
  const labelId = useId();
  return (
    <MenuRadioGroupProvider value={state}>
      <div
        role='group'
        aria-labelledby={label !== undefined ? labelId : undefined}
        x-class={[group, className]}
      >
        {label !== undefined && (
          <div id={labelId} x-class={menuGroupLabel}>
            {label}
          </div>
        )}
        {children}
      </div>
    </MenuRadioGroupProvider>
  );
}

export type { MenuRadioGroupProps };
