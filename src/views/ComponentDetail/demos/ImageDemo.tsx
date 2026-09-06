import { Image } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

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
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='image' />
    </>
  );
}
