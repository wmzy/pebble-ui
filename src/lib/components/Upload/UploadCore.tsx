import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { css } from '@linaria/core';
import { useRef, useState, useCallback, useEffect } from 'react';

import { useStrings } from '../LocaleProvider';

type UploadCoreProps = {
  /** The selected files — the field value, emitted verbatim (as the
   * complete next list) by `onChange`. */
  value: File[];
  /** Emits the next file list: a single pick replaces `value`, a
   * `multiple` pick appends to it. */
  onChange: (files: File[]) => void;
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
   * every verdict resolved; the UI is not blocked while waiting. */
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  /** Cap for the committed list. Applied last: existing entries win,
   * then the freshly picked survivors; anything beyond the first
   * `maxCount` entries is discarded silently. */
  maxCount?: number;
  /** A `multiple` pick appends to `value`, a single pick replaces it. */
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

export default function UploadCore({
  value,
  onChange,
  accept,
  droppable = true,
  beforeUpload,
  maxCount,
  multiple = false,
  className,
  children,
  ...rest
}: UploadCoreProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Transient drag-over highlight — hover-like UI state, never a
  // user-facing prop, so local state (not useControl) is correct here.
  const [dragOver, setDragOver] = useState(false);
  const strings = useStrings('upload');

  // Mirror the latest applied value so async beforeUpload verdicts
  // merge onto the freshest list instead of the one captured at pick
  // time (a parent may have committed another pick meanwhile).
  const latestValue = useRef(value);
  useEffect(() => {
    latestValue.current = value;
  });

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
    <div
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
          <div>{droppable ? strings.hint : strings.clickHint}</div>
        </>
      )}
    </div>
  );
}

export type { UploadCoreProps };
