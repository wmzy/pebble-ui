import type {ReactNode} from 'react';

import type {
  ToastOptions,
  ToastPromiseOptions,
  ToastUpdateOptions,
} from './toast';

import {useMemo} from 'react';

import {useToastContext} from './ToastContext';
import {driveToastPromise} from './toast';

/**
 * The `useToast()` return value: the toast trigger itself (returns the id,
 * usable with `update`) plus `update` and `promise` — one-to-one with the
 * module-level `toast` API, but routed through the enclosing container's
 * context instead of the first-mounted channel subscriber.
 */
type ShowToast = {
  (content: ReactNode, options?: ToastOptions): number;
  /** Patches a toast in place — see `toast.update`. */
  update: (id: number, patch: ToastUpdateOptions) => void;
  /** Loading → success/danger lifecycle — see `toast.promise`. */
  promise: <T>(
    promise: Promise<T>,
    options?: ToastPromiseOptions<T>
  ) => Promise<T>;
};

export default function useToast(): ShowToast {
  const {addToast, updateToast} = useToastContext();

  return useMemo(() => {
    const show: ShowToast = (content, options) =>
      addToast({
        content,
        variant: options?.variant ?? 'info',
        duration: options?.duration ?? 3000,
      });
    show.update = (id, patch) => updateToast(id, patch);
    show.promise = (promise, options) =>
      driveToastPromise(show, updateToast, promise, options);
    return show;
  }, [addToast, updateToast]);
}

export type {ShowToast};
