import { useState } from 'react';

import { Upload } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Upload ─────────────────────────────────────────────────────
export default function UploadDemo() {
  const [files, setFiles] = useState<File[]>([]);

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
