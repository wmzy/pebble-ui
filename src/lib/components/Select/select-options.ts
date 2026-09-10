import type { ReactElement, ReactNode } from 'react';

import { Children, isValidElement } from 'react';

import OptionGroup from './OptionGroup';

/** One selectable entry extracted from the Select's JSX children. */
export type SelectOptionData = {
  value: string;
  label: ReactNode;
};

/**
 * One rendering slot of the Select's children: a top-level option, or a
 * labelled group of options (from `<OptionGroup>` / plain `<optgroup>`).
 * The flat keyboard-navigation order is the depth-first traversal of
 * this structure, so highlighting runs continuously across groups.
 */
export type SelectEntryData =
  | { kind: 'option'; option: SelectOptionData }
  | { kind: 'group'; label: string; options: SelectOptionData[] };

/** Props of an <Option> or plain <option> element, as far as option
 * extraction is concerned. */
type OptionLikeProps = {
  value?: string | number | readonly string[];
  children?: ReactNode;
};

/** Props of an <OptionGroup> or plain <optgroup> element. */
type GroupLikeProps = {
  label?: string;
  children?: ReactNode;
};

const isGroupElement = (
  child: ReactNode
): child is ReactElement<GroupLikeProps> =>
  isValidElement<GroupLikeProps>(child) &&
  (child.type === OptionGroup || child.type === 'optgroup');

const isOptionElement = (child: ReactNode): child is ReactElement<OptionLikeProps> =>
  isValidElement<OptionLikeProps>(child) &&
  child.type !== OptionGroup &&
  child.type !== 'optgroup';

/**
 * Flattens the Select's children — <Option> and plain <option> elements
 * are both accepted — into the {value, label} list. <OptionGroup> /
 * <optgroup> wrappers contribute their nested options in document
 * order. Children without a resolvable value are ignored, the same way
 * a native select treats stray non-option nodes.
 */
export function extractSelectOptions(children: ReactNode): SelectOptionData[] {
  return Children.toArray(children).flatMap((child) => {
    if (isGroupElement(child)) {
      return extractSelectOptions(child.props.children);
    }
    if (!isOptionElement(child)) return [];
    const { value, children: label } = child.props;
    if (value === undefined || Array.isArray(value)) return [];
    return [{ value: String(value), label: label ?? String(value) }];
  });
}

/**
 * Extracts the Select's children preserving the grouping structure:
 * top-level options stay single entries, <OptionGroup>/<optgroup>
 * wrappers become group entries with their nested options. Group
 * nesting is not recursive — a native <optgroup> cannot contain another
 * group — and groups left without any resolvable option are dropped.
 */
export function extractSelectEntries(children: ReactNode): SelectEntryData[] {
  return Children.toArray(children).flatMap((child): SelectEntryData[] => {
    if (isGroupElement(child)) {
      const options = extractSelectOptions(child.props.children);
      if (options.length === 0) return [];
      return [
        {
          kind: 'group',
          label: typeof child.props.label === 'string' ? child.props.label : '',
          options,
        },
      ];
    }
    if (!isOptionElement(child)) return [];
    const { value, children: label } = child.props;
    if (value === undefined || Array.isArray(value)) return [];
    return [
      { kind: 'option', option: { value: String(value), label: label ?? String(value) } },
    ];
  });
}

/** Depth-first flattening of the entry structure (groups in document
 * order) — the order keyboard navigation walks. */
export function flattenSelectEntries(entries: SelectEntryData[]): SelectOptionData[] {
  return entries.flatMap((entry) =>
    entry.kind === 'group' ? entry.options : [entry.option]
  );
}

/**
 * Textual form of an option's label for string-only contexts: the
 * search filter and the `+N` overflow tooltip. String/number labels
 * pass through; element labels contribute their concatenated text
 * content (nested arrays and elements are walked).
 */
export function selectOptionText(label: ReactNode): string {
  if (typeof label === 'string') return label;
  if (typeof label === 'number' || typeof label === 'boolean') return String(label);
  if (Array.isArray(label)) return label.map(selectOptionText).join('');
  if (isValidElement<{ children?: ReactNode }>(label)) {
    return selectOptionText(label.props.children);
  }
  return '';
}

/**
 * Case-insensitive substring filter over the entry structure. An empty
 * (or whitespace-only) query returns the entries unchanged; groups
 * whose options all miss the query are dropped entirely, keeping the
 * rendered list free of orphaned headers.
 */
export function filterSelectEntries(
  entries: SelectEntryData[],
  query: string
): SelectEntryData[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  return entries.flatMap((entry): SelectEntryData[] => {
    if (entry.kind === 'option') {
      return selectOptionText(entry.option.label).toLowerCase().includes(needle)
        ? [entry]
        : [];
    }
    const options = entry.options.filter((option) =>
      selectOptionText(option.label).toLowerCase().includes(needle)
    );
    return options.length > 0 ? [{ kind: 'group', label: entry.label, options }] : [];
  });
}
