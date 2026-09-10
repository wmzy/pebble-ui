import type { ReactElement, ReactNode } from 'react';

import { Children, isValidElement } from 'react';

/**
 * Props of a `<CommandItem>` element as far as built-in filtering is
 * concerned. Structurally typed (not imported from Command.tsx) so the
 * helper stays free of the component-file import cycle.
 */
export type CommandItemLikeProps = {
  value?: string;
  keywords?: readonly string[];
  children?: ReactNode;
};

/**
 * Concatenated text of an item's children — the default filter target
 * when no explicit `value` is given. Strings/numbers/booleans pass
 * through; nested arrays and elements are walked depth-first (the same
 * shape as Select's `selectOptionText`).
 */
export function commandItemText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (Array.isArray(node)) return node.map(commandItemText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return commandItemText(node.props.children);
  }
  return '';
}

/**
 * Case-insensitive substring match of the query against an item's
 * filterable text: the explicit `value` (falling back to the item's
 * concatenated children text) plus every `keywords` entry. An empty
 * query matches everything, preserving the pre-filter behavior of a
 * fresh palette.
 */
export function commandItemMatches(
  props: CommandItemLikeProps,
  query: string
): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  const value = props.value ?? commandItemText(props.children);
  if (value.toLowerCase().includes(needle)) return true;
  return (props.keywords ?? []).some((keyword) =>
    keyword.toLowerCase().includes(needle)
  );
}

/**
 * Collects every `<CommandItem>` element in the subtree at any nesting
 * depth (directly under the list, inside `<CommandGroup>` wrappers, or
 * behind plain layout elements/fragments). The component reference is
 * passed in by the caller — the identity check is what keeps the walk
 * precise without importing the component (import cycle).
 */
export function collectCommandItems(
  children: ReactNode,
  itemComponent: unknown
): ReactElement<CommandItemLikeProps>[] {
  // Children.toArray already flattens nested arrays and drops null/booleans.
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<CommandItemLikeProps>(child)) return [];
    if (child.type === itemComponent) return [child];
    return collectCommandItems(child.props.children, itemComponent);
  });
}
