// Direct component import until the barrel wiring lands with the Wave 3
// shared-file patches (DescriptionsDemo/JsonViewDemo precedent).
import { QRCode } from '@/lib/components/QRCode';

import PropsTable from '../PropsTable';
import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── QRCode ─────────────────────────────────────────────────────
export default function QRCodeDemo() {
  return (
    <>
      <h1>QRCode</h1>
      <p className={intro}>
        QR codes rendered as a single crisp SVG path — colors follow the theme
        tokens until overridden. Requires the optional <code>qrcode</code> peer
        dependency.
      </p>

      <div className={section}>
        <h2>Basic</h2>
        <QRCode value='https://github.com/wmzy/haze-ui' />
      </div>

      <div className={section}>
        <h2>Without Border</h2>
        <QRCode value='https://github.com/wmzy/haze-ui' bordered={false} />
      </div>

      <div className={section}>
        <h2>Error Correction Level &amp; Size</h2>
        <div style={{ display: 'flex', gap: 'var(--haze-space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <QRCode value='https://github.com/wmzy/haze-ui' level='L' size={96} />
          <QRCode value='https://github.com/wmzy/haze-ui' level='M' size={96} />
          <QRCode value='https://github.com/wmzy/haze-ui' level='Q' size={96} />
          <QRCode value='https://github.com/wmzy/haze-ui' level='H' size={96} />
        </div>
      </div>

      <div className={section}>
        <h2>Custom Colors</h2>
        <div style={{ display: 'flex', gap: 'var(--haze-space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <QRCode value='https://github.com/wmzy/haze-ui' modulesColor='#0e7490' bgColor='#ecfeff' />
          <QRCode value='https://github.com/wmzy/haze-ui' modulesColor='#7c2d12' bgColor='#fff7ed' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='QRCodeProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              The svg is <strong>role=&quot;img&quot;</strong> with the encoded <strong>&quot;value&quot;</strong> as its accessible name — screen readers announce what the code contains
            </li>
            <li>
              Native props land on the wrapper div — <strong>aria-hidden</strong> there silences the graphic, a wrapper link makes it clickable
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='qrcode' />
    </>
  );
}
