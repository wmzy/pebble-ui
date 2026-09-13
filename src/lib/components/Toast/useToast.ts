import type {ReactNode} from 'react';

import type {
  ToastOptions,
  ToastPromiseOptions,
  ToastUpdateOptions,
  ToastVariantOptions,
} from './toast';

import {useMemo} from 'react';

import {useConfigDefaults} from '../ConfigProvider/useConfigDefaults';

import {useToastContext} from './ToastContext';
import {driveToastPromise} from './toast';

/**
 * The `useToast()` return value: the toast trigger itself (returns the id,
 * usable with `update`) plus `loading`/`update`/`promise` — one-to-one
 * with the module-level `toast` API, but routed through the enclosing
 * container's context instead of the first-mounted channel subscriber.
 */
type ShowToast = {
  (content: ReactNode, options?: ToastOptions): number;
  /** Info toast — see `toast.info`. */
  info: (content: ReactNode, options?: ToastVariantOptions) => number;
  /** Success toast — see `toast.success`. */
  success: (content: ReactNode, options?: ToastVariantOptions) => number;
  /** Warning toast — see `toast.warning`. */
  warning: (content: ReactNode, options?: ToastVariantOptions) => number;
  /** Danger toast — see `toast.danger`. */
  danger: (content: ReactNode, options?: ToastVariantOptions) => number;
  /** Loading toast with the spinner icon — see `toast.loading`. */
  loading: (content: ReactNode, options?: ToastVariantOptions) => number;
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
  // ConfigProvider default for the auto-dismiss budget — applies only
  // when the call omits `duration`. `loading()` deliberately keeps its
  // persistent (0ms) semantics, and the module-level `toast()` (outside
  // any React tree) keeps its own 3000ms default.
  const {duration: configDuration} = useConfigDefaults('Toast');

  return useMemo(() => {
    const show: ShowToast = (content, options) =>
      addToast({
        content,
        variant: options?.variant ?? 'info',
        duration: options?.duration ?? configDuration ?? 3000,
        ...(options?.action !== undefined && {action: options.action}),
        ...(options?.title !== undefined && {title: options.title}),
      });
    show.info = (content, options) => show(content, {...options, variant: 'info'});
    show.success = (content, options) => show(content, {...options, variant: 'success'});
    show.warning = (content, options) => show(content, {...options, variant: 'warning'});
    show.danger = (content, options) => show(content, {...options, variant: 'danger'});
    show.loading = (content, options) =>
      addToast({
        content,
        variant: 'loading',
        duration: options?.duration ?? 0,
        ...(options?.action !== undefined && {action: options.action}),
        ...(options?.title !== undefined && {title: options.title}),
      });
    show.update = (id, patch) => updateToast(id, patch);
    show.promise = (promise, options) =>
      driveToastPromise(show.loading, updateToast, promise, options);
    return show;
  }, [addToast, updateToast, configDuration]);
}

export type {ShowToast};
