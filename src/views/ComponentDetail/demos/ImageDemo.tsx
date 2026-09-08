import { Image } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Image ─────────────────────────────────────────────────────
export default function ImageDemo() {
  return (
    <>
      <h1>Image</h1>
      <p className={intro}>
        Enhanced image component with fallback and aspect ratio support.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 320 }}>
          <Image
            src='https://picsum.photos/640/360'
            alt='Sample landscape'
            aspectRatio='16/9'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Fallback</h2>
        <div style={{ maxWidth: 320 }}>
          <Image
            src='https://invalid-url.example'
            alt='Broken image'
            aspectRatio='16/9'
            fallback='Image failed to load'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Preview</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>preview</code> enables a fullscreen click-to-preview overlay:
          zoom 25%–400% (buttons, wheel, or drag to pan), rotate in 90°
          steps, <strong>Esc</strong> to close. Pass an object to opt out
          per control — <code>preview=&#123;&#123; rotate: false &#125;&#125;</code>{' '}
          keeps zoom and pan but drops the rotate button.
        </p>
        <div className={row}>
          <div style={{ maxWidth: 320 }}>
            <Image
              src='https://picsum.photos/640/360'
              alt='Clickable landscape opening the full preview'
              aspectRatio='16/9'
              preview
            />
          </div>
          <div style={{ maxWidth: 320 }}>
            <Image
              src='https://picsum.photos/360/640'
              alt='Clickable portrait with rotate disabled'
              aspectRatio='9/16'
              preview={{ rotate: false }}
            />
          </div>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ImageProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;img&gt;</strong> with required{' '}
              <strong>alt</strong> text
            </li>
            <li>Fallback content is visible to screen readers</li>
            <li>
              The preview overlay is a dialog closed with{' '}
              <strong>Esc</strong>; controls carry{' '}
              <strong>aria-label</strong>s
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='image' />
    </>
  );
}
