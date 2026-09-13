import type { ReactNode, Ref } from 'react';

import { css } from '@linaria/core';

type ComboboxOptionProps = {
  value: string;
  highlighted?: boolean;
  selected?: boolean;
  /**
   * DOM id of this option — what the combobox input points at via
   * aria-activedescendant while the row holds the keyboard highlight.
   */
  id?: string;
  /**
   * Ref to the row element (React 19 ref-as-prop). Combobox points it
   * at the keyboard-highlighted row to keep it scrolled into view.
   */
  ref?: Ref<HTMLDivElement>;
  /**
   * Size of the whole option set, per aria-setsize. Must count every
   * option, not just the rows a windowed (virtualized) list mounted.
   */
  setSize?: number;
  /** 1-based position of this option in the set, per aria-posinset. */
  posInSet?: number;
  onSelect?: (value: string) => void;
  className?: string;
  children: ReactNode;
};

const option = css`
  display: flex;
  align-items: center;
  padding: var(--haze-space-2) var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  cursor: pointer;
  transition: background var(--haze-duration-fast);

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }
`;

const highlightedStyle = css`
  background: var(--haze-color-bg-subtle);
`;

const selectedStyle = css`
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-primary);
`;

export default function ComboboxOption({
  value,
  highlighted = false,
  selected = false,
  id,
  ref,
  setSize,
  posInSet,
  onSelect,
  className,
  children,
}: ComboboxOptionProps) {
  return (
    <div
      ref={ref}
      role='option'
      id={id}
      // ARIA 1.2 combobox: both the keyboard-highlighted (visual focus)
      // option and the selected value carry aria-selected=true — two
      // distinct concepts sharing the attribute's true state.
      aria-selected={selected || highlighted}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      x-class={[
        option,
        highlighted && highlightedStyle,
        selected && selectedStyle,
        className,
      ]}
      onClick={() => onSelect?.(value)}
    >
      {children}
    </div>
  );
}

export type { ComboboxOptionProps };
