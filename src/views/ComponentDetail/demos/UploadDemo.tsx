import { useState } from 'react';

import { Upload, Button } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

const noteStyle = {
  fontSize: 'var(--haze-text-sm)',
  color: 'var(--haze-color-text-secondary)',
  margin: '0 0 var(--haze-space-3)',
} as const;

// ─── Upload ─────────────────────────────────────────────────────
export default function UploadDemo() {
  const [files, setFiles] = useState<File[]>([]);
  const [gateMsg, setGateMsg] = useState('');
  const [gateFiles, setGateFiles] = useState<File[]>([]);
  const [committed, setCommitted] = useState(0);

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
