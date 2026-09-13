import type { CSSProperties } from 'react';

import { Carousel, CarouselSlide } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

const slideBody = (background: string): CSSProperties => ({
  height: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background,
  borderRadius: 'var(--haze-radius-md)',
});

const backgrounds = [
  'var(--haze-color-bg-subtle)',
  'var(--haze-color-bg-muted)',
  'var(--haze-color-primary-subtle)',
];

function DemoSlides() {
  return (
    <>
      {backgrounds.map((bg, i) => (
        <CarouselSlide key={bg}>
          <div style={slideBody(bg)}>Slide {i + 1}</div>
        </CarouselSlide>
      ))}
    </>
  );
}

// ─── Carousel ──────────────────────────────────────────────────
export default function CarouselDemo() {
  return (
    <>
      <h1>Carousel</h1>
      <p className={intro}>
        Slide-based content viewer with navigation and indicators. Drag the
        track with the mouse to page (release past a quarter of the track
        width flips, below snaps back).
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 480 }}>
          <Carousel>
            <DemoSlides />
          </Carousel>
        </div>
      </div>

      <div className={section}>
        <h2>Effect: fade</h2>
        <p className={intro}>
          Slides cross-fade in place instead of scrolling. The track stacks
          every slide in one grid cell, so its height follows the tallest
          slide; inactive slides are <code>inert</code> (hidden from
          assistive tech and not focusable).
        </p>
        <div style={{ maxWidth: 480 }}>
          <Carousel effect="fade">
            <DemoSlides />
          </Carousel>
        </div>
      </div>

      <div className={section}>
        <h2>Auto-play with pause on hover</h2>
        <p className={intro}>
          <code>pauseOnHover</code> freezes the countdown while the pointer
          hovers — or while focus stays inside, per WCAG 2.2.1 — and resumes
          with the remaining time budget instead of restarting the interval.
          Dragging pauses too.
        </p>
        <div style={{ maxWidth: 480 }}>
          <Carousel autoPlay interval={3000} pauseOnHover>
            <DemoSlides />
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
            <li>
              Arrow keys step slides (mirrored under{' '}
              <strong>dir=&quot;rtl&quot;</strong>); Home/End jump to the
              ends. Touch keeps the native scroll-snap track — mouse-only
              drag paging never hijacks it.
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='carousel' />
    </>
  );
}
