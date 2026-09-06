import type { ReactNode } from 'react';

import type { ToastItem } from './ToastContext';

import {css} from '@linaria/core';
import {useState, useCallback, useRef, useEffect} from 'react';

import {Presence} from '../../utils/presence';

import Toast from './Toast';
import {ToastProvider} from './ToastContext';
import {nextToastId, subscribeToastChannel} from './toast';

type ToastPlacement =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/* eslint-disable react-refresh/only-export-components --
   toastPlacements is colocated with the component that renders it; this
   file is not a fast-refresh boundary for consumers. */

type ToastContainerProps = {
  children: ReactNode;
  /** Max simultaneous toasts; the oldest one is dropped on overflow. */
  maxCount?: number;
  /** Viewport edge the stack is pinned to. */
  placement?: ToastPlacement;
};

const containerBase = css`
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  pointer-events: none;
`;

/* physical: the placement keys name physical viewport corners (a public
   API contract, e.g. 'bottom-right'), and each edge pairs with its
   physical safe-area env, which has no logical counterpart. */
export const toastPlacements = {
  'top-left': css`
    top: calc(var(--haze-space-4) + env(safe-area-inset-top));
    left: calc(var(--haze-space-4) + env(safe-area-inset-left));
  `,
  'top-right': css`
    top: calc(var(--haze-space-4) + env(safe-area-inset-top));
    right: calc(var(--haze-space-4) + env(safe-area-inset-right));
  `,
  'bottom-left': css`
    bottom: calc(var(--haze-space-4) + env(safe-area-inset-bottom));
    left: calc(var(--haze-space-4) + env(safe-area-inset-left));
  `,
  'bottom-right': css`
    bottom: calc(var(--haze-space-4) + env(safe-area-inset-bottom));
    right: calc(var(--haze-space-4) + env(safe-area-inset-right));
  `,
} as const;

export default function ToastContainer({
  children,
  maxCount,
  placement = 'bottom-right',
}: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Ids whose exit animation is in flight; the toast stays in `toasts`
  // (and mounted under Presence) until the exit settles.
  const [exitingIds, setExitingIds] = useState<number[]>([]);
  // Mirror of `toasts` for the imperative dismiss-all, which needs the
  // live list inside a subscription callback without re-subscribing on
  // every toast change.
  const toastsRef = useRef<ToastItem[]>([]);
  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  // Shared append for both entry points: the context API (useToast) and
  // the imperative module channel (toast()).
  const appendToast = useCallback(
    (item: ToastItem) => {
      setToasts((prev) => {
        const next = [...prev, item];
        if (maxCount === undefined || next.length <= maxCount) return next;
        return next.slice(next.length - maxCount);
      });
    },
    [maxCount]
  );

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      // Ids come from the module-level sequence so imperative and context
      // toasts can never collide.
      appendToast({...toast, id: nextToastId()});
    },
    [appendToast]
  );

  // Phase 1 of removal: flip the item's Presence to data-state="closed" so
  // the exit animation plays. The list still holds the toast until phase 2.
  const removeToast = useCallback((id: number) => {
    setExitingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  // Phase 2: Presence fires onExited once the exit settles — now the toast
  // is really dropped from the list and unmounted.
  const unmountToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setExitingIds((prev) => prev.filter((exitingId) => exitingId !== id));
  }, []);

  const dismissFromChannel = useCallback(
    (id?: number) => {
      if (id === undefined) {
        toastsRef.current.forEach((item) => removeToast(item.id));
        return;
      }
      removeToast(id);
    },
    [removeToast]
  );

  // Imperative API hookup: on mount this container subscribes as a
  // consumer of `toast()` calls — the first subscriber also replays toasts
  // queued before any container existed; on unmount it unsubscribes (the
  // next mounted container, if any, takes over).
  useEffect(
    () =>
      subscribeToastChannel({
        onToast: appendToast,
        onDismiss: dismissFromChannel,
      }),
    [appendToast, dismissFromChannel]
  );

  return (
    <ToastProvider value={{ toasts, addToast, removeToast }}>
      {children}
      <div x-class={[containerBase, toastPlacements[placement]]}>
        {toasts.map((t) => (
          <Presence
            key={t.id}
            present={!exitingIds.includes(t.id)}
            onExited={() => unmountToast(t.id)}
          >
            <Toast
              variant={t.variant}
              duration={t.duration}
              onClose={() => removeToast(t.id)}
            >
              {t.content}
            </Toast>
          </Presence>
        ))}
      </div>
    </ToastProvider>
  );
}

export type { ToastContainerProps, ToastPlacement };
