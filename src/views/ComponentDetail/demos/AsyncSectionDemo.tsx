import { useEffect, useRef, useState } from 'react';

import { AsyncSection, Button, Flex } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

type Phase = 'loading' | 'error' | 'content';

// ─── AsyncSection ──────────────────────────────────────────────
export default function AsyncSectionDemo() {
  // 模拟一次可重试的异步加载：loading → error →（重试）→ content。
  const [phase, setPhase] = useState<Phase>('loading');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (phase !== 'loading') return;
    timer.current = setTimeout(() => setPhase('error'), 1200);
    return () => clearTimeout(timer.current);
  }, [phase]);

  const retry = () => setPhase('loading');

  return (
    <>
      <h1>AsyncSection</h1>
      <p className={intro}>
        Loading / error / content in one place — the retry path shows the
        placeholder while the old error is still set.
      </p>

      <div className={section}>
        <h2>Retryable fetch</h2>
        <Flex gap='var(--haze-space-2)' direction='column'>
          <AsyncSection
            loading={phase === 'loading'}
            error={
              phase === 'error'
                ? new Error('Network request failed (simulated)')
                : null
            }
            onRetry={retry}
          >
            <p>Here is your data — loaded successfully.</p>
          </AsyncSection>
          <Flex gap='var(--haze-space-2)'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setPhase(phase === 'content' ? 'error' : 'content')}
            >
              {phase === 'content' ? 'Break the data' : 'Fix the data'}
            </Button>
            <Button size='sm' variant='ghost' onClick={retry}>
              Reload
            </Button>
          </Flex>
        </Flex>
      </div>

      <div className={section}>
        <h2>Custom copy</h2>
        <AsyncSection loading loadingText='Fetching report…'>
          <p>Never shown in this example</p>
        </AsyncSection>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AsyncSectionProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              The loading placeholder is announced politely — it renders as a
              status region, not an alert
            </li>
            <li>
              The Retry control is a real <code>&lt;button&gt;</code> in the
              tab order; the error box carries <strong>role=alert</strong>{' '}
              semantics through its alert-styled container
            </li>
            <li>
              Provide <code>errorText</code> when the thrown value has no
              useful <code>message</code>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='async-section' />
    </>
  );
}
