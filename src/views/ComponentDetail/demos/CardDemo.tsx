import { Card } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Card ──────────────────────────────────────────────────────
export default function CardDemo() {
  return (
    <>
      <h1>Card</h1>
      <p className={intro}>
        Container for grouping related content with visual separation.
      </p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row} style={{ alignItems: 'stretch' }}>
          <Card variant='elevated'>
            <h3 style={{ margin: '0 0 4px' }}>Elevated</h3>
            <p
              style={{
                margin: 0,
                color: 'var(--haze-color-text-secondary)',
                fontSize: 'var(--haze-text-sm)',
              }}
            >
              Shadow-based elevation.
            </p>
          </Card>
          <Card variant='outlined'>
            <h3 style={{ margin: '0 0 4px' }}>Outlined</h3>
            <p
              style={{
                margin: 0,
                color: 'var(--haze-color-text-secondary)',
                fontSize: 'var(--haze-text-sm)',
              }}
            >
              Border-based separation.
            </p>
          </Card>
          <Card variant='filled'>
            <h3 style={{ margin: '0 0 4px' }}>Filled</h3>
            <p
              style={{
                margin: 0,
                color: 'var(--haze-color-text-secondary)',
                fontSize: 'var(--haze-text-sm)',
              }}
            >
              Background-based distinction.
            </p>
          </Card>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CardProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a <strong>&lt;div&gt;</strong> — add{' '}
              <strong>role</strong> and <strong>aria-label</strong> if the card
              represents a distinct landmark
            </li>
            <li>Purely presentational by default</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='card' />
    </>
  );
}
