import type { ComponentPropsWithoutRef, PointerEvent as ReactPointerEvent } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { SignaturePoint } from './signature-points';

import { useCallback, useEffect, useRef, useState } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { useStrings } from '../LocaleProvider';

import {
  getCanvasPoint,
  normalizeStroke,
  pointDistance,
  serializeStrokes,
} from './signature-points';


/**
 * Handwriting signature pad on a `<canvas>`.
 *
 * `value` is the committed signature as a PNG `data:` URL (empty string
 * when the pad is blank) — it is an *output*: committed on every stroke
 * end, `Undo` and `Clear` follow the same path. Painting an initial
 * `data:` URL back onto the canvas is not supported (the canvas is the
 * input device; persist the committed string, e.g. into a form field).
 * `onChange` fires with the new string on every commit.
 *
 * Pointer Events drive the drawing (`setPointerCapture` keeps the
 * stroke alive outside the canvas bounds); the drawing scales for
 * high-DPI screens via `devicePixelRatio`. When the canvas 2d context
 * is unavailable (jsdom, ancient engines) the pad degrades to a notice
 * instead of a broken input — the Watermark precedent.
 *
 * Visible copy is localized through the LocaleProvider packs
 * (`signature` section): `clearLabel`, `undoLabel` and
 * `unsupportedLabel` override the pack per instance.
 */
type SignatureProps = {
  /** Committed signature as a PNG data URL; a Control receives every
   * commit live, a plain string seeds the committed state. */
  value?: ControlOrValue<string>;
  /** Fires with the committed data URL (or `''` when blank) on stroke
   * end, undo and clear. */
  onChange?: (value: string) => void;
  /** Label of the clear button. Default from `signature.clear`. */
  clearLabel?: string;
  /** Label of the undo button. Default from `signature.undo`. */
  undoLabel?: string;
  /** Notice rendered instead of the pad when the canvas 2d context
   * is unavailable. Default from `signature.unsupported`. */
  unsupportedLabel?: string;
  /** Canvas CSS width in px. */
  width?: number;
  /** Canvas CSS height in px. */
  height?: number;
  /** Locks drawing and the toolbar. */
  disabled?: boolean;
  /** Pen stroke color; any CSS color. Defaults to the theme's
   * `--haze-color-text` (resolved from the canvas element at stroke
   * time — a canvas cannot consume `var()` directly). */
  penColor?: string;
  /** Pen stroke width in px. */
  penWidth?: number;
} & Omit<ComponentPropsWithoutRef<'div'>, 'onChange'>;

const DEFAULT_PEN_FALLBACK = '#1f2937';
const MIN_POINT_DISTANCE = 1.5;

const root = css`
  display: inline-flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  font-family: var(--haze-font-sans);
`;

const canvasFrame = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  overflow: hidden;
  transition: border-color var(--haze-duration-fast);

  &:focus-within {
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const canvasClass = css`
  display: block;
  cursor: crosshair;
  touch-action: none;

  &[data-disabled='true'] {
    cursor: not-allowed;
    pointer-events: none;
    opacity: 0.6;
  }
`;

const toolbar = css`
  display: flex;
  gap: var(--haze-space-2);
`;

const toolButton = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text-secondary);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-tight);
  cursor: pointer;
  transition:
    background var(--haze-duration-fast),
    color var(--haze-duration-fast),
    border-color var(--haze-duration-fast);

  &:hover:enabled {
    border-color: var(--haze-color-border-hover);
    color: var(--haze-color-text);
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const unsupportedNotice = css`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

export default function Signature({
  value: valueControl,
  onChange,
  clearLabel,
  undoLabel,
  unsupportedLabel,
  width = 320,
  height = 160,
  disabled = false,
  penColor,
  penWidth = 2,
  className,
  ...rest
}: SignatureProps) {
  const strings = useStrings('signature');
  const resolvedClearLabel = clearLabel ?? strings.clear;
  const resolvedUndoLabel = undoLabel ?? strings.undo;
  const resolvedUnsupportedLabel = unsupportedLabel ?? strings.unsupported;
  const [, setValue] = useControl(valueControl, '');
  const [strokeCount, setStrokeCount] = useState(0);
  // false until the 2d context probe says otherwise — the canvas renders
  // meanwhile (blank), so there is no degraded-message flash pre-effect
  const [unsupported, setUnsupported] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const strokesRef = useRef<SignaturePoint[][]>([]);
  const drawingPointerRef = useRef<number | null>(null);
  const penColorRef = useRef<string>(DEFAULT_PEN_FALLBACK);
  const committedRef = useRef<string>('');

  const resolvePenColor = useCallback((): string => {
    if (penColor) return penColor;
    const canvas = canvasRef.current;
    const token = canvas
      ? getComputedStyle(canvas).getPropertyValue('--haze-color-text').trim()
      : '';
    return token || DEFAULT_PEN_FALLBACK;
  }, [penColor]);

  const drawSegment = useCallback(
    (from: SignaturePoint, to: SignaturePoint) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.strokeStyle = penColorRef.current;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [penWidth]
  );

  const drawDot = useCallback(
    (point: SignaturePoint) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.fillStyle = penColorRef.current;
      ctx.beginPath();
      ctx.arc(point.x, point.y, penWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [penWidth]
  );

  const redraw = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, width, height);
    penColorRef.current = resolvePenColor();
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      drawDot(stroke[0]!);
      for (let i = 1; i < stroke.length; i += 1) {
        drawSegment(stroke[i - 1]!, stroke[i]!);
      }
    }
  }, [width, height, resolvePenColor, drawDot, drawSegment]);

  // Canvas sizing + 2d availability. High-DPI: the backing store scales
  // by devicePixelRatio while the CSS box stays width×height; ctx.scale
  // keeps stroke coordinates in CSS pixels. Re-sizing resets the
  // bitmap, so every size change repaints the strokes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    setUnsupported(!ctx);
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    redraw();
  }, [width, height, redraw]);

  /** Publish the current drawing if it differs from the last commit. */
  const commit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    const serialized = serializeStrokes(strokesRef.current);
    if (serialized === committedRef.current) return;
    committedRef.current = serialized;
    const next = strokesRef.current.length > 0 ? canvas.toDataURL('image/png') : '';
    setValue(next);
    onChange?.(next);
  }, [setValue, onChange]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || !ctxRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (drawingPointerRef.current !== null) return; // one stroke at a time
    drawingPointerRef.current = event.pointerId;
    if (typeof canvas.setPointerCapture === 'function') {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // pointer already released/upstreamed — the stroke still tracks
      }
    }
    penColorRef.current = resolvePenColor();
    const point = getCanvasPoint(
      event.clientX,
      event.clientY,
      canvas.getBoundingClientRect()
    );
    strokesRef.current = [...strokesRef.current, [point]];
    setStrokeCount(strokesRef.current.length);
    drawDot(point);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drawingPointerRef.current !== event.pointerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const strokes = strokesRef.current;
    const stroke = strokes[strokes.length - 1];
    if (!stroke) return;
    const point = getCanvasPoint(
      event.clientX,
      event.clientY,
      canvas.getBoundingClientRect()
    );
    const last = stroke[stroke.length - 1];
    if (!last) return;
    // sub-pixel moves only flood the stroke data — skip before drawing
    if (pointDistance(last, point) < 0.5) return;
    const nextStroke = [...stroke, point];
    strokesRef.current = [...strokes.slice(0, -1), nextStroke];
    drawSegment(last, point);
  };

  const endStroke = () => {
    if (drawingPointerRef.current === null) return;
    drawingPointerRef.current = null;
    const strokes = strokesRef.current;
    const stroke = strokes[strokes.length - 1];
    if (stroke) {
      strokesRef.current = [...strokes.slice(0, -1), normalizeStroke(stroke, MIN_POINT_DISTANCE)];
    }
    commit();
  };

  const handleUndo = () => {
    if (disabled || strokesRef.current.length === 0) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    redraw();
    commit();
  };

  const handleClear = () => {
    if (disabled) return;
    if (strokesRef.current.length === 0) return;
    strokesRef.current = [];
    setStrokeCount(0);
    redraw();
    commit();
  };

  if (unsupported) {
    return (
      <div x-class={[root, className]} {...rest}>
        <div
          x-class={[unsupportedNotice]}
          style={{ width: `${width}px`, height: `${height}px` }}
          role='status'
        >
          {resolvedUnsupportedLabel}
        </div>
      </div>
    );
  }

  return (
    <div x-class={[root, className]} {...rest}>
      <div x-class={[canvasFrame]}>
        <canvas
          ref={canvasRef}
          x-class={[canvasClass]}
          style={{ width: `${width}px`, height: `${height}px` }}
          data-disabled={disabled}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        />
      </div>
      <div x-class={[toolbar]}>
        <button
          type='button'
          x-class={[toolButton]}
          onClick={handleUndo}
          disabled={disabled || strokeCount === 0}
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M9 14 4 9l5-5' />
            <path d='M4 9h10.5a5.5 5.5 0 0 1 0 11H11' />
          </svg>
          {resolvedUndoLabel}
        </button>
        <button
          type='button'
          x-class={[toolButton]}
          onClick={handleClear}
          disabled={disabled || strokeCount === 0}
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M3 6h18' />
            <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' />
            <path d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
          </svg>
          {resolvedClearLabel}
        </button>
      </div>
    </div>
  );
}

export type { SignatureProps };
