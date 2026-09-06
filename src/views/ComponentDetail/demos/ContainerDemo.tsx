import { Container } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Container ──────────────────────────────────────────────────
export default function ContainerDemo() {
  return (
    <>
      <h1>Container</h1>
      <p className={intro}>Centered content container with max-width breakpoints.</p>

      <div className={section}>
        <h2>Sizes</h2>
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ marginBottom: 'var(--haze-space-3)' }}>
            <Container size={size}>
              <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-3)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>
                Size: {size}
              </div>
            </Container>
          </div>
        ))}
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ContainerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as a plain <strong>&lt;div&gt;</strong></li>
            <li>Purely presentational layout component</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
