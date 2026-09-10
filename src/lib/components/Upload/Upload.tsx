import type { ReactNode, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type {
  UploadFileStatus,
  UploadHandle,
  UploadListItemRender,
  UploadRequest,
} from './types';

import { useControl } from 'react-use-control';

import UploadCore from './UploadCore';

type UploadProps = {
  /** Selected files; uncontrolled (accumulating internally) when omitted. */
  value?: ControlOrValue<File[]>;
  accept?: string;
  /** Renders the drag-and-drop drop area (default) or a plain
   * click-only picker area — see `UploadCoreProps.droppable`. */
  droppable?: boolean;
  /** Gatekeeper for every picked or dropped file — see
   * `UploadCoreProps.beforeUpload`. */
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  /** Cap for the committed list — see `UploadCoreProps.maxCount`. */
  maxCount?: number;
  multiple?: boolean;
  /** Custom upload executor — see `UploadCoreProps.request`. */
  request?: UploadRequest;
  /** Upload endpoint for the built-in XHR executor — see
   * `UploadCoreProps.action`. */
  action?: string;
  /** HTTP method for `action` uploads (default `POST`). */
  method?: string;
  /** Extra request headers for `action` uploads. */
  headers?: Record<string, string>;
  /** Form field name carrying the file in `action` mode (default `file`). */
  name?: string;
  /** Extra form fields appended alongside the file in `action` mode. */
  data?: Record<string, string | Blob>;
  /** Picks only enter the list; uploads start via the `UploadHandle`
   * ref — see `UploadCoreProps.manual`. */
  manual?: boolean;
  /** Built-in file list with progress and per-state actions — see
   * `UploadCoreProps.showUploadList`. */
  showUploadList?: boolean | { itemRender?: UploadListItemRender };
  /** Status-machine snapshot callback — see
   * `UploadCoreProps.onStatusChange`. */
  onStatusChange?: (files: UploadFileStatus[]) => void;
  /** Fires with the freshly picked files only — the accumulated list is
   * the `value` channel (or internal state when uncontrolled).
   * Removals and `clear()` do not fire this (they are not picks). */
  onChange?: (files: File[]) => void;
  className?: string;
  children?: ReactNode;
  ref?: Ref<UploadHandle>;
};

export default function Upload({
  value: valueControl,
  accept,
  droppable,
  beforeUpload,
  maxCount,
  multiple = false,
  request,
  action,
  method,
  headers,
  name,
  data,
  manual,
  showUploadList,
  onStatusChange,
  onChange,
  className,
  children,
  ref,
}: UploadProps) {
  const [files, setFiles] = useControl(valueControl, []);

  return (
    <UploadCore
      value={files}
      onChange={(next) => {
        const picked = next.filter((file) => !files.includes(file));
        setFiles(next);
        if (picked.length > 0) onChange?.(picked);
      }}
      accept={accept}
      droppable={droppable}
      beforeUpload={beforeUpload}
      maxCount={maxCount}
      multiple={multiple}
      request={request}
      action={action}
      method={method}
      headers={headers}
      name={name}
      data={data}
      manual={manual}
      showUploadList={showUploadList}
      onStatusChange={onStatusChange}
      className={className}
      ref={ref}
    >
      {children}
    </UploadCore>
  );
}

export type { UploadProps };
