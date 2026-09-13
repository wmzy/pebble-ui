import type { ComponentPropsWithoutRef } from 'react';

import { useMemo } from 'react';

import { create } from 'qrcode';

import { css } from '@linaria/core';

type QRCodeLevel = 'L' | 'M' | 'Q' | 'H';

type QRCodeProps = {
  /** Text or URL to encode. Must be non-empty. */
  value: string;
  /** Rendered edge length in px. Default 128. */
  size?: number;
  /** QR error correction level. Default 'M'. */
  level?: QRCodeLevel;
  /** Whether to wrap the code in a bordered, padded frame. Default true. */
  bordered?: boolean;
  /**
   * Fill of the dark modules. Any CSS color string — defaults to the text
   * token, so it follows the theme.
   */
  modulesColor?: string;
  /**
   * Fill of the light background. Any CSS color string — defaults to the
   * bg token, so it follows the theme.
   */
  bgColor?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const wrapper = css`
  display: inline-flex;
  font-family: var(--haze-font-sans);
`;

const borderedStyle = css`
  padding: var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
`;

/** One `M{x} {y}h1v1z` subpath per dark module, in the matrix unit square. */
function modulesToPath(modules: { size: number; get(row: number, col: number): number }): string {
  let d = '';
  for (let row = 0; row < modules.size; row += 1) {
    for (let col = 0; col < modules.size; col += 1) {
      if (modules.get(row, col)) d += `M${col} ${row}h1v1z`;
    }
  }
  return d;
}

/**
 * QR code rendered as a single crisp SVG path over the `qrcode`
 * dependency (statically imported, SortableTagGroup-style: the dist
 * contract test pins the reference surface so qrcode only enters this
 * module's import graph). The svg is the semantic image: `role="img"` with
 * the encoded `value` as its accessible name, so screen readers announce
 * what the code contains; the wrapper div receives the native `...rest`
 * (e.g. `aria-hidden` on it silences the whole graphic).
 */
export default function QRCode({
  value,
  size = 128,
  level = 'M',
  bordered = true,
  modulesColor = 'var(--haze-color-text)',
  bgColor = 'var(--haze-color-bg)',
  className,
  ...rest
}: QRCodeProps) {
  const modules = useMemo(
    () => create(value, { errorCorrectionLevel: level }).modules,
    [value, level]
  );
  const path = useMemo(() => modulesToPath(modules), [modules]);

  return (
    <div data-slot="qrcode" x-class={[wrapper, bordered && borderedStyle, className]} {...rest}>
      <svg
        data-slot="img"
        width={size}
        height={size}
        viewBox={`0 0 ${modules.size} ${modules.size}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={value}
      >
        <rect width={modules.size} height={modules.size} fill={bgColor} />
        <path d={path} fill={modulesColor} />
      </svg>
    </div>
  );
}

export type { QRCodeProps, QRCodeLevel };
