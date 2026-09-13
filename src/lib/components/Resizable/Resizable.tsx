import type { ReactNode } from 'react';

import { css } from '@linaria/core';
import { createContext, useContext, useState } from 'react';

type ResizableContextValue = {
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  setSizes: (sizes: number[]) => void;
  dragging: number | null;
  setDragging: (index: number | null) => void;
};

const ResizableContext = createContext<ResizableContextValue | undefined>(undefined);

function useResizableContext() {
  const ctx = useContext(ResizableContext);
  if (!ctx) throw new Error('Resizable sub-components must be used within <ResizableGroup>');
  return ctx;
}

// ResizableGroup
type ResizableGroupProps = {
  direction?: 'horizontal' | 'vertical';
  children: ReactNode;
  className?: string;
};

const groupBase = css`
  display: flex;
  overflow: hidden;
`;

const groupHorizontal = css`
  flex-direction: row;
  height: 100%;
`;

const groupVertical = css`
  flex-direction: column;
  width: 100%;
`;

export function ResizableGroup({
  direction = 'horizontal',
  children,
  className,
}: ResizableGroupProps) {
  const [sizes, setSizes] = useState<number[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);

  return (
    <ResizableContext.Provider value={{ direction, sizes, setSizes, dragging, setDragging }}>
      <div
        data-slot="resizable-group"
        x-class={[groupBase, direction === 'horizontal' ? groupHorizontal : groupVertical, className]}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  );
}

// ResizablePanel
type ResizablePanelProps = {
  defaultSize?: number;
  children: ReactNode;
  className?: string;
};

const panelStyle = css`
  overflow: auto;
  min-width: 0;
  min-height: 0;
`;

export function ResizablePanel({
  defaultSize = 50,
  children,
  className,
}: ResizablePanelProps) {
  const { direction } = useResizableContext();
  const style = direction === 'horizontal'
    ? { flex: `0 0 ${defaultSize}%` }
    : { flex: `0 0 ${defaultSize}%` };

  return (
    <div data-slot="resizable-panel" x-class={[panelStyle, className]} style={style}>
      {children}
    </div>
  );
}

// ResizableHandle
type ResizableHandleProps = {
  className?: string;
};

const handleBase = css`
  flex: 0 0 auto;
  background: var(--haze-color-border);
  transition: background var(--haze-duration-fast);
  cursor: col-resize;

  &:hover {
    background: var(--haze-color-primary);
  }
`;

const handleHorizontal = css`
  width: 4px;
  height: 100%;
  cursor: col-resize;
`;

const handleVertical = css`
  height: 4px;
  width: 100%;
  cursor: row-resize;
`;

export function ResizableHandle({ className }: ResizableHandleProps) {
  const { direction } = useResizableContext();

  return (
    <div
      data-slot="resizable-handle"
      role="separator"
      aria-orientation={direction}
      x-class={[
        handleBase,
        direction === 'horizontal' ? handleHorizontal : handleVertical,
        className,
      ]}
    />
  );
}

export type { ResizableGroupProps, ResizablePanelProps, ResizableHandleProps };
