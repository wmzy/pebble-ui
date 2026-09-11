import type { ComponentPropsWithoutRef } from 'react';

import { useEffect, useRef, useState } from 'react';
import { css } from '@linaria/core';

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type CountUpProps = {
  /** Animation target — changes animate from the currently shown value. */
  to: number;
  /** Mount value; the first animation starts here (default 0). */
  from?: number;
  /** Animation length in milliseconds (default 1200). */
  duration?: number;
  /** Fraction digits kept by the default formatter (default 0). */
  decimals?: number;
  /** Value → display string. Default: cached `Intl.NumberFormat` with
   * thousand grouping and `decimals` fraction digits. */
  format?: (value: number) => string;
  /** Animate on mount (default true). `false` renders `from` until the
   * `to` prop changes. */
  autostart?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'span'>, 'children'>;

/* tabular-nums: digits share one advance width so the number does not
 * jitter while counting. Size and color inherit so CountUp slots into
 * Stat-like contexts unchanged. */
const base = css`
  font-variant-numeric: tabular-nums;
  font-family: var(--haze-font-sans);
  font-size: inherit;
  color: inherit;
`;

/* Intl.NumberFormat construction is comparatively expensive; the default
 * formatter caches one instance per decimal count. */
const groupFormatters = new Map<number, Intl.NumberFormat>();

function defaultFormat(value: number, decimals: number): string {
  let formatter = groupFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    groupFormatters.set(decimals, formatter);
  }
  return formatter.format(value);
}

export default function CountUp({
  to,
  from = 0,
  duration = 1200,
  decimals = 0,
  format,
  autostart = true,
  className,
  ...rest
}: CountUpProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [displayed, setDisplayed] = useState(from);
  // Mirror of `displayed` readable inside the animation effect without
  // re-arming it on every frame.
  const shownRef = useRef(from);
  const rafRef = useRef(0);
  const firstRunRef = useRef(true);

  useEffect(() => {
    const isFirst = firstRunRef.current;
    firstRunRef.current = false;

    // autostart=false: mount renders `from` verbatim — the animation
    // only arms once `to` moves.
    if (isFirst && !autostart) return;

    const start = shownRef.current;

    if (reducedMotion || duration <= 0 || start === to) {
      shownRef.current = to;
      setDisplayed(to);
      return;
    }

    const startedAt = performance.now();
    const step = (now: number) => {
      // Clamp on both ends: late frames past the deadline land exactly
      // on `to`, never overshoot.
      const t = Math.min(Math.max((now - startedAt) / duration, 0), 1);
      // ease-out cubic — fast start, gentle landing.
      const eased = 1 - (1 - t) ** 3;
      const value = start + (to - start) * eased;
      shownRef.current = value;
      setDisplayed(value);
      if (t < 1) rafRef.current = window.requestAnimationFrame(step);
    };
    rafRef.current = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(rafRef.current);
  }, [to, from, duration, reducedMotion, autostart]);

  return (
    <span x-class={[base, className]} {...rest}>
      {format ? format(displayed) : defaultFormat(displayed, decimals)}
    </span>
  );
}

export type { CountUpProps };
