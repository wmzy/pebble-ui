import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { css } from '@linaria/core';
import { useRef, useCallback } from 'react';

import { useStrings } from '../LocaleProvider';

type UploadCoreProps = {
  /** The selected files — the field value, emitted verbatim (as the
   * complete next list) by `onChange`. */
  value: File[];
  /** Emits the next file list: a single pick replaces `value`, a
   * `multiple` pick appends to it. */
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<
  ComponentPropsWithoutRef<'div'>,
  | 'value'
  | 'onChange'
  | 'children'
  | 'onClick'
  | 'onDrop'
  | 'onDragOver'
  | 'role'
  | 'tabIndex'
>;

const dropzone = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--haze-space-8) var(--haze-space-4);
  border: 2px dashed var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg-subtle);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  cursor: pointer;
  transition: border-color var(--haze-duration-fast), background var(--haze-duration-fast);
  text-align: center;

  &:hover {
    border-color: var(--haze-color-primary);
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

export default function UploadCore({
  value,
  onChange,
  accept,
  multiple = false,
  className,
  children,
  ...rest
}: UploadCoreProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const strings = useStrings('upload');

  const commit = useCallback(
    (picked: File[]) => {
      if (picked.length === 0) return;
      onChange(multiple ? [...value, ...picked] : picked);
    },
    [value, multiple, onChange]
  );

  const handleClick = useCallback(() => {
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
      commit(Array.from(e.dataTransfer.files));
    },
    [commit]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      {...rest}
      x-class={[dropzone, className]}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        x-class={[hiddenInput]}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        // implementation detail of the dropzone (role="button"): hide it
        // from a11y tree and tab order; input.click() still opens the dialog
        hidden
      />
      {children || (
        <>
          <svg x-class={[iconStyle]} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>{strings.hint}</div>
        </>
      )}
    </div>
  );
}

export type { UploadCoreProps };
