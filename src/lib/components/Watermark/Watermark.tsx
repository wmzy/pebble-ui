import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { useEffect, useRef, useState } from 'react';
import { css } from '@linaria/core';

export type WatermarkFont = {
  /** Font size in px (canvas metrics, not CSS). */
  size?: number;
  /** Any CSS color; defaults to the theme's `--haze-color-text-muted`. */
  color?: string;
  /** Numeric font weight. */
  weight?: number;
  /** CSS font-family stack; falls back to the page's sans stack. */
  family?: string;
};

type WatermarkProps = {
  /** Watermark text; an array renders stacked lines. */
  content: string | string[];
  /** Typography of the drawn text. */
  font?: WatermarkFont;
  /** Rotation in degrees. */
  rotate?: number;
  /** Space between tiles, in px — one number or `[x, y]`. */
  gap?: number | [number, number];
  /** `[x, y]` offset of the tile grid origin, in px. */
  offset?: [number, number];
  /** Overlay stacking order. */
  zIndex?: number;
  /** Span the whole viewport (fixed) instead of the container. */
  fullscreen?: boolean;
  /** Content to watermark; with children the component becomes its container. */
  children?: ReactNode;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className' | 'content'
>;

type TileOptions = {
  lines: string[];
  font: WatermarkFont;
  rotate: number;
  gapX: number;
  gapY: number;
  /** Mounted element whose computed style provides token fallbacks. */
  probe: HTMLElement | null;
};

/**
 * Draw one rotated-text tile and return it as a data URL for a repeating
 * CSS background. Returns `null` when the canvas 2d context is unavailable
 * (jsdom, very old engines) — the caller then skips the watermark layer.
 */
function renderTile({
  lines,
  font,
  rotate,
  gapX,
  gapY,
  probe,
}: TileOptions): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const size = font.size ?? 14;
  const computed = probe ? getComputedStyle(probe) : null;
  const color =
    font.color ??
    computed?.getPropertyValue('--haze-color-text-muted').trim() ??
    '';
  const family = font.family ?? 'sans-serif';
  ctx.font = `${font.weight ?? 400} ${size}px ${family}`;
  ctx.fillStyle = color || 'rgba(0, 0, 0, 0.15)';

  const lineHeight = size * 1.3;
  const markWidth = Math.max(
    0,
    ...lines.map((line) => ctx.measureText(line).width)
  );
  const markHeight = lines.length * lineHeight;

  const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  canvas.width = Math.ceil((markWidth + gapX) * ratio);
  canvas.height = Math.ceil((markHeight + gapY) * ratio);
  ctx.scale(ratio, ratio);
  ctx.translate((markWidth + gapX) / 2, (markHeight + gapY) / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, (index - (lines.length - 1) / 2) * lineHeight);
  });
  return canvas.toDataURL();
}

const container = css`
  position: relative;
`;

const overlay = css`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-repeat: repeat;
`;

export default function Watermark({
  content,
  font,
  rotate = -22,
  gap = 100,
  offset = [0, 0],
  zIndex = 9,
  fullscreen = false,
  children,
  className,
  style,
  ...rest
}: WatermarkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tile, setTile] = useState<string | null>(null);

  const lines = Array.isArray(content) ? content : [content];
  const gapX = Array.isArray(gap) ? gap[0] : gap;
  const gapY = Array.isArray(gap) ? gap[1] : gap;
  // Keyed deps: inline `content`/`font` literals churn identity per render,
  // but only their values matter for the drawn tile.
  const linesKey = lines.join('\n');
  const fontKey = font
    ? `${font.size ?? ''}/${font.color ?? ''}/${font.weight ?? ''}/${font.family ?? ''}`
    : '';

  useEffect(() => {
    setTile(
      renderTile({
        lines,
        font: font ?? {},
        rotate,
        gapX,
        gapY,
        probe: containerRef.current,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, fontKey, rotate, gapX, gapY]);

  return (
    <div
      ref={containerRef}
      data-slot="watermark"
      x-class={[container, className]}
      style={style}
      {...rest}
    >
      {children}
      {tile && (
        <div
          data-slot="layer"
          aria-hidden="true"
          x-class={[overlay]}
          style={{
            backgroundImage: `url(${tile})`,
            backgroundPosition: `${offset[0]}px ${offset[1]}px`,
            zIndex,
            ...(fullscreen ? { position: 'fixed' } : undefined),
          }}
        />
      )}
    </div>
  );
}

export type { WatermarkProps };
