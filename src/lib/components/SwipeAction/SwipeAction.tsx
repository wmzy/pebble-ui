import type { ReactNode } from 'react';

import { useState, useRef, useCallback } from 'react';
import { css } from '@linaria/core';

type SwipeActionProps = {
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
};

const wrapper = css`
  position: relative;
  overflow: hidden;
  font-family: var(--haze-font-sans);
`;

/* physical: the action panes pair with the physical swipe API
   (left/right props, onSwipeLeft/onSwipeRight, translateX drag) —
   gesture coordinates are physical, so the panes stay physical. */
const actionsLeft = css`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  display: flex;
  align-items: center;
`;

const actionsRight = css`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
`;

const content = css`
  position: relative;
  background: var(--haze-color-bg);
  transition: transform var(--haze-duration-normal) ease;
  touch-action: pan-y;
  user-select: none;
`;

export default function SwipeAction({
  left,
  right,
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  className,
}: SwipeActionProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const dragging = useRef(false);

  const handleStart = useCallback((clientX: number) => {
    startX.current = clientX;
    dragging.current = true;
  }, []);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!dragging.current) return;
      const dx = clientX - startX.current;
      const maxOffset = 120;
      const clamped = Math.max(-maxOffset, Math.min(maxOffset, dx));
      setOffset(clamped);
      currentX.current = clamped;
    },
    [],
  );

  const handleEnd = useCallback(() => {
    dragging.current = false;
    if (currentX.current > threshold) {
      onSwipeRight?.();
    } else if (currentX.current < -threshold) {
      onSwipeLeft?.();
    }
    setOffset(0);
    currentX.current = 0;
  }, [threshold, onSwipeLeft, onSwipeRight]);

  return (
    <div x-class={[wrapper, className]}>
      {left && <div x-class={[actionsLeft]}>{left}</div>}
      {right && <div x-class={[actionsRight]}>{right}</div>}
      <div
        x-class={[content]}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={(e) => handleStart(e.clientX)}
        onPointerMove={(e) => handleMove(e.clientX)}
        onPointerUp={handleEnd}
        onPointerLeave={handleEnd}
      >
        {children}
      </div>
    </div>
  );
}

export type { SwipeActionProps };
