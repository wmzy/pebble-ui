import type {
  UploadEntry,
  UploadListItemActions,
  UploadListItemRender,
} from './types';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';
import { Progress } from '../Progress';

type UploadListProps = {
  /** Tracked rows, in value order. */
  entries: UploadEntry[];
  /** Replaces the default row rendering entirely. */
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
}: {
  entry: UploadEntry;
  actions: UploadListItemActions;
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
              aria-label={strings.remove}
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

export default function UploadList({
  entries,
  itemRender,
  onRemove,
  onRetry,
  onCancel,
}: UploadListProps) {
  return (
    <ul x-class={[listBase]}>
      {entries.map((entry) => {
        const actions = actionsFor(entry, onRemove, onRetry, onCancel);
        return (
          <li key={entry.uid} x-class={[itemBase]} data-status={entry.status}>
            {itemRender ? (
              itemRender(entry.file, entry.status, entry.percent, actions)
            ) : (
              <DefaultRow entry={entry} actions={actions} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type { UploadListProps };
