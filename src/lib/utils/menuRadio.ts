import type { ControlOrValue } from 'react-use-control';

import { createContext, useContext, useMemo } from 'react';
import { useControl } from 'react-use-control';

/**
 * Radio-group state shared by the Menu and DropdownMenu families
 * (the same seam as utils/submenu): the group owns the single selected
 * value through `useControl`, the items read it and request changes.
 */
type MenuRadioGroupState = {
  /** Currently selected value ('' = nothing selected). */
  value: string;
  /** Selects `next`; a no-op (no event) when already selected. */
  select: (next: string) => void;
};

const MenuRadioGroupContext = createContext<MenuRadioGroupState | undefined>(
  undefined
);

export const MenuRadioGroupProvider = MenuRadioGroupContext.Provider;

/** Group-side state: controllable `value` + change notification. */
export function useMenuRadioGroup(
  value: ControlOrValue<string> | undefined,
  onValueChange?: (value: string) => void
): MenuRadioGroupState {
  const [current, setCurrent] = useControl(value, '');
  return useMemo(
    () => ({
      value: current,
      select: (next: string) => {
        if (next === current) return;
        setCurrent(next);
        onValueChange?.(next);
      },
    }),
    [current, setCurrent, onValueChange]
  );
}

/** Item-side state: whether this item is the selected one, plus select. */
export function useMenuRadioItem(itemValue: string): {
  checked: boolean;
  select: () => void;
} {
  const ctx = useContext(MenuRadioGroupContext);
  if (!ctx) {
    throw new Error(
      'MenuRadioItem / DropdownMenuRadioItem must be used within a radio group'
    );
  }
  return { checked: ctx.value === itemValue, select: () => ctx.select(itemValue) };
}
