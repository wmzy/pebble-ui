import { FilePreview } from '@/lib/components/FilePreview';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection, noop } from './shared';

// ─── FilePreview ──────────────────────────────────────────────
export default function FilePreviewDemo() {
  return (
    <>
      <h1>FilePreview</h1>
      <p className={intro}>
        Attachment preview card: thumbnail for images, type icon + extension
        badge otherwise, with upload progress, error retry and remove actions.
      </p>

      <div className={section}>
        <h2>States</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
            maxWidth: 360,
          }}
        >
          <FilePreview
            file={{
              name: 'screenshot.png',
              size: 204800,
              type: 'image/png',
              url: 'https://placehold.co/96x96?text=PNG',
            }}
          />
          <FilePreview
            file={{ name: 'annual-report.pdf', size: 2_621_440 }}
            onRemove={noop}
          />
          <FilePreview
            file={{ name: 'dataset.csv', size: 15_728_640 }}
            status='uploading'
            progress={62}
            onRemove={noop}
          />
          <FilePreview
            file={{ name: 'archive.tar.gz', size: 512 }}
            status='error'
            onRetry={noop}
            onRemove={noop}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='FilePreviewProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Image thumbnails are decorative (<code>alt=&quot;&quot;</code>);
              the file name carries the meaning
            </li>
            <li>
              Remove/retry are icon buttons with <code>aria-label</code>{' '}
              (overridable per prop)
            </li>
            <li>
              Upload progress uses a <code>progressbar</code> role with value
              now/min/max
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='filepreview' />
    </>
  );
}
