import type {ReactNode} from 'react';

import {createContext, useContext} from 'react';

type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

type ToastItem = {
  id: number;
  variant: ToastVariant;
  content: ReactNode;
  duration: number;
};

/**
 * Patch accepted by `toast.update(id, patch)` and `useToast().update(id,
 * patch)`. Only fields present in the patch change; an omitted (or
 * undefined) field keeps the toast's current value.
 */
type ToastUpdateOptions = {
  /** Replacement message content. */
  content?: ReactNode;
  /** Replacement color variant. */
  variant?: ToastVariant;
  /** New auto-dismiss budget in ms. Changing it re-arms the countdown
   * from the full value; leaving it out keeps the running countdown. */
  duration?: number;
};

/** The `toast.promise` phases whose default copy lives in the locale pack. */
type ToastDeferredCopyKey = 'loading' | 'success' | 'error';

/**
 * Sentinel ReactNode standing in for promise-phase copy that resolves
 * against the locale pack at render time: `toast.promise` may fire from
 * outside any React tree, so it cannot read `useStrings` itself — the
 * container resolves the marker when it renders the toast. The sentinel
 * rides the `content` channel as an opaque marker (cast once at the
 * factory below); only the container ever interprets it.
 */
type ToastDeferredCopy = {
  readonly deferredCopy: ToastDeferredCopyKey;
};

/** Creates the locale-deferred sentinel for one promise phase. */
function deferredToastCopy(key: ToastDeferredCopyKey): ReactNode {
  return {deferredCopy: key} as unknown as ReactNode;
}

/**
 * Extracts the deferred phase from a content node, or null when the node
 * is ordinary content. User content cannot collide: a React element never
 * carries an own `deferredCopy` data property, and the value must name a
 * real phase.
 */
/** Runtime check for a phase key arriving from an untrusted object graph. */
function isDeferredCopyKey(value: unknown): value is ToastDeferredCopyKey {
  return value === 'loading' || value === 'success' || value === 'error';
}

function deferredCopyKey(node: ReactNode): ToastDeferredCopyKey | null {
  if (typeof node !== 'object' || node === null || !('deferredCopy' in node)) {
    return null;
  }
  const key = (node as ToastDeferredCopy).deferredCopy;
  return isDeferredCopyKey(key) ? key : null;
}

/**
 * Pure merge of an update patch onto a toast item: keys absent (or
 * undefined) in the patch keep the item's current value, so an update
 * never clobbers fields it did not name.
 */
function applyToastPatch(item: ToastItem, patch: ToastUpdateOptions): ToastItem {
  return {
    ...item,
    ...(patch.content !== undefined && {content: patch.content}),
    ...(patch.variant !== undefined && {variant: patch.variant}),
    ...(patch.duration !== undefined && {duration: patch.duration}),
  };
}

type ToastContextValue = {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => number;
  removeToast: (id: number) => void;
  /** Patches a live toast in place — the same id and React key, so the
   * enter/exit animations never replay (see `toast.update`). */
  updateToast: (id: number, patch: ToastUpdateOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ToastContext.Provider;

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastContainer>');
  return ctx;
}

export {
  applyToastPatch,
  deferredCopyKey,
  deferredToastCopy,
};
export type {
  ToastDeferredCopy,
  ToastDeferredCopyKey,
  ToastItem,
  ToastContextValue,
  ToastUpdateOptions,
  ToastVariant,
};
