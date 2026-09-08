import type { ReactNode } from 'react';

import { Children, isValidElement } from 'react';

/** One selectable entry extracted from the Select's JSX children. */
export type SelectOptionData = {
  value: string;
  label: ReactNode;
};

/** Props of an <Option> or plain <option> element, as far as option
 * extraction is concerned. */
type OptionLikeProps = {
  value?: string | number | readonly string[];
  children?: ReactNode;
};

/**
 * Flattens the Select's children — <Option> and plain <option> elements
 * are both accepted — into the {value, label} list the multiple-mode
 * listbox renders. Children without a resolvable value are ignored, the
 * same way a native select treats stray non-option nodes.
 */
export function extractSelectOptions(children: ReactNode): SelectOptionData[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionLikeProps>(child)) return [];
    const { value, children: label } = child.props;
    if (value === undefined || Array.isArray(value)) return [];
    return [{ value: String(value), label: label ?? String(value) }];
  });
}
