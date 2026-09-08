import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider/useStrings';
import { useFocusScope } from '../../utils/focus-scope';
import { whenExitSettles } from '../../utils/presence';

/**
 * Fullscreen preview overlay for Image (`preview` prop). Internal part —
 * not exported from the directory barrel: it has no standalone use, every
 * knob rides on Image's `preview` config.
 *
 * Rendered as a native `<dialog>` driven by `showModal()`: top layer for
 * free, implicit `role="dialog"` + modal semantics, native Esc handling
 * (intercepted via `cancel` so every exit runs through the same animated
 * path as Dialog.tsx). The shared `open` control comes from Image so the
 * thumbnail's click can drive it.
 */

const SCALE_MIN = 0.25;
const SCALE_MAX = 4;
const SCALE_STEP = 0.25;
const ROTATE_STEP = 90;

/** Keeps zoom inside the 25%–400% window (binary-exact at 0.25 steps). */
const clampScale = (value: number): number =>
  Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));

type ImagePreviewProps = {
  src: string;
  alt: string;
  /** Shared open state — Image passes its control so both ends drive it. */
  open?: ControlOrValue<boolean>;
  /** Zoom buttons, wheel zoom and drag pan are available (default true). */
  zoom?: boolean;
  /** The rotate control is available (default true). */
  rotate?: boolean;
};

const overlay = css`
  border: none;
  border-radius: var(--haze-radius-none);
  padding: 0;
  background: transparent;
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  margin: 0;
  overflow: hidden;

  /* Layout lives on the open state only: an author-level display
     declaration would beat the UA sheet's
     dialog:not([open]) { display: none } and paint the closed overlay
     in flow, shoving following content a viewport down. */
  &[open] {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.72);
  }

  &[open][data-state='open'] {
    animation: haze-image-preview-in var(--haze-duration-normal)
      var(--haze-ease);
  }

  &[open][data-state='closed'] {
    animation: haze-image-preview-out var(--haze-duration-fast)
      var(--haze-ease);
  }

  &[open][data-state='open']::backdrop {
    animation: haze-image-backdrop-in var(--haze-duration-normal)
      var(--haze-ease);
  }

  &[open][data-state='closed']::backdrop {
    animation: haze-image-backdrop-out var(--haze-duration-fast)
      var(--haze-ease);
  }

  @keyframes haze-image-preview-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-image-preview-out {
    to {
      opacity: 0;
    }
  }

  @keyframes haze-image-backdrop-in {
    from {
      opacity: 0;
    }
  }

  @keyframes haze-image-backdrop-out {
    to {
      opacity: 0;
    }
  }
`;

const previewImg = css`
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  transform-origin: center;
  user-select: none;
  touch-action: none;
`;

const imgPannable = css`
  cursor: grab;
`;

const imgPanning = css`
  cursor: grabbing;
`;

/* Transform transitions animate toolbar/wheel zoom and rotation. Skipped
   while dragging (each pan frame would fight the 200ms transition) and
   automatically collapsed to 0ms under prefers-reduced-motion — the
   motion tokens redefine every --haze-duration-* inside that media query. */
const imgAnimated = css`
  transition: transform var(--haze-duration-normal) var(--haze-ease);
`;

const toolbar = css`
  position: absolute;
  top: var(--haze-space-4);
  left: 0;
  right: 0;
  margin-inline: auto;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);
`;

const toolButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--haze-space-8);
  height: var(--haze-space-8);
  padding: 0;
  border: none;
  border-radius: var(--haze-radius-md);
  background: transparent;
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  line-height: 1;
  cursor: pointer;

  & svg {
    width: var(--haze-space-5);
    height: var(--haze-space-5);
  }

  &:hover:not(:disabled) {
    background: var(--haze-color-bg-muted);
  }

  &:disabled {
    color: var(--haze-color-text-muted);
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const ZoomInIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <line x1="11" y1="8" x2="11" y2="14" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const RotateIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
    <polyline points="21 3 21 9 15 9" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export default function ImagePreview({
  src,
  alt,
  open: openControl,
  zoom = true,
  rotate = true,
}: ImagePreviewProps) {
  const [open, setOpen] = useControl(openControl, false);
  const strings = useStrings('image');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const internalRef = useRef<HTMLDialogElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // Declared before the showModal effect on purpose (same ordering note as
  // Dialog.tsx): the scope captures the opener — the thumbnail image Image
  // focused before flipping open — while activeElement still points at it.
  // Native modal dialog semantics already contain Tab, so trapped: false.
  const setScope = useFocusScope({ enabled: open, trapped: false });

  const setDialogRef = useCallback(
    (node: HTMLDialogElement | null) => {
      internalRef.current = node;
      setScope(node);
    },
    [setScope]
  );

  useEffect(() => {
    const el = internalRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      // Initial-focus contract: the toolbar's close button, not the first
      // tabbable (native modal focus steps would land on zoom-in). Focus
      // runs after showModal so it lands inside the now-revealed dialog.
      closeRef.current?.focus();
    } else if (!open && el.open) {
      // Mirror Dialog.tsx: let the closing animation finish, then close
      // for real. jsdom reports no CSS durations, so the settle completes
      // across the double rAF of whenExitSettles.
      const settle = whenExitSettles(el);
      const finish = () => {
        if (el.getAttribute('data-state') === 'closed') el.close();
      };
      if (settle) void settle.then(finish);
      else finish();
    }
  }, [open]);

  // Wheel zoom as a native non-passive listener: React's onWheel is
  // passive at the root, so preventDefault (stop the page behind the
  // dialog from scrolling) needs addEventListener with passive: false.
  useEffect(() => {
    if (!open || !zoom) return;
    const el = internalRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setScale((prev) => clampScale(prev - Math.sign(event.deltaY) * SCALE_STEP));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open, zoom]);

  const handleDialogClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
    // Only clicks that land on the dialog itself (the letterbox around
    // the image) close — backdrop-click parity with antd's mask.
    if (event.target === internalRef.current) setOpen(false);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (!zoom || event.button !== 0) return;
    // jsdom has no pointer capture API — guard it so drag tests run there.
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    setOffset({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <dialog
      ref={setDialogRef}
      aria-label={alt}
      data-state={open ? 'open' : 'closed'}
      className={overlay}
      onCancel={(event) => {
        // Esc would otherwise bypass the exit animation — route it through
        // the same state flip as every other close path.
        event.preventDefault();
        setOpen(false);
      }}
      onClose={() => {
        // Native close reached: sync React state back to fact (idempotent
        // for the paths that already drove it), and start the next
        // viewing from the untouched image — the close event is the
        // single funnel every exit path runs through.
        setOpen(false);
        setScale(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
      }}
      onClick={handleDialogClick}
    >
      <img
        x-class={[
          previewImg,
          zoom && (dragging ? imgPanning : imgPannable),
          !dragging && imgAnimated,
        ]}
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div className={toolbar}>
        {zoom && (
          <>
            <button
              type="button"
              className={toolButton}
              aria-label={strings.zoomIn}
              disabled={scale >= SCALE_MAX}
              onClick={() => setScale(clampScale(scale + SCALE_STEP))}
            >
              <ZoomInIcon />
            </button>
            <button
              type="button"
              className={toolButton}
              aria-label={strings.zoomOut}
              disabled={scale <= SCALE_MIN}
              onClick={() => setScale(clampScale(scale - SCALE_STEP))}
            >
              <ZoomOutIcon />
            </button>
            <button
              type="button"
              className={toolButton}
              aria-label={strings.reset}
              onClick={resetTransform}
            >
              1:1
            </button>
          </>
        )}
        {rotate && (
          <button
            type="button"
            className={toolButton}
            aria-label={strings.rotate}
            onClick={() => setRotation((prev) => (prev + ROTATE_STEP) % 360)}
          >
            <RotateIcon />
          </button>
        )}
        <button
          ref={closeRef}
          type="button"
          className={toolButton}
          aria-label={strings.close}
          onClick={() => setOpen(false)}
        >
          <CloseIcon />
        </button>
      </div>
    </dialog>
  );
}

export type { ImagePreviewProps };
