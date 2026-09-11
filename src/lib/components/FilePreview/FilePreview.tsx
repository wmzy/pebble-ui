import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

import { Progress } from '../Progress';

import { formatFileSize, getFileExtension } from './file-preview-format';

/** The attached file's descriptor — name plus optional metadata. */
type FilePreviewFile = {
  name: string;
  /** Size in bytes; formatted via KB/MB when present. */
  size?: number;
  /** MIME type; `image/*` with a `url` renders a thumbnail. */
  type?: string;
  url?: string;
};

type FilePreviewStatus = 'uploading' | 'uploaded' | 'error';

type FilePreviewProps = {
  file: FilePreviewFile;
  /** Lifecycle of the attachment; drives progress, status text, retry. */
  status?: FilePreviewStatus;
  /** 0–100 upload progress, clamped; shown while `status` is `uploading`. */
  progress?: number;
  /** Rendering the remove action; only shown when provided. */
  onRemove?: () => void;
  /** Rendering the retry action; only shown in the `error` status. */
  onRetry?: () => void;
  /** Remove button label. Default from `filePreview.remove`. */
  removeLabel?: string;
  /** Retry button label. Default from `filePreview.retry`. */
  retryLabel?: string;
  /** Status text while `status` is `uploading`. Default from `filePreview.uploading`. */
  uploadingLabel?: string;
  /** Status text once `status` is `uploaded`. Default from `filePreview.uploaded`. */
  uploadedLabel?: string;
  /** Status text when `status` is `error`. Default from `filePreview.error`. */
  errorLabel?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const card = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--haze-space-3);
  padding: var(--haze-space-2) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  font-family: var(--haze-font-sans);
  max-width: 22rem;
`;

const thumbWrap = css`
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  border-radius: var(--haze-radius-sm);
  overflow: hidden;
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const thumb = css`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const extBadge = css`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-family: var(--haze-font-mono);
  font-size: 0.5rem;
  line-height: var(--haze-leading-tight);
  text-align: center;
  padding: 0 var(--haze-space-1);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const info = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-1);
`;

const nameClass = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const meta = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: var(--haze-space-2);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

const statusUploading = css`
  color: var(--haze-color-text-muted);
`;

const statusError = css`
  color: var(--haze-color-danger);
`;

const srOnly = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const actions = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-1);
  margin-inline-start: auto;
`;

const actionBtn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: var(--haze-radius-sm);
  background: none;
  color: var(--haze-color-text-muted);
  cursor: pointer;
  transition: color var(--haze-duration-fast) var(--haze-ease);

  &:hover {
    color: var(--haze-color-text);
  }
`;

const actionBtnRetry = css`
  &:hover {
    color: var(--haze-color-primary);
  }
`;

const progressRow = css`
  flex-basis: 100%;
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
`;

const percentClass = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  flex-shrink: 0;
`;

/** Explicit width/height: a viewBox-only inline svg contributes zero
 * content size in flex containers and collapses to 0×0. */
const FileGlyph = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.25'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M9 1.5H4A1.5 1.5 0 0 0 2.5 3v10A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V6L9 1.5Z' />
    <path d='M9 1.5V6h4.5' />
  </svg>
);

const CheckGlyph = () => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 12 12'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M2 6.5 4.8 9.2 10 3.5' />
  </svg>
);

const RetryGlyph = () => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 12 12'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M10.5 6a4.5 4.5 0 1 1-1.32-3.18' />
    <path d='M10.5 1v2.5H8' />
  </svg>
);

const RemoveGlyph = () => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 12 12'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    strokeLinecap='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M2.5 2.5l7 7M9.5 2.5l-7 7' />
  </svg>
);

export default function FilePreview({
  file,
  status = 'uploaded',
  progress,
  onRemove,
  onRetry,
  removeLabel,
  retryLabel,
  uploadingLabel,
  uploadedLabel,
  errorLabel,
  className,
  ...rest
}: FilePreviewProps) {
  const strings = useStrings('filePreview');
  const resolvedRemoveLabel = removeLabel ?? strings.remove;
  const resolvedRetryLabel = retryLabel ?? strings.retry;
  const resolvedUploadingLabel = uploadingLabel ?? strings.uploading;
  const resolvedUploadedLabel = uploadedLabel ?? strings.uploaded;
  const resolvedErrorLabel = errorLabel ?? strings.error;
  const isImage = file.type?.startsWith('image/') ?? false;
  const showThumb = isImage && file.url !== undefined;
  const extension = showThumb ? '' : getFileExtension(file.name);
  const sizeText = formatFileSize(file.size);
  const clamped =
    progress === undefined
      ? undefined
      : Math.max(0, Math.min(100, progress));

  return (
    <div x-class={[card, className]} {...rest}>
      {showThumb ? (
        <img x-class={[thumb]} src={file.url} alt='' loading='lazy' />
      ) : (
        <span x-class={[thumbWrap]}>
          <FileGlyph />
          {extension && (
            <span x-class={[extBadge]} aria-hidden='true'>
              {extension}
            </span>
          )}
        </span>
      )}
      <div x-class={[info]}>
        <span x-class={[nameClass]} title={file.name}>
          {file.name}
        </span>
        <div x-class={[meta]}>
          {sizeText && <span>{sizeText}</span>}
          {status === 'uploading' && (
            <span x-class={[statusUploading]}>{resolvedUploadingLabel}</span>
          )}
          {status === 'uploaded' && (
            <span x-class={[statusUploading]}>
              <CheckGlyph />
              <span x-class={[srOnly]}>{resolvedUploadedLabel}</span>
            </span>
          )}
          {status === 'error' && <span x-class={[statusError]}>{resolvedErrorLabel}</span>}
        </div>
      </div>
      {(onRemove || (status === 'error' && onRetry)) && (
        <div x-class={[actions]}>
          {status === 'error' && onRetry && (
            <button
              type='button'
              aria-label={resolvedRetryLabel}
              onClick={onRetry}
              x-class={[actionBtn, actionBtnRetry]}
            >
              <RetryGlyph />
            </button>
          )}
          {onRemove && (
            <button
              type='button'
              aria-label={resolvedRemoveLabel}
              onClick={onRemove}
              x-class={[actionBtn]}
            >
              <RemoveGlyph />
            </button>
          )}
        </div>
      )}
      {status === 'uploading' && (
        <div x-class={[progressRow]}>
          <Progress value={clamped ?? 0} size='sm' />
          {clamped !== undefined && (
            <span x-class={[percentClass]}>{Math.round(clamped)}%</span>
          )}
        </div>
      )}
    </div>
  );
}

export type { FilePreviewProps, FilePreviewFile, FilePreviewStatus };
