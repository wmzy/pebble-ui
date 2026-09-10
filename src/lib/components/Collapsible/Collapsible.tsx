import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { createContext, useContext } from 'react';
import { useControl } from 'react-use-control';

import { Presence } from '../../utils/presence';

/**
 * Semantic slot classes (AntD v6 `classNames` shape): keys map to the
 * compound structure, consumer classes appended at the end of each
 * part's class list (able to override component defaults). The record
 * is declared once on the `<Collapsible>` root and reaches every
 * sub-component through context; per-part `className` props stay
 * available for one-off tweaks and still land after the slot class.
 */
type CollapsibleClassNames = {
  /** The wrapper `<div>` `<Collapsible>` renders. */
  root?: string;
  /** The `<CollapsibleTrigger>` `<button>`. */
  trigger?: string;
  /** The `<CollapsibleContent>` outer `<div>` (the animated grid row). */
  content?: string;
};

type CollapsibleContextValue = {
  open: boolean;
  toggle: () => void;
  classNames: CollapsibleClassNames | undefined;
};

const CollapsibleContext = createContext<CollapsibleContextValue | undefined>(undefined);

function useCollapsibleContext() {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) throw new Error('Collapsible sub-components must be used within <Collapsible>');
  return ctx;
}

// Collapsible
type CollapsibleProps = {
  open?: ControlOrValue<boolean>;
  defaultOpen?: boolean;
  /**
   * Semantic slot classes (AntD v6 `classNames` shape): declared once
   * here and distributed to every sub-component via context — see
   * {@link CollapsibleClassNames}. Omitting it changes nothing.
   */
  classNames?: CollapsibleClassNames;
  children: ReactNode;
  className?: string;
};

const base = css`
  font-family: var(--haze-font-sans);
`;

export function Collapsible({
  open: openControl,
  defaultOpen = false,
  classNames,
  children,
  className,
}: CollapsibleProps) {
  const [open, setOpen] = useControl(openControl, defaultOpen);
  const toggle = () => setOpen((v) => !v);

  return (
    <CollapsibleContext.Provider value={{ open, toggle, classNames }}>
      <div x-class={[base, className, classNames?.root]}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

// CollapsibleTrigger
type CollapsibleTriggerProps = {
  children: ReactNode;
  className?: string;
};

const triggerStyle = css`
  cursor: pointer;
  user-select: none;
`;

export function CollapsibleTrigger({ children, className }: CollapsibleTriggerProps) {
  const { toggle, classNames } = useCollapsibleContext();
  return (
    <button type="button" x-class={[triggerStyle, className, classNames?.trigger]} onClick={toggle}>
      {children}
    </button>
  );
}

// CollapsibleContent
type CollapsibleContentProps = {
  children: ReactNode;
  className?: string;
};

/* Height animates on the outer grid: 1fr↔0fr interpolates without knowing
 * the content height. The inner wrapper clips and can shrink below its
 * content (min-height: 0). Presence keeps the subtree mounted (injecting
 * data-state) while the collapse transition runs, then unmounts it. */
const contentOuter = css`
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--haze-duration-normal)
    var(--haze-ease-in-out);

  &[data-state='closed'] {
    grid-template-rows: 0fr;
    visibility: hidden;
    /* visibility flips hidden exactly when the row finishes collapsing
     * (zero duration, normal-length delay), so collapsed content leaves the
     * tab order and accessibility tree through CSS alone. */
    transition:
      grid-template-rows var(--haze-duration-normal) var(--haze-ease-in-out),
      visibility 0s var(--haze-duration-normal);
  }
`;

const contentInner = css`
  overflow: hidden;
  min-height: 0;
`;

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const { open, classNames } = useCollapsibleContext();
  return (
    <Presence present={open}>
      <div x-class={[contentOuter, className, classNames?.content]}>
        <div x-class={contentInner}>{children}</div>
      </div>
    </Presence>
  );
}

export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps, CollapsibleClassNames };
