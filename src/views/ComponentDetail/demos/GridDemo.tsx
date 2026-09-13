import { Grid, GridItem, ResizableGroup, ResizableHandle, ResizablePanel } from '@/lib';

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
        <h2>Container-query Responsive</h2>
        <p>
          With <code>responsive</code>, the grid becomes a container-query context and
          GridItem <code>sm</code>/<code>md</code>/<code>lg</code> spans react to the grid's
          own width — not the viewport. Breakpoints (container width):{' '}
          <code>sm</code> ≥ 384px, <code>md</code> ≥ 576px, <code>lg</code> ≥ 768px.
          Each card asks for <code>span 12 / sm 6 / md 4 / lg 3</code>: stacked
          full-width below 384px, 2 per row at sm, 3 per row at md, 4 per row at lg.
          Drag the handle to resize the grid and watch the cards reflow.
        </p>
        <div style={{ height: 280, border: '1px solid var(--haze-color-border)', borderRadius: 'var(--haze-radius-md)' }}>
          <ResizableGroup>
            <ResizablePanel defaultSize={55}>
              <Grid responsive columns={12} gap={3}>
                {[1, 2, 3, 4].map((n) => (
                  <GridItem key={n} span={12} sm={6} md={4} lg={3}>
                    <div style={{ background: 'var(--haze-color-primary-subtle)', padding: 'var(--haze-space-3)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center', fontSize: 'var(--haze-text-sm)' }}>
                      {n} · span 12 / sm 6 / md 4 / lg 3
                    </div>
                  </GridItem>
                ))}
              </Grid>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={45}>
              <div style={{ padding: 'var(--haze-space-3)', height: '100%', fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-muted)' }}>
                Drag the separator ←→ to change the grid container's width. The
                layout is driven by container queries, so the same Grid responds
                to its own box — sidebar, panel, or card — regardless of the
                viewport.
              </div>
            </ResizablePanel>
          </ResizableGroup>
        </div>
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
