import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';

import { SubmenuProvider, useSubmenu } from '../../utils/submenu';

type DropdownMenuSubProps = {
  /** Whether the submenu is open — controlled control or uncontrolled initial value. */
  open?: ControlOrValue<boolean>;
  /** Fires on every open transition, whatever drove it (keyboard, hover, click, light dismiss). */
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** `<DropdownMenuSubTrigger>` followed by `<DropdownMenuSubContent>`. */
  children: ReactNode;
};

// position: relative — the fallback floating tier places the panel
// absolutely against this wrapper; the native tiers anchor to the trigger.
const wrapper = css`
  position: relative;
  display: block;
`;

/**
 * State container for a nested submenu inside a DropdownMenu. Wraps a
 * DropdownMenuSubTrigger + DropdownMenuSubContent pair; the open state is
 * controllable through the standard `ControlOrValue` prop.
 */
export default function DropdownMenuSub({
  open,
  onOpenChange,
  className,
  children,
}: DropdownMenuSubProps) {
  const sub = useSubmenu({ open, onOpenChange });
  return (
    <SubmenuProvider value={sub}>
      <div data-slot='menu-sub' x-class={[wrapper, className]}>{children}</div>
    </SubmenuProvider>
  );
}

export type { DropdownMenuSubProps };
