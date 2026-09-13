import { css } from '@linaria/core';

import { Badge, Flex } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, codeBlock } from '../styles';

import { CssVarsSection } from './shared';

const note = css`
  max-width: 75ch;
  color: var(--haze-color-text-secondary);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);

  code {
    font-family: var(--haze-font-mono);
    font-size: var(--haze-text-xs);
  }
`;

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
        <h2>Space / Stack equivalents</h2>
        <p className={note}>
          haze-ui deliberately ships no separate <code>Space</code>,{' '}
          <code>Stack</code>, or <code>Group</code> component. Flexbox{' '}
          <code>gap</code> already covers every spacing layout those wrappers
          model — so one primitive composes them all:{' '}
          <code>Stack</code> is <code>Flex direction='column'</code> with a{' '}
          <code>gap</code>, <code>Group</code> is a row with a{' '}
          <code>gap</code>, and wrapping rows just add <code>wrap</code>. If
          you are migrating from a kit that exposes a dedicated spacer, map it
          onto the equivalents below.
        </p>

        <h3>Stack — vertical rhythm</h3>
        <Flex direction='column' gap='var(--haze-space-3)'>
          <Badge>First</Badge>
          <Badge variant='success'>Second</Badge>
          <Badge variant='info'>Third</Badge>
        </Flex>
        <pre className={codeBlock}>{`<Flex direction='column' gap='var(--haze-space-3)'>
  <Badge>First</Badge>
  <Badge>Second</Badge>
  <Badge>Third</Badge>
</Flex>`}</pre>

        <h3>Group — inline row</h3>
        <Flex gap='var(--haze-space-3)' align='center'>
          <Badge>Save</Badge>
          <Badge variant='success'>Publish</Badge>
          <Badge variant='danger'>Delete</Badge>
        </Flex>
        <pre className={codeBlock}>{`<Flex gap='var(--haze-space-3)' align='center'>
  <Badge>Save</Badge>
  <Badge variant='success'>Publish</Badge>
  <Badge variant='danger'>Delete</Badge>
</Flex>`}</pre>

        <h3>Wrap — rows that reflow</h3>
        <Flex wrap gap='var(--haze-space-2)'>
          <Badge>Tag 1</Badge>
          <Badge>Tag 2</Badge>
          <Badge>Tag 3</Badge>
          <Badge variant='success'>Tag 4</Badge>
          <Badge variant='success'>Tag 5</Badge>
          <Badge variant='success'>Tag 6</Badge>
          <Badge variant='warning'>Tag 7</Badge>
          <Badge variant='warning'>Tag 8</Badge>
          <Badge variant='warning'>Tag 9</Badge>
          <Badge variant='danger'>Tag 10</Badge>
          <Badge variant='danger'>Tag 11</Badge>
          <Badge variant='danger'>Tag 12</Badge>
        </Flex>
        <pre className={codeBlock}>{`<Flex wrap gap='var(--haze-space-2)'>
  <Badge>Tag 1</Badge>
  <Badge>Tag 2</Badge>
  <Badge>Tag 3</Badge>
  {/* …more items reflow onto new rows as width allows */}
</Flex>`}</pre>
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
