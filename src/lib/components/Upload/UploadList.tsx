import type { ReactNode } from 'react';
import type {
  UploadEntry,
  UploadListItemActions,
  UploadListItemRender,
  UploadValueItem,
} from './types';

import { css } from '@linaria/core';
import { useState, useEffect } from 'react';

import { useStrings } from '../LocaleProvider';
import { Progress } from '../Progress';

type UploadListProps = {
  /** Tracked rows, in value order. */
  entries: UploadEntry[];
  /** Rendering style of the built-in list: `text` rows (default), a
   * `picture` text row with a 32px inline thumbnail, or a
   * `picture-card` grid of square thumbnail cards. */
  listType?: 'text' | 'picture' | 'picture-card';
  /** Overrides the remove-button label (text rows and picture-card
   * corners alike); defaults to the locale string. */
  removeLabel?: string;
  /** Replaces the default row/cell rendering entirely. */
  itemRender?: UploadListItemRender;
  /** Click handler for `picture` / `picture-card` thumbnails. */
  onPreview?: (file: UploadValueItem) => void;
  onRemove: (file: UploadValueItem) => void;
  onRetry: (file: UploadValueItem) => void;
  onCancel: (file: UploadValueItem) => void;
};

const listBase = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  margin: var(--haze-space-3) 0 0;
  padding: 0;
  list-style: none;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

const itemBase = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-1);
  padding: var(--haze-space-2) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
`;

const rowBase = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  min-width: 0;
`;

const nameClass = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const statusIcon = css`
  display: inline-flex;
  flex-shrink: 0;
`;

const successIcon = css`
  color: var(--haze-color-success);
`;

const errorIcon = css`
  color: var(--haze-color-danger);
`;

const percentClass = css`
  flex-shrink: 0;
  color: var(--haze-color-text-secondary);
  font-variant-numeric: tabular-nums;
`;

const actionButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: var(--haze-space-1);
  border: none;
  border-radius: var(--haze-radius-sm);
  background: transparent;
  color: var(--haze-color-text-muted);
  cursor: pointer;

  &:hover {
    background: var(--haze-color-bg-subtle);
    color: var(--haze-color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--haze-color-focus-ring);
    outline-offset: 1px;
  }
`;

// ─── picture-card ───────────────────────────────────────────────

const cardGrid = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--haze-space-2);
  margin: var(--haze-space-3) 0 0;
  padding: 0;
  list-style: none;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

const cardRemove = css`
  position: absolute;
  top: var(--haze-space-1);
  inset-inline-end: var(--haze-space-1);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--haze-space-1);
  border: none;
  border-radius: var(--haze-radius-sm);
  background: color-mix(in srgb, var(--haze-color-bg) 78%, transparent);
  color: var(--haze-color-text);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--haze-duration-fast) var(--haze-ease);

  &:hover {
    background: var(--haze-color-bg);
    color: var(--haze-color-danger);
  }

  /* keyboard users never hover: reveal on focus itself */
  &:focus-visible {
    opacity: 1;
    outline: 2px solid var(--haze-color-focus-ring);
    outline-offset: 1px;
  }
`;

const cardBase = css`
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  overflow: hidden;

  &[data-status='error'] {
    border-color: var(--haze-color-danger);
  }

  /* the corner remove button floats in on card hover / focus-within */
  &:hover [data-card-remove],
  &:focus-within [data-card-remove] {
    opacity: 1;
  }
`;

const cardImage = css`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const cardFallback = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-1);
  width: 100%;
  height: 100%;
  padding: var(--haze-space-2);
  box-sizing: border-box;
  color: var(--haze-color-text-muted);
  text-align: center;
  min-width: 0;
`;

const cardFallbackName = css`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
`;

const cardMask = css`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-3);
  box-sizing: border-box;
  background: color-mix(in srgb, var(--haze-color-bg) 72%, transparent);
  backdrop-filter: blur(2px);
`;

const cardMaskPercent = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
  font-variant-numeric: tabular-nums;
`;

const cardErrorOverlay = css`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-2);
  box-sizing: border-box;
  background: var(--haze-color-danger-subtle);
  color: var(--haze-color-danger);
  font-size: var(--haze-text-xs);
  text-align: center;
`;

// ─── picture (inline thumbnail rows) ────────────────────────────

const picThumb = css`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--haze-space-8);
  height: var(--haze-space-8);
  padding: var(--haze-space-1);
  box-sizing: border-box;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  background: var(--haze-color-bg-subtle);
  color: var(--haze-color-text-muted);
  overflow: hidden;
`;

const picThumbImg = css`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

// ─── thumbnail preview hit area (picture + picture-card) ────────

const previewHit = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  border-radius: inherit;
  background: transparent;
  cursor: zoom-in;

  &:focus-visible {
    outline: 2px solid var(--haze-color-focus-ring);
    outline-offset: 1px;
  }
`;

function actionsFor(
  entry: UploadEntry,
  onRemove: (file: UploadValueItem) => void,
  onRetry: (file: UploadValueItem) => void,
  onCancel: (file: UploadValueItem) => void
): UploadListItemActions {
  return {
    remove: () => onRemove(entry.file),
    retry: () => onRetry(entry.file),
    cancel: () => onCancel(entry.file),
  };
}

/** Resolves the thumbnail source for one value item: the remote `url`
 * for `UploadFile` echoes, an object URL for image `File`s (created
 * once, revoked when the item swaps or the row unmounts), `null` for
 * everything else (the type-icon fallback). */
function useThumbSource(file: UploadValueItem): string | null {
  const isLocalImage = file instanceof File && file.type.startsWith('image/');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isLocalImage) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isLocalImage]);
  if (!(file instanceof File)) return file.url ?? null;
  return objectUrl;
}

/** The default row: an optional leading thumbnail (the `picture` list
 * type), status icon + name + state text + per-state actions, with
 * the progress bar underneath while uploading/errored. Echo entries
 * (`UploadFile`) sit at a terminal status: they remove but never
 * retry — there is no local `File` to send again. */
function DefaultRow({
  entry,
  actions,
  removeLabel,
  thumb,
}: {
  entry: UploadEntry;
  actions: UploadListItemActions;
  removeLabel?: string;
  thumb?: ReactNode;
}) {
  const strings = useStrings('upload');
  const { file, status, percent } = entry;
  const isFile = file instanceof File;
  return (
    <>
      <div data-slot='row' x-class={[rowBase]}>
        {thumb}
        {status === 'success' && (
          <span data-slot='icon' x-class={[statusIcon, successIcon]} role="img" aria-label={strings.success}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {status === 'error' && (
          <span data-slot='icon' x-class={[statusIcon, errorIcon]} role="img" aria-label={strings.error}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
        )}
        <span data-slot='name' x-class={[nameClass]} title={file.name}>
          {file.name}
        </span>
        {status === 'uploading' && (
          <span data-slot='status' x-class={[percentClass]}>
            {strings.uploading} {percent}%
          </span>
        )}
        {status === 'uploading' ? (
          <button
            type="button"
            data-slot='cancel-button'
            x-class={[actionButton]}
            aria-label={strings.cancel}
            data-action="cancel"
            onClick={actions.cancel}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <>
            {status === 'error' && isFile && (
              <button
                type="button"
                data-slot='retry-button'
                x-class={[actionButton]}
                aria-label={strings.retry}
                data-action="retry"
                onClick={actions.retry}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            )}
            <button
              type="button"
              data-slot='remove-button'
              x-class={[actionButton]}
              aria-label={removeLabel ?? strings.remove}
              data-action="remove"
              onClick={actions.remove}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </>
        )}
      </div>
      {(status === 'uploading' || (status === 'error' && isFile)) && (
        <Progress
          value={percent}
          size="sm"
          color={status === 'error' ? 'danger' : 'primary'}
        />
      )}
    </>
  );
}

/** The 32px inline thumbnail heading a `picture` row: an image when a
 * source resolves (echo `url` or an object URL), a type icon
 * otherwise; the whole box turns into the preview hit area when
 * `onPreview` is wired. */
function PictureThumb({
  file,
  onPreview,
}: {
  file: UploadValueItem;
  onPreview?: (file: UploadValueItem) => void;
}) {
  const thumbSrc = useThumbSource(file);
  const media = thumbSrc ? (
    <img
      x-class={[picThumbImg]}
      src={thumbSrc}
      alt={onPreview ? '' : file.name}
    />
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
  return (
    <span data-slot='thumbnail' x-class={[picThumb]} data-thumb>
      {onPreview ? (
        <button
          type="button"
          data-slot='preview'
          x-class={[previewHit]}
          aria-label={file.name}
          data-action="preview"
          onClick={() => onPreview(file)}
        >
          {media}
        </button>
      ) : (
        media
      )}
    </span>
  );
}

/** One picture-card cell: an image thumbnail (an object URL for image
 * files, the `url` for echo entries), a type-icon fallback for
 * everything else; the upload mask with live percent, the danger error
 * overlay with retry (local files only — echoes carry no `File` to
 * resend), and the corner remove button layered on top. The media
 * area doubles as the preview hit area when `onPreview` is wired. */
function PictureCard({
  entry,
  actions,
  removeLabel,
  onPreview,
}: {
  entry: UploadEntry;
  actions: UploadListItemActions;
  removeLabel?: string;
  onPreview?: (file: UploadValueItem) => void;
}) {
  const strings = useStrings('upload');
  const { file, status, percent } = entry;
  const isFile = file instanceof File;
  const thumbSrc = useThumbSource(file);

  const media = thumbSrc ? (
    <img
      data-slot='thumbnail'
      x-class={[cardImage]}
      src={thumbSrc}
      alt={onPreview ? '' : file.name}
    />
  ) : (
    <span
      data-slot='thumbnail'
      x-class={[cardFallback]}
      role={onPreview ? undefined : 'img'}
      aria-label={onPreview ? undefined : file.name}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span data-slot='name' x-class={[cardFallbackName]} title={file.name}>
        {file.name}
      </span>
    </span>
  );

  return (
    <>
      {onPreview ? (
        <button
          type="button"
          data-slot='preview'
          x-class={[previewHit]}
          aria-label={file.name}
          data-action="preview"
          onClick={() => onPreview(file)}
        >
          {media}
        </button>
      ) : (
        media
      )}
      {status === 'uploading' && (
        <div data-slot='mask' x-class={[cardMask]}>
          <Progress value={percent} size="sm" />
          <span data-slot='status' x-class={[cardMaskPercent]}>{percent}%</span>
        </div>
      )}
      {status === 'error' && (
        <div data-slot='error-overlay' x-class={[cardErrorOverlay]}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{strings.error}</span>
          {isFile && (
            <button
              type="button"
              data-slot='retry-button'
              x-class={[actionButton]}
              aria-label={strings.retry}
              data-action="retry"
              onClick={actions.retry}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        data-slot='remove-button'
        x-class={[cardRemove]}
        data-card-remove
        aria-label={removeLabel ?? strings.remove}
        data-action="remove"
        onClick={actions.remove}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </>
  );
}

export default function UploadList({
  entries,
  listType = 'text',
  removeLabel,
  itemRender,
  onPreview,
  onRemove,
  onRetry,
  onCancel,
}: UploadListProps) {
  const pictureCard = listType === 'picture-card';
  const pictureRow = listType === 'picture';
  return (
    <ul data-slot='list' x-class={[pictureCard ? cardGrid : listBase]}>
      {entries.map((entry) => {
        const actions = actionsFor(entry, onRemove, onRetry, onCancel);
        return (
          <li
            key={entry.uid}
            data-slot='item'
            x-class={[pictureCard ? cardBase : itemBase]}
            data-status={entry.status}
          >
            {itemRender ? (
              itemRender(entry.file, entry.status, entry.percent, actions)
            ) : pictureCard ? (
              <PictureCard
                entry={entry}
                actions={actions}
                removeLabel={removeLabel}
                onPreview={onPreview}
              />
            ) : (
              <DefaultRow
                entry={entry}
                actions={actions}
                removeLabel={removeLabel}
                thumb={
                  pictureRow ? (
                    <PictureThumb file={entry.file} onPreview={onPreview} />
                  ) : undefined
                }
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type { UploadListProps };
