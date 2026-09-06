import { useState } from 'react';

import { Button, StreamingText } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── StreamingText ────────────────────────────────────────────
export default function StreamingTextDemo() {
  const [key, setKey] = useState(0);

  return (
    <>
      <h1>StreamingText</h1>
      <p className={intro}>
        Typewriter effect that reveals text character by character with an
        optional blinking cursor.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <StreamingText
          key={key}
          text='Hello! This text appears one character at a time, simulating a streaming response from an AI assistant.'
          speed={25}
        />
        <div className={row} style={{ marginTop: 'var(--haze-space-3)' }}>
          <Button size='sm' variant='outline' onClick={() => setKey((k) => k + 1)}>
            Replay
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='StreamingTextProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Cursor animation uses <strong>animation: blink</strong> with
              step-end timing
            </li>
            <li>
              Respects <strong>prefers-reduced-motion</strong> via CSS
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='streamingtext' />
    </>
  );
}
