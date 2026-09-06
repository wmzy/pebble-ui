import { Badge, Flex } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Flex ──────────────────────────────────────────────────────
export default function FlexDemo() {
  return (
    <>
      <h1>Flex</h1>
      <p className={intro}>Shorthand layout component for flexbox patterns.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Flex gap='var(--haze-space-3)' align='center'>
          <Badge>Item 1</Badge>
          <Badge variant='success'>Item 2</Badge>
          <Badge variant='info'>Item 3</Badge>
        </Flex>
      </div>

      <div className={section}>
        <h2>Column</h2>
        <Flex direction='column' gap='var(--haze-space-2)'>
          <Badge>Row A</Badge>
          <Badge variant='warning'>Row B</Badge>
        </Flex>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='FlexProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a plain <strong>&lt;div&gt;</strong> — purely
              presentational
            </li>
            <li>
              No semantic meaning; add <strong>role</strong> if needed
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='flex' />
    </>
  );
}
