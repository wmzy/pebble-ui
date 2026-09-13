import type {ReactNode} from 'react';

import type {
  ToastAction,
  ToastDeferredCopyKey,
  ToastItem,
  ToastUpdateOptions,
  ToastVariant,
} from './ToastContext';

import {applyToastPatch, deferredToastCopy} from './ToastContext';

/** Options accepted by `toast()` — the same call shape `useToast()` takes. */
type ToastOptions = {
  variant?: ToastVariant;
  duration?: number;
  /** Action button rendered right of the content (left of the dismiss ×);
   * `close` defaults to `true` — the toast dismisses after `onClick`. */
  action?: ToastAction;
  /** Bold first line rendered above the content. */
  title?: ReactNode;
};

/** Options accepted by the variant sugar methods (`toast.success()` …). */
type ToastVariantOptions = Omit<ToastOptions, 'variant'>;

/** Copy for one `toast.promise` phase: a literal, or derived from the
 * settled value / rejection when the promise settles. */
type ToastPhaseContent<T> = ReactNode | ((data: T) => ReactNode);

/** Options accepted by `toast.promise(promise, options)`. */
type ToastPromiseOptions<T> = {
  /** Copy shown while the promise is pending. Defaults to the locale
   * pack's `toast.loading`. The loading toast never auto-dismisses. */
  loading?: ReactNode;
  /** Copy shown once the promise resolves; a function receives the
   * resolved value. Defaults to the locale pack's `toast.success`. */
  success?: ToastPhaseContent<T>;
  /** Copy shown once the promise rejects; a function receives the
   * rejection value. Defaults to the locale pack's `toast.error`. */
  error?: ToastPhaseContent<unknown>;
  /** Auto-dismiss delay in ms applied once the promise settles — the
   * loading toast stays until then. Defaults to 3000. */
  duration?: number;
};

/** Sink a mounted `ToastContainer` registers to receive imperative calls. */
type ToastChannel = {
  onToast: (item: ToastItem) => void;
  onDismiss: (id?: number) => void;
  onUpdate: (id: number, patch: ToastUpdateOptions) => void;
};

/** Leak guard: toasts fired while no container is mounted are queued and
 * replayed once one mounts; past this cap the oldest queued toast drops. */
const MAX_PENDING_TOASTS = 100;

/** Toasts fired before any container subscribed, in call order. */
const pendingToasts: ToastItem[] = [];

/**
 * Registered containers. Semantics: only the FIRST subscriber consumes
 * imperative calls; later subscribers stay silent until the first one
 * unmounts (last-mounted-wins would double-render every toast).
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
 * Returns the toast id, usable with `toast.dismiss(id)` and
 * `toast.update(id, patch)`.
 *
 * Mirrors the `useToast()` call shape (content + `{variant, duration,
 * action, title}`, defaulting to `info` / 3000ms). With no container
 * mounted the toast is silently queued (never throws) and replayed when
 * a `ToastContainer` mounts.
 */
function toast(content: ReactNode, options?: ToastOptions) {
  const item: ToastItem = {
    id: nextToastId(),
    content,
    variant: options?.variant ?? 'info',
    duration: options?.duration ?? 3000,
    ...(options?.action !== undefined && {action: options.action}),
    ...(options?.title !== undefined && {title: options.title}),
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

/**
 * Patches a toast in place — same id, same React key, no exit→enter
 * replay — whether it is currently displayed or still queued for the
 * first container. Only fields present in the patch change: an untouched
 * `duration` leaves the running countdown alone, a new one re-arms it
 * from the full budget. Updating an unknown or already-dismissed id is a
 * no-op; a dismissed toast never comes back.
 */
function update(id: number, patch: ToastUpdateOptions) {
  const queuedIndex = pendingToasts.findIndex((pending) => pending.id === id);
  if (queuedIndex !== -1) {
    pendingToasts[queuedIndex] = applyToastPatch(
      pendingToasts[queuedIndex]!,
      patch
    );
    return;
  }
  const [channel] = channels;
  channel?.onUpdate(id, patch);
}

function withVariant(variant: ToastVariant) {
  return (content: ReactNode, options?: ToastVariantOptions) =>
    toast(content, {...options, variant});
}

/**
 * Fires a loading toast: spinner icon, and `duration` defaults to 0 —
 * persistent until `toast.update`/`toast.dismiss` or a manual close,
 * because an in-flight operation has no meaningful auto-dismiss budget.
 * An explicit `duration` overrides the persistence like anywhere else.
 */
function loading(content: ReactNode, options?: ToastVariantOptions) {
  return toast(content, {
    ...options,
    variant: 'loading',
    duration: options?.duration ?? 0,
  });
}

/** Resolves one phase's copy: a function is applied to the settle value,
 * a literal is used verbatim, an omitted field defers to the locale pack. */
function resolvePhaseContent<T>(
  content: ToastPhaseContent<T> | undefined,
  data: T,
  fallback: ToastDeferredCopyKey
): ReactNode {
  if (content === undefined) return deferredToastCopy(fallback);
  return typeof content === 'function' ? content(data) : content;
}

/**
 * Shared engine behind `toast.promise` and `useToast().promise`: fires
 * the loading toast through `showLoading` (spinner icon, persistent —
 * duration 0), then patches it in place when the promise settles, so the
 * toast never remounts and its animations never replay. Returns the
 * original promise untouched: rejections keep propagating to the
 * caller's `await`/`catch`, and a loading toast dismissed before
 * settling is simply not found by the update — it never resurrects.
 */
export function driveToastPromise<T>(
  showLoading: (content: ReactNode) => number,
  updateById: (id: number, patch: ToastUpdateOptions) => void,
  promise: Promise<T>,
  options?: ToastPromiseOptions<T>
): Promise<T> {
  const id = showLoading(options?.loading ?? deferredToastCopy('loading'));
  const settledDuration = options?.duration ?? 3000;
  promise.then(
    (data) => {
      updateById(id, {
        content: resolvePhaseContent(options?.success, data, 'success'),
        variant: 'success',
        duration: settledDuration,
      });
    },
    (error: unknown) => {
      updateById(id, {
        content: resolvePhaseContent(options?.error, error, 'error'),
        variant: 'danger',
        duration: settledDuration,
      });
    }
  );
  return promise;
}

/**
 * Fires a persistent loading toast, then patches it in place to the
 * success (or danger + error) copy when `promise` settles. Returns the
 * original promise as-is, so `await toast.promise(…)` resolves with the
 * value and rejections still reach the caller's `catch`.
 */
function promise<T>(
  p: Promise<T>,
  options?: ToastPromiseOptions<T>
): Promise<T> {
  return driveToastPromise(loading, update, p, options);
}

toast.info = withVariant('info');
toast.success = withVariant('success');
toast.warning = withVariant('warning');
toast.danger = withVariant('danger');
toast.loading = loading;
toast.dismiss = dismiss;
toast.update = update;
toast.promise = promise;

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
export type {
  ToastAction,
  ToastDeferredCopyKey,
  ToastOptions,
  ToastPhaseContent,
  ToastPromiseOptions,
  ToastUpdateOptions,
  ToastVariant,
  ToastVariantOptions,
};
