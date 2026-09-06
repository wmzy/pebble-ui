import { Carousel, CarouselSlide } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Carousel ──────────────────────────────────────────────────
export default function CarouselDemo() {
  return (
    <>
      <h1>Carousel</h1>
      <p className={intro}>
        Slide-based content viewer with navigation and indicators.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 480 }}>
          <Carousel>
            <CarouselSlide>
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--haze-color-bg-subtle)',
                  borderRadius: 'var(--haze-radius-md)',
                }}
              >
                Slide 1
              </div>
            </CarouselSlide>
            <CarouselSlide>
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--haze-color-bg-muted)',
                  borderRadius: 'var(--haze-radius-md)',
                }}
              >
                Slide 2
              </div>
            </CarouselSlide>
            <CarouselSlide>
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--haze-color-primary-subtle)',
                  borderRadius: 'var(--haze-radius-md)',
                }}
              >
                Slide 3
              </div>
            </CarouselSlide>
          </Carousel>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CarouselProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;region&quot;</strong> with{' '}
              <strong>aria-roledescription=&quot;carousel&quot;</strong>
            </li>
            <li>
              Slides have <strong>role=&quot;group&quot;</strong> with{' '}
              <strong>aria-roledescription=&quot;slide&quot;</strong>
            </li>
            <li>
              Navigation buttons have <strong>aria-label</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='carousel' />
    </>
  );
}
