import type { ReactNode } from 'react';

/** Lifecycle of one tracked file while an upload executor (`request`
 * or `action`) is armed. */
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

/** A file that already lives on the server: described by metadata
 * instead of a local `File` object. Passed through `value` to echo an
 * existing upload — rendered in the built-in list (a `url` thumbnail
 * for the picture list types), removable, but never re-entering the
 * upload pipeline (`beforeUpload`/`request`/`action` only ever see
 * real `File` objects). */
type UploadFile = {
  /** Stable identity for list keys. When omitted, one is generated per
   * object instance and reused across renders. */
  uid?: string;
  name: string;
  /** Remote source rendered as the thumbnail in picture list types. */
  url?: string;
  /** Bytes, when the server reports them. */
  size?: number;
  /** Terminal state of the echoed upload — defaults to `success`. */
  status?: 'success' | 'error';
  /** 0–100, clamped; purely informational for echo entries. */
  percent?: number;
};

/** One item of the value channel: a picked local `File` (enters the
 * upload pipeline) or an `UploadFile` echo (terminal). */
type UploadValueItem = File | UploadFile;

/** Status snapshot for one tracked value item — the shape surfaced
 * through `onStatusChange` and `showUploadList.itemRender`. */
type UploadFileStatus = {
  file: UploadValueItem;
  status: UploadStatus;
  /** 0–100, clamped; forced to 100 when the upload succeeds. */
  percent: number;
};

/** Runtime handed to a custom `request` (and used internally by the
 * XHR wrapper that `action` mode builds). */
type UploadRequestOptions = {
  /** Report progress; values are clamped to 0–100. */
  onProgress: (percent: number) => void;
  /** Aborted when the upload is cancelled, removed or cleared — wire
   * it to the underlying transport. */
  signal: AbortSignal;
};

/** Custom upload executor: resolve on success, reject on failure.
 * Rejecting with an `AbortError` `DOMException` (or after `signal`
 * aborted) maps the file back to `idle` instead of `error`. */
type UploadRequest = (
  file: File,
  options: UploadRequestOptions
) => Promise<void>;

/** Row-level callbacks handed to a custom `itemRender`. */
type UploadListItemActions = {
  /** Abort the upload if in flight, then drop the file from the list. */
  remove: () => void;
  /** Re-run the upload. No-op unless the file errored. */
  retry: () => void;
  /** Abort the in-flight upload and drop the file (uploading state). */
  cancel: () => void;
};

/** Custom renderer replacing a built-in list row. Echo entries
 * (`UploadFile` items) reach it the same way local files do. */
type UploadListItemRender = (
  file: UploadValueItem,
  status: UploadStatus,
  percent: number,
  actions: UploadListItemActions
) => ReactNode;

/**
 * Imperative surface (`ref.current?.…`) — the same React 19
 * ref-as-prop channel `DialogHandle` uses:
 *
 * - `upload(file?)` — start every pending file (idle or error); with a
 *   `file`, (re)start just that one.
 * - `uploadAll()` — (re)start every file that is not currently
 *   uploading, successful ones included.
 * - `abort()` — abort every in-flight upload; aborted files return to
 *   `idle` and stay in the list.
 * - `clear()` — abort everything and empty the list (`onChange([])`).
 */
type UploadHandle = {
  upload: (file?: File) => void;
  uploadAll: () => void;
  abort: () => void;
  clear: () => void;
};

/** Internal tracked row: public status snapshot plus the stable uid the
 * list keys on (value items carry no serializable identity). Echo
 * entries hold their terminal `status`/`percent` from the
 * `UploadFile` description. */
type UploadEntry = UploadFileStatus & { uid: string };

export type {
  UploadStatus,
  UploadFile,
  UploadValueItem,
  UploadFileStatus,
  UploadRequestOptions,
  UploadRequest,
  UploadListItemActions,
  UploadListItemRender,
  UploadHandle,
  UploadEntry,
};
