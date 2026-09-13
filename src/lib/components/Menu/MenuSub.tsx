import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';

import { SubmenuProvider, useSubmenu } from '../../utils/submenu';

type MenuSubProps = {
  /** Whether the submenu is open — controlled control or uncontrolled initial value. */
  open?: ControlOrValue<boolean>;
  /** Fires on every open transition, whatever drove it (keyboard, hover, click, light dismiss). */
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** `<MenuSubTrigger>` followed by `<MenuSubContent>`. */
  children: ReactNode;
};

// position: relative — the fallback floating tier places the panel
// absolutely against this wrapper; the native tiers anchor to the trigger.
const wrapper = css`
  position: relative;
  display: block;
`;

/**
 * State container for a nested submenu inside a Menu. Wraps a
 * MenuSubTrigger + MenuSubContent pair; the open state is controllable
 * through the standard `ControlOrValue` prop.
 */
export default function MenuSub({
  open,
  onOpenChange,
  className,
  children,
}: MenuSubProps) {
  const sub = useSubmenu({ open, onOpenChange });
  return (
    <SubmenuProvider value={sub}>
      <div data-slot='menu-sub' x-class={[wrapper, className]}>{children}</div>
    </SubmenuProvider>
  );
}

export type { MenuSubProps };
