import type { ComponentPropsWithRef, ReactNode } from 'react';

import { css } from '@linaria/core';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Semantic slot classes (AntD v6 `classNames` shape) for the toast
 * family. Toasts are usually fired imperatively (`useToast()` /
 * `toast()`), so the record is accepted by `ToastContainer` and flows
 * to every toast it renders; a directly rendered `<Toast>` accepts the
 * same record and reads the item slots. Consumer classes are appended
 * at the end of each part's class list (able to override component
 * defaults).
 */
type ToastClassNames = {
  /**
   * The fixed-position toast stack. Only `ToastContainer` renders this
   * part — a directly rendered `<Toast>` ignores the key.
   */
  viewport?: string;
  /** One toast: the `role="status"`/`"alert"` card. */
  item?: string;
  /** The body wrapper around the toast content. */
  content?: string;
  /** The dismiss × button. */
  close?: string;
};

type ToastProps = {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  onClose: () => void;
  duration: number;
  children: ReactNode;
  /**
   * Semantic slot classes (AntD v6 `classNames` shape) — see
   * {@link ToastClassNames}. Only `item`/`content`/`close` apply to a
   * directly rendered toast; `viewport` is a `ToastContainer` part.
   * Omitting it changes nothing.
   */
  classNames?: ToastClassNames;
} & Omit<ComponentPropsWithRef<'div'>, 'children' | 'onClose'>;

const base = css`
  display: flex;
  align-items: flex-start;
  gap: var(--haze-space-3);
  padding: var(--haze-space-3) var(--haze-space-4);
  border-radius: var(--haze-radius-md);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  box-shadow: var(--haze-shadow-lg);
  pointer-events: auto;

  /* Presence (mounted by ToastContainer) injects data-state on this root:
   * open plays the entrance, closed plays the exit while the toast stays
   * mounted until the animation settles. */
  &[data-state='open'] {
    animation: toastIn var(--haze-duration-normal) var(--haze-ease);
  }

  &[data-state='closed'] {
    animation: toastOut var(--haze-duration-fast) var(--haze-ease);
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes toastOut {
    to {
      opacity: 0;
      transform: translateY(-8px);
    }
  }
`;

const variants = {
  info: css`
    background: var(--haze-color-bg);
    color: var(--haze-color-text);
    border: 1px solid var(--haze-color-border);
  `,
  // Variant text uses the standard text token: the accent tokens
  // (--haze-color-success / --haze-color-warning …) sit under the
  // 4.5:1 threshold on the tinted background (axe color-contrast).
  // The accent stays visible through the border and the subtle
  // background tint — same shape as `info`.
  success: css`
    background: var(--haze-color-success-subtle);
    color: var(--haze-color-text);
    border: 1px solid
      color-mix(in srgb, var(--haze-color-success) 25%, transparent);
  `,
  warning: css`
    background: var(--haze-color-warning-subtle);
    color: var(--haze-color-text);
    border: 1px solid
      color-mix(in srgb, var(--haze-color-warning) 25%, transparent);
  `,
  danger: css`
    background: var(--haze-color-danger-subtle);
    color: var(--haze-color-text);
    border: 1px solid
      color-mix(in srgb, var(--haze-color-danger) 25%, transparent);
  `,
} as const;

/* Live-region semantics per variant (Radix / React-Aria convention):
 * only danger may interrupt the screen reader — role="alert" is
 * implicitly aria-live="assertive". info/success/warning announce
 * politely via role="status" (implicitly aria-live="polite",
 * aria-atomic="true") so they queue behind in-progress speech. Each
 * toast is its own live region; ToastContainer's viewport must not add
 * aria-live/role of its own or the same toast would be announced twice. */
const liveRoles = {
  info: 'status',
  success: 'status',
  warning: 'status',
  danger: 'alert',
} as const;

const contentStyle = css`
  flex: 1;
`;

const closeBtn = css`
  appearance: none;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: var(--haze-text-lg);
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.15s;
  /* WCAG 2.5.8 target size: the × glyph alone is ~18px — box it out to
   * the 24px minimum with the glyph centered. */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;

  &:hover {
    opacity: 1;
  }
`;

export default function Toast({
  variant = 'info',
  onClose,
  duration,
  children,
  classNames,
  className,
  ...rest
}: ToastProps) {
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  // Keep the latest onClose without re-arming the timer when the parent
  // re-renders with a fresh callback identity.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    // Bank the elapsed slice so resuming uses the remaining budget, not the
    // full duration again. Re-entrant: a no-op while already paused.
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startedAtRef.current)
    );
  }, []);

  const resumeTimer = useCallback(() => {
    if (timerRef.current !== null || remainingRef.current <= 0) return;
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onCloseRef.current();
    }, remainingRef.current);
  }, []);

  // WCAG 2.2.1: hover or focus (both bubbling to the toast root) freezes the
  // countdown; leaving/unfocusing resumes it with whatever budget is left.
  const syncPaused = useCallback(() => {
    if (hoveredRef.current || focusedRef.current) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  }, [pauseTimer, resumeTimer]);

  useEffect(() => {
    if (duration <= 0) return;
    remainingRef.current = duration;
    if (!hoveredRef.current && !focusedRef.current) resumeTimer();
    // Cleanup banks elapsed time so the budget stays accurate.
    return pauseTimer;
  }, [duration, resumeTimer, pauseTimer]);

  return (
    <div
      role={liveRoles[variant]}
      x-class={[base, variants[variant], className, classNames?.item]}
      onPointerEnter={() => {
        hoveredRef.current = true;
        syncPaused();
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
        syncPaused();
      }}
      onFocus={() => {
        focusedRef.current = true;
        syncPaused();
      }}
      onBlur={() => {
        focusedRef.current = false;
        syncPaused();
      }}
      {...rest}
    >
      <div x-class={[contentStyle, classNames?.content]}>{children}</div>
      <button
        type='button'
        x-class={[closeBtn, classNames?.close]}
        aria-label='Close'
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}

export type { ToastProps, ToastClassNames };
