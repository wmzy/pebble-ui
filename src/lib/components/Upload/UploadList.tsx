import type {
  UploadEntry,
  UploadListItemActions,
  UploadListItemRender,
} from './types';

import { css } from '@linaria/core';
import { useState, useEffect } from 'react';

import { useStrings } from '../LocaleProvider';
import { Progress } from '../Progress';

type UploadListProps = {
  /** Tracked rows, in value order. */
  entries: UploadEntry[];
  /** Rendering style of the built-in list: `text` rows (default) or a
   * `picture-card` grid of square thumbnail cards. */
  listType?: 'text' | 'picture-card';
  /** Overrides the remove-button label (text rows and picture-card
   * corners alike); defaults to the locale string. */
  removeLabel?: string;
  /** Replaces the default row/cell rendering entirely. */
  itemRender?: UploadListItemRender;
  onRemove: (file: File) => void;
  onRetry: (file: File) => void;
  onCancel: (file: File) => void;
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

function actionsFor(
  entry: UploadEntry,
  onRemove: (file: File) => void,
  onRetry: (file: File) => void,
  onCancel: (file: File) => void
): UploadListItemActions {
  return {
    remove: () => onRemove(entry.file),
    retry: () => onRetry(entry.file),
    cancel: () => onCancel(entry.file),
  };
}

/** The default row: status icon + name + state text + per-state
 * actions, with the progress bar underneath while uploading/errored. */
function DefaultRow({
  entry,
  actions,
  removeLabel,
}: {
  entry: UploadEntry;
  actions: UploadListItemActions;
  removeLabel?: string;
}) {
  const strings = useStrings('upload');
  const { file, status, percent } = entry;
  return (
    <>
      <div x-class={[rowBase]}>
        {status === 'success' && (
          <span x-class={[statusIcon, successIcon]} role="img" aria-label={strings.success}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {status === 'error' && (
          <span x-class={[statusIcon, errorIcon]} role="img" aria-label={strings.error}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
        )}
        <span x-class={[nameClass]} title={file.name}>
          {file.name}
        </span>
        {status === 'uploading' && (
          <span x-class={[percentClass]}>
            {strings.uploading} {percent}%
          </span>
        )}
        {status === 'uploading' ? (
          <button
            type="button"
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
            {status === 'error' && (
              <button
                type="button"
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
      {(status === 'uploading' || status === 'error') && (
        <Progress
          value={percent}
          size="sm"
          color={status === 'error' ? 'danger' : 'primary'}
        />
      )}
    </>
  );
}

/** One picture-card cell: an object-URL thumbnail for image files, a
 * type-icon fallback for everything else; the upload mask with live
 * percent, the danger error overlay with retry, and the corner remove
 * button layered on top. */
function PictureCard({
  entry,
  actions,
  removeLabel,
}: {
  entry: UploadEntry;
  actions: UploadListItemActions;
  removeLabel?: string;
}) {
  const strings = useStrings('upload');
  const { file, status, percent } = entry;
  const isImage = file.type.startsWith('image/');
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  // Blob URL lifecycle: one createObjectURL per file, revoked when the
  // file swaps or the card unmounts (entry removed / list torn down /
  // component unmounted) — never leaked.
  useEffect(() => {
    if (!isImage) return;
    const objectUrl = URL.createObjectURL(file);
    setThumbUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

  return (
    <>
      {thumbUrl ? (
        <img x-class={[cardImage]} src={thumbUrl} alt={file.name} />
      ) : (
        <span x-class={[cardFallback]} role="img" aria-label={file.name}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span x-class={[cardFallbackName]} title={file.name}>
            {file.name}
          </span>
        </span>
      )}
      {status === 'uploading' && (
        <div x-class={[cardMask]}>
          <Progress value={percent} size="sm" />
          <span x-class={[cardMaskPercent]}>{percent}%</span>
        </div>
      )}
      {status === 'error' && (
        <div x-class={[cardErrorOverlay]}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{strings.error}</span>
          <button
            type="button"
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
        </div>
      )}
      <button
        type="button"
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
  onRemove,
  onRetry,
  onCancel,
}: UploadListProps) {
  const picture = listType === 'picture-card';
  return (
    <ul x-class={[picture ? cardGrid : listBase]}>
      {entries.map((entry) => {
        const actions = actionsFor(entry, onRemove, onRetry, onCancel);
        return (
          <li
            key={entry.uid}
            x-class={[picture ? cardBase : itemBase]}
            data-status={entry.status}
          >
            {itemRender ? (
              itemRender(entry.file, entry.status, entry.percent, actions)
            ) : picture ? (
              <PictureCard
                entry={entry}
                actions={actions}
                removeLabel={removeLabel}
              />
            ) : (
              <DefaultRow
                entry={entry}
                actions={actions}
                removeLabel={removeLabel}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type { UploadListProps };
