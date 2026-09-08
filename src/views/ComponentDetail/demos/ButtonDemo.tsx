import type { CSSProperties } from 'react';

import { Button, ButtonLink, Icon } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection, StrokeSvg } from './shared';

// Component-level tokens: set --haze-button-* on any ancestor to retheme
// the buttons inside (sizes that aren't overridden keep their fallbacks).
const tokenScope = {
  '--haze-button-height-md': '3rem',
  '--haze-button-font-size-md': 'var(--haze-text-base)',
  '--haze-button-radius': '999px',
} as CSSProperties;

// ─── Button ────────────────────────────────────────────────────
export default function ButtonDemo() {
  return (
    <>
      <h1>Button</h1>
      <p className={intro}>Trigger actions with configurable style and size.</p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row}>
          <Button variant='solid'>Solid</Button>
          <Button variant='outline'>Outline</Button>
          <Button variant='ghost'>Ghost</Button>
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Button size='sm'>Small</Button>
          <Button size='md'>Medium</Button>
          <Button size='lg'>Large</Button>
        </div>
      </div>

      <div className={section}>
        <h2>Component-level tokens</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Buttons read <code>--haze-button-*</code> custom properties with
          global-token fallbacks, so an ancestor can retheme just the
          buttons it wraps: this container sets{' '}
          <code>--haze-button-height-md</code>,{' '}
          <code>--haze-button-font-size-md</code> and{' '}
          <code>--haze-button-radius</code> — medium buttons inside grow
          and go pill-shaped, while the small one keeps its height (only
          the size-less radius reaches it). Set them on{' '}
          <code>:root</code> instead to retheme every button at once.
        </p>
        <div className={row} style={tokenScope}>
          <Button size='md'>Scoped Medium</Button>
          <Button size='md' variant='outline'>
            Scoped Outline
          </Button>
          <Button size='sm' variant='ghost'>
            Small (height untouched)
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Square (Icon Button)</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Use <code>square</code> for icon-only buttons with equal padding on
          all sides.
        </p>
        <div className={row}>
          <Button size='sm' square variant='solid'>
            <Icon size='sm'>
              <StrokeSvg />
            </Icon>
          </Button>
          <Button size='md' square variant='solid'>
            <Icon size='sm'>
              <StrokeSvg />
            </Icon>
          </Button>
          <Button size='lg' square variant='solid'>
            <Icon size='md'>
              <StrokeSvg />
            </Icon>
          </Button>
          <Button size='sm' square variant='outline'>
            <Icon size='sm'>
              <StrokeSvg />
            </Icon>
          </Button>
          <Button size='sm' square variant='ghost'>
            <Icon size='sm'>
              <StrokeSvg />
            </Icon>
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={row}>
          <Button disabled>Disabled Solid</Button>
          <Button variant='outline' disabled>
            Disabled Outline
          </Button>
          <Button variant='ghost' disabled>
            Disabled Ghost
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>ButtonLink — a real anchor with the Button skin</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Navigation that must look like a button: <code>ButtonLink</code>{' '}
          renders a native <code>&lt;a&gt;</code> (href, ⌘/middle-click,
          crawlers) wearing the same variants/sizes. Anchors have no{' '}
          <code>disabled</code> attribute — report the state with{' '}
          <code>aria-disabled</code> plus <code>tabIndex=&#123;-1&#125;</code>.
        </p>
        <div className={row}>
          <ButtonLink href='#button'>Link Solid</ButtonLink>
          <ButtonLink href='#button' variant='outline'>
            Link Outline
          </ButtonLink>
          <ButtonLink href='#button' variant='ghost'>
            Link Ghost
          </ButtonLink>
          <ButtonLink href='#button' variant='outline' aria-disabled tabIndex={-1}>
            Link Disabled
          </ButtonLink>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ButtonProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native <strong>&lt;button&gt;</strong> with{' '}
              <strong>type=&quot;button&quot;</strong>
            </li>
            <li>
              Supports <strong>Tab</strong> focus and <strong>Enter</strong>/
              <strong>Space</strong> activation
            </li>
            <li>
              Disabled state uses <strong>disabled</strong> attribute, removing
              from tab order
            </li>
            <li>
              Focus ring via <strong>:focus-visible</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='button' />
    </>
  );
}
