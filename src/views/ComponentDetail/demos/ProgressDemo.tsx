import { Progress } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Progress ──────────────────────────────────────────────────
export default function ProgressDemo() {
  return (
    <>
      <h1>Progress</h1>
      <p className={intro}>Visual indicator of completion percentage.</p>

      <div className={section}>
        <h2>Bar Variants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)', maxWidth: 400 }}>
          <Progress value={25} />
          <Progress value={50} color='success' />
          <Progress value={75} color='warning' />
          <Progress value={90} color='danger' />
        </div>
      </div>

      <div className={section}>
        <h2>Bar Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)', maxWidth: 400 }}>
          <Progress value={60} size='sm' />
          <Progress value={60} size='md' />
          <Progress value={60} size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Circle Variant</h2>
        <div className={row}>
          <Progress variant='circle' value={30} size='sm' />
          <Progress variant='circle' value={60} />
          <Progress variant='circle' value={90} size='lg' color='success' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ProgressProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;progressbar&quot;</strong> with{' '}
              <strong>aria-valuemin</strong>, <strong>aria-valuemax</strong>,{' '}
              <strong>aria-valuenow</strong>
            </li>
            <li>
              Screen readers announce current progress percentage
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='progress' />
    </>
  );
}
