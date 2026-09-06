import type {ReactNode} from 'react';

import type {ToastItem} from './ToastContext';

type ToastVariant = ToastItem['variant'];

/** Options accepted by `toast()` — the same call shape `useToast()` takes. */
type ToastOptions = {
  variant?: ToastVariant;
  duration?: number;
};

/** Options accepted by the variant sugar methods (`toast.success()` …). */
type ToastVariantOptions = Omit<ToastOptions, 'variant'>;

/** Sink a mounted `ToastContainer` registers to receive imperative calls. */
type ToastChannel = {
  onToast: (item: ToastItem) => void;
  onDismiss: (id?: number) => void;
};

/** Leak guard: toasts fired while no container is mounted are queued and
 * replayed once one mounts; past this cap the oldest queued toast drops. */
const MAX_PENDING_TOASTS = 100;

/** Toasts fired before any container subscribed, in call order. */
const pendingToasts: ToastItem[] = [];

/**
 * Registered containers. Semantics: only the FIRST subscriber consumes
 * imperative calls (a Set iterates in insertion order), so two containers
 * mounted at the same time never display the same toast twice; when the
 * first unmounts, the next one in line takes over.
 */
const channels = new Set<ToastChannel>();

let idCounter = 0;

/**
 * The single id sequence, shared by this module and the container's
 * context path (`useToast`), so ids never collide across the two origins.
 */
export function nextToastId() {
  idCounter += 1;
  return idCounter;
}

/**
 * Fires a toast without `useToast` — module-level, callable from anywhere
 * (outside React, in event callbacks, before a container has mounted).
 * Returns the toast id, usable with `toast.dismiss(id)`.
 *
 * Mirrors the `useToast()` call shape (content + `{variant, duration}`,
 * defaulting to `info` / 3000ms). With no container mounted the toast is
 * silently queued (never throws) and replayed when a `ToastContainer`
 * mounts.
 */
function toast(content: ReactNode, options?: ToastOptions) {
  const item: ToastItem = {
    id: nextToastId(),
    content,
    variant: options?.variant ?? 'info',
    duration: options?.duration ?? 3000,
  };
  const [channel] = channels;
  if (channel) {
    channel.onToast(item);
  } else {
    if (pendingToasts.length >= MAX_PENDING_TOASTS) pendingToasts.shift();
    pendingToasts.push(item);
  }
  return item.id;
}

/**
 * Dismisses a toast by id (the value `toast()` returned), or every
 * displayed and queued toast when called without an id. Dismissing an id
 * that is still queued cancels it before it is ever shown.
 */
function dismiss(id?: number) {
  if (id === undefined) {
    pendingToasts.length = 0;
    const [channel] = channels;
    channel?.onDismiss(undefined);
    return;
  }
  const index = pendingToasts.findIndex((pending) => pending.id === id);
  if (index !== -1) {
    // Still queued (no container yet): cancelled before it is shown.
    pendingToasts.splice(index, 1);
    return;
  }
  const [channel] = channels;
  channel?.onDismiss(id);
}

function withVariant(variant: ToastVariant) {
  return (content: ReactNode, options?: ToastVariantOptions) =>
    toast(content, {...options, variant});
}

toast.info = withVariant('info');
toast.success = withVariant('success');
toast.warning = withVariant('warning');
toast.danger = withVariant('danger');
toast.dismiss = dismiss;

/**
 * Called from `ToastContainer`'s mount effect. The first subscriber also
 * replays everything queued before any container existed, in call order;
 * the returned function unsubscribes on unmount.
 */
export function subscribeToastChannel(channel: ToastChannel) {
  channels.add(channel);
  if (channels.size === 1 && pendingToasts.length > 0) {
    for (const item of pendingToasts.splice(0)) channel.onToast(item);
  }
  return () => {
    channels.delete(channel);
  };
}

export {toast};
export type {ToastOptions, ToastVariant, ToastVariantOptions};
