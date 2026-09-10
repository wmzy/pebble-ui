import type { UploadRequest, UploadRequestOptions } from './types';

type XhrUploadConfig = {
  /** Upload endpoint URL. */
  action: string;
  /** HTTP method — defaults to `POST`. */
  method?: string;
  /** Extra request headers. */
  headers?: Record<string, string>;
  /** Form field name carrying the file — defaults to `file`. */
  name?: string;
  /** Extra form fields appended alongside the file. */
  data?: Record<string, string | Blob>;
};

/** Builds the executor used when only `action` (plus optional
 * `method`/`headers`/`name`/`data`) is given: a multipart FormData
 * upload via XHR with progress wired to `xhr.upload.onprogress` and
 * abort wired to `xhr.abort()`. */
function createXhrRequest(config: XhrUploadConfig): UploadRequest {
  return (file: File, options: UploadRequestOptions) =>
    new Promise<void>((resolve, reject) => {
      if (options.signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append(config.name ?? 'file', file);
      if (config.data) {
        for (const [key, value] of Object.entries(config.data)) {
          form.append(key, value);
        }
      }
      xhr.open(config.method ?? 'POST', config.action);
      if (config.headers) {
        for (const [key, value] of Object.entries(config.headers)) {
          xhr.setRequestHeader(key, value);
        }
      }
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new TypeError('Network error'));
      xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
      options.signal.addEventListener(
        'abort',
        () => {
          xhr.abort();
        },
        { once: true }
      );
      xhr.send(form);
    });
}

export type { XhrUploadConfig };
export { createXhrRequest };
