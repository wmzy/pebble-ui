import { Grid, GridItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Grid ──────────────────────────────────────────────────────
export default function GridDemo() {
  return (
    <>
      <h1>Grid</h1>
      <p className={intro}>CSS Grid layout with configurable columns and gap.</p>

      <div className={section}>
        <h2>Basic</h2>
        <Grid columns={3} gap={3}>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>1</div>
          </GridItem>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>2</div>
          </GridItem>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>3</div>
          </GridItem>
        </Grid>
      </div>

      <div className={section}>
        <h2>Spanning Columns</h2>
        <Grid columns={4} gap={3}>
          <GridItem span={2}>
            <div style={{ background: 'var(--haze-color-primary-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>span 2</div>
          </GridItem>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>1</div>
          </GridItem>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>1</div>
          </GridItem>
          <GridItem span={1} start={1}>
            <div style={{ background: 'var(--haze-color-bg-muted)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>start 1</div>
          </GridItem>
        </Grid>
      </div>

      <div className={section}>
        <h2>Grid Props</h2>
        <PropsTable of='GridProps' />
      </div>

      <div className={section}>
        <h2>GridItem Props</h2>
        <PropsTable of='GridItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely presentational — uses plain <strong>&lt;div&gt;</strong> elements
            </li>
            <li>
              No semantic meaning; add <strong>role</strong> if the grid conveys structure
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='grid' />
    </>
  );
}
