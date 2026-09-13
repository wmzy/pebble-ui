import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useCallback, useRef, useState } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { useFloating } from '../../utils/floating';

import { ContextMenuProvider } from './ContextMenuContext';

type ContextMenuProps = {
  open?: ControlOrValue<boolean>;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
};

const wrapper = css`
  position: relative;
  display: inline-block;
`;

export default function ContextMenu({
  open: openControl,
  onOpenChange,
  children,
  className,
}: ContextMenuProps) {
  const [open, setOpen] = useControl(openControl, false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  // Doubles as the floating trigger ref: the wrapper contains both the
  // trigger area and the panel, so outside-close treats clicks on the
  // host as inside.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSetOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value;
      setOpen(next);
      onOpenChange?.(next);
    },
    [open, setOpen, onOpenChange]
  );

  const setPosition = useCallback((px: number, py: number) => {
    setX(px);
    setY(py);
  }, []);

  const floating = useFloating({
    open,
    setOpen: handleSetOpen,
    triggerRef: wrapperRef,
    panelRef: contentRef,
    animated: true,
  });

  return (
    <ContextMenuProvider
      value={{
        open,
        setOpen: handleSetOpen,
        x,
        y,
        setPosition,
        contentRef,
        floating,
      }}
    >
      <div ref={wrapperRef} data-slot='context-menu' x-class={[wrapper, className]}>
        {children}
      </div>
    </ContextMenuProvider>
  );
}

export type { ContextMenuProps };
