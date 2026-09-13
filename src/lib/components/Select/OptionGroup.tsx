import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type OptionGroupProps = {
  /** Group heading. Renders as the native `<optgroup label>` in the
   * single-select path and as a `role="group"` heading in the
   * multiple/searchable listbox path. */
  label: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'optgroup'>, 'label'>;

/**
 * Labels a cluster of options inside a Select. In single mode it is a
 * plain native `<optgroup>`; the multiple/searchable floating listbox
 * extracts the same structure and renders it as `role="group"` with a
 * heading, keyboard navigation running continuously across groups.
 */
export default function OptionGroup({ label, children, ...rest }: OptionGroupProps) {
  return (
    <optgroup label={label} data-slot='group' {...rest}>
      {children}
    </optgroup>
  );
}

export type { OptionGroupProps };
