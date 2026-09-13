import type { ReactNode } from 'react';

import { css } from '@linaria/core';
import { useId } from 'react';

import { dropdownMenuGroupLabel } from './dropdown-menu-item-styles';

type DropdownMenuGroupProps = {
  /** Non-interactive heading naming the group (aria-labelledby). */
  label: ReactNode;
  className?: string;
  /** The group's menu items. */
  children: ReactNode;
};

const group = css`
  display: block;
`;

/**
 * A labeled, non-interactive section of menu items (`role="group"`
 * named by its heading, the ARIA APG menu group shape). The heading is
 * not a menu item: keyboard traversal, typeahead and the roving tab
 * stop skip it entirely.
 */
export default function DropdownMenuGroup({
  label,
  className,
  children,
}: DropdownMenuGroupProps) {
  const labelId = useId();
  return (
    <div data-slot='group' role="group" aria-labelledby={labelId} x-class={[group, className]}>
      <div id={labelId} data-slot='group-label' x-class={dropdownMenuGroupLabel}>
        {label}
      </div>
      {children}
    </div>
  );
}

export type { DropdownMenuGroupProps };
