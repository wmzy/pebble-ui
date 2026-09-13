import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import type {
  UploadEntry,
  UploadFileStatus,
  UploadHandle,
  UploadListItemRender,
  UploadRequest,
  UploadValueItem,
} from './types';

import { css } from '@linaria/core';
import { useRef, useState, useCallback, useEffect, useImperativeHandle } from 'react';

import { useStrings } from '../LocaleProvider';

import UploadList from './UploadList';
import { createXhrRequest } from './xhr-upload';

type UploadCoreProps = {
  /** The selected files — the field value, emitted verbatim (as the
   * complete next list) by `onChange`. Local `File` picks mix freely
   * with `UploadFile` echo entries describing files already on the
   * server; echo entries only render (and stay removable), they never
   * enter the upload pipeline. */
  value: UploadValueItem[];
  /** Emits the next file list: a single pick replaces `value`, a
   * `multiple` pick appends to it. Removals from the built-in list
   * (and `clear()`) also flow through here — echo entries come back
   * as the very objects the consumer passed in. */
  onChange: (files: UploadValueItem[]) => void;
  /** Comma-separated accept tokens (`.txt`, `image/*`, `text/plain`) —
   * the same grammar the native picker uses. Dropped files that do not
   * match are discarded silently (the native dialog already enforces
   * this for click picks). */
  accept?: string;
  /** Gate for the drag-and-drop affordance. `true` (default) renders
   * the dashed drop area with a drag-over highlight and accepts dropped
   * files; `false` renders a plain click-only picker area. */
  droppable?: boolean;
  /** Gatekeeper applied to every file — click picks and drops alike —
   * before it enters the value: return `false` (or a promise resolving
   * to `false`) to drop the file. Verdicts for one pick are awaited
   * together (`Promise.all`) and committed as a single `onChange` once
   * every verdict resolved; the UI is not blocked while waiting.
   * A refused file never enters the list, so it never uploads. */
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  /** Cap for the committed list. Applied last: existing entries win,
   * then the freshly picked survivors; anything beyond the first
   * `maxCount` entries is discarded silently. */
  maxCount?: number;
  /** A `multiple` pick appends to `value`, a single pick replaces it. */
  multiple?: boolean;
  /**
   * Custom upload executor. When given, every file entering the list
   * (see `manual`) runs through it: call `options.onProgress` with a
   * 0–100 percent, honor `options.signal` for cancellation, resolve on
   * success and reject on failure. Takes precedence over `action`.
   * Neither `request` nor `action` → pure collection mode, exactly the
   * pre-executor behavior.
   */
  request?: UploadRequest;
  /**
   * Upload endpoint for the built-in XHR executor: the file is sent as
   * multipart FormData (field `name`, extra fields `data`) with `method`
   * and `headers`; progress is wired to `xhr.upload.onprogress` and
   * cancellation to `xhr.abort()`. Ignored when `request` is given.
   */
  action?: string;
  /** HTTP method for `action` uploads — defaults to `POST`. */
  method?: string;
  /** Extra request headers for `action` uploads. */
  headers?: Record<string, string>;
  /** Form field name carrying the file in `action` mode — defaults
   * to `file`. */
  name?: string;
  /** Extra form fields appended alongside the file in `action` mode. */
  data?: Record<string, string | Blob>;
  /**
   * `true` keeps picked files at `idle` — the upload only starts via
   * the `UploadHandle` ref (`upload()`/`uploadAll()`). Only meaningful
   * with `request` or `action`.
   */
  manual?: boolean;
  /**
   * Renders the built-in file list below the zone (default `false`):
   * file name, live progress (reusing `Progress`), status icon and
   * per-state actions — cancel while uploading, retry + remove on
   * error, remove otherwise. Pass an `itemRender` to replace whole
   * rows. Without `request`/`action` the list still tracks picks as
   * `idle` rows with remove actions.
   */
  showUploadList?: boolean | { itemRender?: UploadListItemRender };
  /**
   * Rendering style of the built-in list (default `text`): `text`
   * rows; `picture` — a text row with a 32px inline thumbnail before
   * the name (a `url` image for `UploadFile` echoes, an object-URL
   * preview for image files, a type-icon fallback otherwise); or a
   * `picture-card` grid of square thumbnail cards with the upload
   * mask, danger border + retry on error, and corner remove button.
   */
  listType?: 'text' | 'picture' | 'picture-card';
  /**
   * Click handler for the thumbnails of `picture` / `picture-card`
   * lists — the natural spot to open a lightbox (wire it to
   * `Image`/`ImagePreview`). Receives the value item the thumbnail
   * describes. The remove/retry/cancel buttons sit outside the hit
   * area and keep working.
   */
  onPreview?: (file: UploadValueItem) => void;
  /**
   * Overrides the built-in remove-button label (list rows and
   * picture-card corners); defaults to the locale string.
   */
  removeLabel?: string;
  /**
   * Picks directories instead of files: forwards the non-standard
   * `webkitdirectory`/`directory` attributes to the hidden input, so
   * the native dialog enumerates every file inside the chosen folder
   * (combine with `multiple` so the whole tree stays in the list).
   */
  directory?: boolean;
  /**
   * Fires whenever the tracked entries change (added, removed, status
   * or percent) with the complete snapshot in value order. Only tracks
   * while `request`/`action` or `showUploadList` is in play. `UploadFile`
   * echoes report their terminal `status`/`percent` like any row.
   */
  onStatusChange?: (files: UploadFileStatus[]) => void;
  className?: string;
  children?: ReactNode;
  ref?: Ref<UploadHandle>;
} & Omit<
  ComponentPropsWithoutRef<'div'>,
  | 'value'
  | 'onChange'
  | 'children'
  | 'onClick'
  | 'onDrop'
  | 'onDragOver'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onKeyDown'
  | 'role'
  | 'tabIndex'
>;

const zoneBase = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--haze-space-8) var(--haze-space-4);
  border: 2px dashed transparent;
  border-radius: var(--haze-radius-lg);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  cursor: pointer;
  transition: border-color var(--haze-duration-fast), background var(--haze-duration-fast);
  text-align: center;
`;

const dropArea = css`
  border-color: var(--haze-color-border);
  background: var(--haze-color-bg-subtle);

  &:hover,
  &[data-dragover='true'] {
    border-color: var(--haze-color-primary);
    background: var(--haze-color-primary-subtle);
  }
`;

const clickArea = css`
  background: var(--haze-color-bg-subtle);

  &:hover {
    background: var(--haze-color-primary-subtle);
  }
`;

const iconStyle = css`
  margin-bottom: var(--haze-space-3);
  color: var(--haze-color-text-muted);
`;

const hiddenInput = css`
  display: none;
`;

/** Lowercases and folds `jpg` into `jpeg` — browsers (and testing
 * libraries) treat the two spellings as interchangeable when matching
 * `accept` tokens. */
function normalizeForAccept(nameOrType: string): string {
  return nameOrType.toLowerCase().replace(/([./])jpg\b/g, '$1jpeg');
}

/** Whether `file` passes an `accept` attribute value: comma-separated
 * extension tokens (`.txt`) and MIME types, with `type/*` wildcards.
 * Mirrors what the native file dialog enforces for click picks, so
 * drops get the same semantics. */
function matchesAccept(file: File, accept: string): boolean {
  const name = normalizeForAccept(file.name);
  const type = normalizeForAccept(file.type);
  return accept
    .toLowerCase()
    .split(',')
    .map((token) => normalizeForAccept(token.trim()))
    .filter((token) => token.length > 0)
    .some((token) =>
      token.startsWith('.')
        ? name.endsWith(token)
        : token.endsWith('/*')
          ? type.startsWith(token.slice(0, -1))
          : type === token
    );
}

function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, Math.round(percent)));
}

// Value items carry no serializable identity, so list keys come from
// this WeakMap — stable per object instance across renders/picks.
// `UploadFile` echoes prefer their explicit `uid`.
const itemUids = new WeakMap<object, string>();
const uidCounter = { n: 0 };
function uidFor(item: UploadValueItem): string {
  if (!(item instanceof File) && item.uid) return item.uid;
  const existing = itemUids.get(item);
  if (existing) return existing;
  uidCounter.n += 1;
  const uid = `haze-upload-file-${uidCounter.n}`;
  itemUids.set(item, uid);
  return uid;
}

export default function UploadCore({
  value,
  onChange,
  accept,
  droppable = true,
  beforeUpload,
  maxCount,
  multiple = false,
  request,
  action,
  method,
  headers,
  name,
  data,
  manual = false,
  showUploadList,
  listType,
  onPreview,
  removeLabel,
  directory,
  onStatusChange,
  className,
  children,
  ref,
  ...rest
}: UploadCoreProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Transient drag-over highlight — hover-like UI state, never a
  // user-facing prop, so local state (not useControl) is correct here.
  const [dragOver, setDragOver] = useState(false);
  // Internal status machine: one entry per tracked file (value order).
  // Never a user-facing prop — the value channel stays `File[]`; the
  // machine is observed through `onStatusChange` / the built-in list.
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const strings = useStrings('upload');

  // The executor is armed only when the consumer opted in; without it
  // the component stays a pure collector (zero behavioral change).
  const executor: UploadRequest | undefined =
    request ??
    (action != null
      ? createXhrRequest({ action, method, headers, name, data })
      : undefined);
  const armed = executor != null;
  const listEnabled = showUploadList != null && showUploadList !== false;
  // Status is tracked while uploads can run, or while the list (with
  // its remove actions) is rendered.
  const tracking = armed || listEnabled;

  // Mirror the latest applied value so async beforeUpload verdicts
  // merge onto the freshest list instead of the one captured at pick
  // time (a parent may have committed another pick meanwhile).
  const latestValue = useRef(value);
  useEffect(() => {
    latestValue.current = value;
  });

  // Mirrors for the imperative handle and the async upload chain —
  // they run outside the render that produced the latest props.
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  });
  const latestExecutor = useRef(executor);
  useEffect(() => {
    latestExecutor.current = executor;
  });
  const latestOnChange = useRef(onChange);
  useEffect(() => {
    latestOnChange.current = onChange;
  });
  const latestOnStatusChange = useRef(onStatusChange);
  useEffect(() => {
    latestOnStatusChange.current = onStatusChange;
  });

  // One AbortController per in-flight upload — also the synchronous
  // "already running" guard (state updates may not have flushed when
  // two triggers race in the same tick).
  const controllers = useRef(new Map<string, AbortController>());
  // Uids that already went through runUpload. Autostart only fires for
  // fresh entries — an aborted upload returns to idle WITHOUT being
  // restarted by the auto mode (restart would loop: abort → idle →
  // autostart → …). Retries go through the retry action or the handle.
  const attemptedUids = useRef(new Set<string>());
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    const inFlight = controllers.current;
    return () => {
      mountedRef.current = false;
      inFlight.forEach((controller) => controller.abort());
      inFlight.clear();
    };
  }, []);

  const runUpload = useCallback((file: File) => {
    const exec = latestExecutor.current;
    if (!exec || !mountedRef.current) return;
    const entry = entriesRef.current.find((e) => e.file === file);
    if (!entry || controllers.current.has(entry.uid)) return;
    const { uid } = entry;
    const controller = new AbortController();
    controllers.current.set(uid, controller);
    attemptedUids.current.add(uid);
    setEntries((prev) =>
      prev.map((e) =>
        e.uid === uid ? { ...e, status: 'uploading', percent: 0 } : e
      )
    );
    exec(file, {
      signal: controller.signal,
      onProgress: (percent) => {
        setEntries((prev) =>
          prev.map((e) =>
            e.uid === uid && e.status === 'uploading'
              ? { ...e, percent: clampPercent(percent) }
              : e
          )
        );
      },
    })
      .then(() => {
        setEntries((prev) =>
          prev.map((e) =>
            e.uid === uid && e.status === 'uploading'
              ? { ...e, status: 'success', percent: 100 }
              : e
          )
        );
      })
      .catch((error: unknown) => {
        setEntries((prev) =>
          prev.map((e) => {
            if (e.uid !== uid || e.status !== 'uploading') return e;
            const aborted =
              controller.signal.aborted ||
              (error instanceof DOMException && error.name === 'AbortError');
            // A cancelled upload is not a failure: the file drops back
            // to idle (it leaves the list entirely when the cancel was
            // a remove — the sync effect below already dropped it).
            return aborted
              ? { ...e, status: 'idle', percent: 0 }
              : { ...e, status: 'error' };
          })
        );
      })
      .finally(() => {
        controllers.current.delete(uid);
      });
  }, []);

  // Keep the tracked entries in lockstep with the value: files that
  // entered (picked, dropped, echoed) get fresh entries carrying their
  // status forward; files that left are dropped. Dormant in pure
  // collection mode.
  useEffect(() => {
    if (!tracking) {
      setEntries((prev) => (prev.length > 0 ? [] : prev));
      return;
    }
    // A file that left the value forgets its attempt mark — if it is
    // ever re-added (same File object), autostart picks it up again.
    const liveUids = new Set(value.map((item) => uidFor(item)));
    attemptedUids.current.forEach((uid) => {
      if (!liveUids.has(uid)) attemptedUids.current.delete(uid);
    });
    setEntries((prev) => {
      if (prev.length === 0 && value.length === 0) return prev;
      const byItem = new Map(prev.map((e) => [e.file, e] as const));
      let changed = value.length !== prev.length;
      const next = value.map((item) => {
        const existing = byItem.get(item);
        if (existing) {
          byItem.delete(item);
          if (item instanceof File) return existing;
          // Echo entries follow their terminal description — a consumer
          // may flip `status`/`percent` between renders.
          const status = item.status ?? 'success';
          const percent = clampPercent(item.percent ?? 0);
          if (existing.status === status && existing.percent === percent) {
            return existing;
          }
          changed = true;
          return { ...existing, status, percent };
        }
        changed = true;
        return item instanceof File
          ? { uid: uidFor(item), file: item, status: 'idle' as const, percent: 0 }
          : {
              uid: uidFor(item),
              file: item,
              status: item.status ?? 'success',
              percent: clampPercent(item.percent ?? 0),
            };
      });
      return changed || byItem.size > 0 ? next : prev;
    });
  }, [value, tracking]);

  // Auto mode: every entry that lands in the list starts uploading
  // right away (initial value included) — exactly once per stay in the
  // list; cancelled/failed files wait for an explicit retry. Manual
  // mode leaves them idle for the handle to trigger. Echo entries sit
  // at a terminal status, so they never take this path.
  useEffect(() => {
    if (!armed || manual) return;
    entries.forEach((e) => {
      if (e.file instanceof File && e.status === 'idle' && !attemptedUids.current.has(e.uid)) {
        runUpload(e.file);
      }
    });
  }, [entries, armed, manual, runUpload]);

  useEffect(() => {
    const emit = latestOnStatusChange.current;
    if (!emit || !tracking) return;
    emit(entries.map(({ file, status, percent }) => ({ file, status, percent })));
  }, [entries, tracking]);

  // Imperative surface: `ref.current?.upload()/uploadAll()/abort()/clear()`.
  // The methods only drive state, controllers and the value channel, so
  // every exit path stays single-sourced with the UI actions.
  useImperativeHandle(
    ref,
    () => ({
      upload: (file?: File) => {
        if (file !== undefined) {
          runUpload(file);
          return;
        }
        entriesRef.current.forEach((e) => {
          // echo entries never re-enter the pipeline — status is terminal
          if (
            e.file instanceof File &&
            (e.status === 'idle' || e.status === 'error')
          ) {
            runUpload(e.file);
          }
        });
      },
      uploadAll: () => {
        entriesRef.current.forEach((e) => {
          if (e.file instanceof File && e.status !== 'uploading') {
            runUpload(e.file);
          }
        });
      },
      abort: () => {
        controllers.current.forEach((controller) => controller.abort());
      },
      clear: () => {
        controllers.current.forEach((controller) => controller.abort());
        controllers.current.clear();
        if (mountedRef.current) latestOnChange.current([]);
      },
    }),
    [runUpload]
  );

  const abortEntry = useCallback((file: UploadValueItem) => {
    const entry = entriesRef.current.find((e) => e.file === file);
    if (entry) controllers.current.get(entry.uid)?.abort();
  }, []);

  // Remove/cancel both abort an in-flight upload and drop the file
  // from the value; the sync effect then forgets its entry.
  const removeFile = useCallback(
    (file: UploadValueItem) => {
      abortEntry(file);
      if (!mountedRef.current) return;
      onChange(latestValue.current.filter((f) => f !== file));
    },
    [abortEntry, onChange]
  );

  const retryFile = useCallback(
    (file: UploadValueItem) => {
      if (!(file instanceof File)) return;
      if (entriesRef.current.find((e) => e.file === file)?.status !== 'error') return;
      runUpload(file);
    },
    [runUpload]
  );

  const commit = useCallback(
    (picked: File[]) => {
      if (picked.length === 0) return;

      const emit = (kept: File[]) => {
        if (kept.length === 0) return;
        const next = multiple ? [...latestValue.current, ...kept] : kept;
        // Order of operations: accept (applied by the caller for drops,
        // by the native dialog for picks) → beforeUpload → maxCount.
        // maxCount keeps existing entries first; excess fresh files are
        // dropped silently.
        onChange(maxCount == null ? next : next.slice(0, maxCount));
      };

      if (!beforeUpload) {
        emit(picked);
        return;
      }
      // Async gate: the UI keeps working while verdicts are pending;
      // the whole batch resolves into exactly one onChange. A rejected
      // gate aborts the pick (no onChange) — gate crashes are the
      // consumer's error surface, not this component's.
      Promise.all(picked.map((file) => Promise.resolve(beforeUpload(file))))
        .then((verdicts) => {
          emit(picked.filter((_, index) => verdicts[index]));
        })
        .catch(() => undefined);
    },
    [multiple, maxCount, beforeUpload, onChange]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // `webkitdirectory`/`directory` are non-standard (no React DOM
  // types); browsers key off attribute presence, so empty-string
  // values. Typed through a variable — JSX spread of a non-literal
  // skips excess-property checking.
  const directoryAttributes: { webkitdirectory?: string; directory?: string } =
    directory ? { webkitdirectory: '', directory: '' } : {};

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // role="button": Enter and Space activate; Space would also scroll.
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      commit(Array.from(e.target.files || []));
      e.target.value = '';
    },
    [commit]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      // Drop path: enforce the accept grammar ourselves (mismatches are
      // discarded silently) so drops share the picker's semantics.
      const dropped = Array.from(e.dataTransfer.files);
      commit(accept ? dropped.filter((file) => matchesAccept(file, accept)) : dropped);
    },
    [commit, accept]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Dragging onto a child element first fires dragleave here with the
    // child as relatedTarget — only clear the highlight when the drag
    // actually left the zone.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragOver(false);
  }, []);

  return (
    <>
      <div
        data-slot='drop-zone'
        /* before {...rest}: an explicit aria-label prop wins over the
           locale fallback so consumers can name the zone themselves */
        aria-label={strings.label}
        {...rest}
        x-class={[zoneBase, droppable ? dropArea : clickArea, className]}
        data-dragover={droppable && dragOver ? 'true' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={droppable ? handleDrop : undefined}
        onDragOver={droppable ? handleDragOver : undefined}
        onDragEnter={droppable ? handleDragEnter : undefined}
        onDragLeave={droppable ? handleDragLeave : undefined}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          x-class={[hiddenInput]}
          type="file"
          accept={accept}
          multiple={multiple}
          {...directoryAttributes}
          onChange={handleChange}
          // implementation detail of the dropzone (role="button"): hide it
          // from a11y tree and tab order; input.click() still opens the dialog
          hidden
        />
        {children || (
          <>
            <svg data-slot='icon' x-class={[iconStyle]} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div data-slot='hint'>{droppable ? strings.hint : strings.clickHint}</div>
          </>
        )}
      </div>
      {listEnabled && entries.length > 0 && (
        <UploadList
          entries={entries}
          listType={listType}
          removeLabel={removeLabel}
          onPreview={onPreview}
          itemRender={
            typeof showUploadList === 'object' ? showUploadList.itemRender : undefined
          }
          onRemove={removeFile}
          onRetry={retryFile}
          onCancel={removeFile}
        />
      )}
    </>
  );
}

export type { UploadCoreProps };
