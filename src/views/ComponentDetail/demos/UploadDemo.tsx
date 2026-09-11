import type { UploadHandle, UploadRequest, UploadStatus } from '@/lib/components/Upload';

import { useRef, useState } from 'react';

import { Upload, Button } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

const noteStyle = {
  fontSize: 'var(--haze-text-sm)',
  color: 'var(--haze-color-text-secondary)',
  margin: '0 0 var(--haze-space-3)',
} as const;

/** Simulated transport for the upload demos: reports progress every
 * 300ms and settles at 100% — files whose name contains "fail" take
 * the error path so retry is demoable. Honors the abort signal. */
const simulateRequest: UploadRequest = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let percent = 0;
    const timer = setInterval(() => {
      percent = Math.min(100, percent + 20);
      onProgress(percent);
      if (percent < 100) return;
      clearInterval(timer);
      if (file.name.toLowerCase().includes('fail')) {
        reject(new Error('rejected by server'));
      } else {
        resolve();
      }
    }, 300);
    signal.addEventListener('abort', () => {
      clearInterval(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

const statusText: Record<UploadStatus, string> = {
  idle: 'pending',
  uploading: 'uploading',
  success: 'done',
  error: 'failed',
};

// ─── Upload ─────────────────────────────────────────────────────
export default function UploadDemo() {
  const [files, setFiles] = useState<File[]>([]);
  const [gateMsg, setGateMsg] = useState('');
  const [gateFiles, setGateFiles] = useState<File[]>([]);
  const [committed, setCommitted] = useState(0);
  const [autoStatus, setAutoStatus] = useState('');
  const uploadRef = useRef<UploadHandle>(null);

  // Sync gate: return false to refuse a file outright. Async gates work
  // too — return a Promise<boolean> and the UI stays responsive until
  // the whole batch resolves.
  const sizeGate = (file: File) => {
    const ok = file.size <= 512 * 1024;
    setGateMsg(
      ok
        ? `Accepted ${file.name}`
        : `Rejected ${file.name} — ${Math.round(file.size / 1024)} KB exceeds the 512 KB limit`
    );
    return ok;
  };

  return (
    <>
      <h1>Upload</h1>
      <p className={intro}>File upload with drag and drop support.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 400 }}>
          <Upload accept='image/*' onChange={(f) => setFiles(f)} />
        </div>
        {files.length > 0 && (
          <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)', marginTop: 'var(--haze-space-2)' }}>
            Selected: {files.map((f) => f.name).join(', ')}
          </p>
        )}
      </div>

      <div className={section}>
        <h2>Click-only picker</h2>
        <p style={noteStyle}>
          <code>droppable</code> defaults to <code>true</code> (the dashed
          drop area above). Set <code>droppable=&#123;false&#125;</code> for
          a plain click-only picker area.
        </p>
        <div style={{ maxWidth: 400 }}>
          <Upload accept='image/*' droppable={false} />
        </div>
      </div>

      <div className={section}>
        <h2>beforeUpload gate</h2>
        <p style={noteStyle}>
          Every picked or dropped file passes <code>beforeUpload</code>{' '}
          after the <code>accept</code> filter — return <code>false</code>{' '}
          (or a rejected promise) to refuse it. Here files over 512 KB are
          rejected.
        </p>
        <div style={{ maxWidth: 400 }}>
          <Upload
            accept='image/*'
            beforeUpload={sizeGate}
            onChange={(f) => setGateFiles(f)}
          />
        </div>
        <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)', marginTop: 'var(--haze-space-2)' }}>
          {gateMsg || 'Pick a file to see the verdict…'}
          {gateFiles.length > 0 && ` — committed: ${gateFiles.map((f) => f.name).join(', ')}`}
        </p>
      </div>

      <div className={section}>
        <h2>maxCount</h2>
        <p style={noteStyle}>
          The pipeline runs <code>accept → beforeUpload → merge → maxCount</code>:
          existing entries are kept first, excess fresh files are dropped
          silently. This picker caps the list at three images.
        </p>
        <div style={{ maxWidth: 400 }}>
          <Upload
            accept='image/*'
            multiple
            maxCount={3}
            onChange={(f) => setCommitted((count) => count + f.length)}
          />
        </div>
        <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)', marginTop: 'var(--haze-space-2)', display: 'flex', alignItems: 'center', gap: 'var(--haze-space-3)' }}>
          Committed picks: {committed} / 3
          <Button
            size='sm'
            variant='outline'
            disabled={committed === 0}
            onClick={() => setCommitted(0)}
          >
            Reset counter
          </Button>
        </p>
      </div>

      <div className={section}>
        <h2>Auto upload with progress</h2>
        <p style={noteStyle}>
          Pass a <code>request</code> executor (or an <code>action</code> URL
          for the built-in XHR transport) and every pick uploads right away.
          <code> showUploadList</code> renders the built-in list: live
          progress, cancel while uploading, retry + remove on error. Pick a
          file with <code>fail</code> in its name to see the error path.
        </p>
        <div style={{ maxWidth: 400 }}>
          <Upload
            request={simulateRequest}
            multiple
            showUploadList
            onStatusChange={(statuses) =>
              setAutoStatus(
                statuses
                  .map((s) => `${s.file.name}: ${statusText[s.status]}${s.status === 'uploading' || s.status === 'error' ? ` (${s.percent}%)` : ''}`)
                  .join(' · ')
              )
            }
          />
        </div>
        <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)', marginTop: 'var(--haze-space-2)' }}>
          {autoStatus || 'Pick files to watch them upload…'}
        </p>
      </div>

      <div className={section}>
        <h2>Manual upload</h2>
        <p style={noteStyle}>
          <code>manual</code> keeps picks at <code>idle</code>; the{' '}
          <code>UploadHandle</code> ref (React 19 ref-as-prop) starts them —
          <code> uploadAll()</code> starts everything not in flight,{' '}
          <code>abort()</code> cancels in-flight uploads back to idle,{' '}
          <code>clear()</code> aborts and empties the list.
        </p>
        <div style={{ maxWidth: 400 }}>
          <Upload
            ref={uploadRef}
            request={simulateRequest}
            manual
            multiple
            showUploadList
          />
        </div>
        <p style={{ display: 'flex', gap: 'var(--haze-space-2)', marginTop: 'var(--haze-space-2)' }}>
          <Button size='sm' onClick={() => uploadRef.current?.uploadAll()}>
            Start upload
          </Button>
          <Button size='sm' variant='outline' onClick={() => uploadRef.current?.abort()}>
            Abort
          </Button>
          <Button size='sm' variant='outline' onClick={() => uploadRef.current?.clear()}>
            Clear
          </Button>
        </p>
      </div>

      <div className={section}>
        <h2>Custom itemRender</h2>
        <p style={noteStyle}>
          Replace whole rows with{' '}
          <code>showUploadList={'{{'} itemRender {'}}'}</code> — it receives
          the file, live status, percent and action callbacks
          (<code>remove</code> / <code>retry</code> / <code>cancel</code>).
        </p>
        <div style={{ maxWidth: 400 }}>
          <Upload
            request={simulateRequest}
            multiple
            showUploadList={{
              itemRender: (file, status, percent, actions) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--haze-space-3)' }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <code style={{ fontSize: 'var(--haze-text-xs)' }}>{statusText[status]}</code>
                  {(status === 'uploading' || status === 'error') && (
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{percent}%</span>
                  )}
                  {status === 'error' && (
                    <Button size='sm' variant='ghost' onClick={actions.retry}>
                      Retry
                    </Button>
                  )}
                  <Button size='sm' variant='ghost' onClick={actions.remove}>
                    Remove
                  </Button>
                </div>
              ),
            }}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Picture-card list</h2>
        <p style={noteStyle}>
          <code>{"listType='picture-card'"}</code> turns the built-in
          list into a grid of thumbnail cards: image files preview through
          object URLs (revoked when cards leave), other files fall back to a
          type icon. Uploading cards mask with the live percent; failed cards
          take a danger border and offer retry; hovering a card floats its
          remove button — <code>removeLabel</code> overrides the label (here{' '}
          <code>Delete image</code>). Pick or drop several files; a name
          containing <code>fail</code> takes the error path.
        </p>
        <div style={{ maxWidth: 480 }}>
          <Upload
            request={simulateRequest}
            multiple
            showUploadList
            listType='picture-card'
            removeLabel='Delete image'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Directory picker</h2>
        <p style={noteStyle}>
          <code>directory</code> forwards the non-standard{' '}
          <code>webkitdirectory</code> attribute to the hidden input — the
          native dialog picks whole folders and every file inside enters the
          list (combine with <code>multiple</code>). Dragging several files
          in at once works in every mode.
        </p>
        <div style={{ maxWidth: 480 }}>
          <Upload directory multiple showUploadList />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='UploadProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;button&quot;</strong> with <strong>tabIndex</strong></li>
            <li>Click or drag-and-drop to select files</li>
            <li>Hidden native <strong>&lt;input type=&quot;file&quot;&gt;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
