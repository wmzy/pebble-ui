import { createContext, useContext } from 'react';

/**
 * Provided by `FloatButtonGroup`. A `FloatButton` inside a group drops
 * its own fixed anchor (the group owns the anchor) and closes the menu
 * after its action runs (AntD behavior).
 */
export type FloatButtonGroupContextValue = {
  /** Request the group menu to close. */
  closeMenu: () => void;
};

export const FloatButtonGroupContext = createContext<
  FloatButtonGroupContextValue | undefined
>(undefined);

export function useFloatButtonGroup(): FloatButtonGroupContextValue | undefined {
  return useContext(FloatButtonGroupContext);
}
