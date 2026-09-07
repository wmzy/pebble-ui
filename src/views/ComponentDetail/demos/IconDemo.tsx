import { Check, X, ChevronRight } from 'lucide-react';

import { Icon, Flex } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row, codeBlock } from '../styles';

import { CssVarsSection, StrokeSvg } from './shared';

function FillSvg() {
  return (
    <svg viewBox='0 0 24 24'>
      <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
    </svg>
  );
}

// ─── Icon ──────────────────────────────────────────────────────
export default function IconDemo() {
  return (
    <>
      <h1>Icon</h1>
      <p className={intro}>
        Wrapper for SVG icons with consistent sizing and color inheritance.
        Works with both fill-based and stroke-based SVGs, and integrates
        seamlessly with community icon libraries like Lucide, React Icons, and
        Phosphor.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Icon size='sm'>
            <StrokeSvg />
          </Icon>
          <Icon size='md'>
            <StrokeSvg />
          </Icon>
          <Icon size='lg'>
            <StrokeSvg />
          </Icon>
        </div>
      </div>

      <div className={section}>
        <h2>Fill vs Stroke</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Icon auto-detects stroke-based SVGs (those with{' '}
          <code>fill=&quot;none&quot;</code> or <code>stroke</code> attributes)
          and adjusts rendering accordingly. Fill-based SVGs work out of the
          box.
        </p>
        <div className={row}>
          <Flex gap='var(--haze-space-4)' style={{ alignItems: 'center' }}>
            <Flex gap='var(--haze-space-2)' style={{ alignItems: 'center' }}>
              <Icon size='lg'>
                <StrokeSvg />
              </Icon>
              <span
                style={{
                  fontSize: 'var(--haze-text-xs)',
                  color: 'var(--haze-color-text-muted)',
                }}
              >
                Stroke
              </span>
            </Flex>
            <Flex gap='var(--haze-space-2)' style={{ alignItems: 'center' }}>
              <Icon size='lg'>
                <FillSvg />
              </Icon>
              <span
                style={{
                  fontSize: 'var(--haze-text-xs)',
                  color: 'var(--haze-color-text-muted)',
                }}
              >
                Fill
              </span>
            </Flex>
          </Flex>
        </div>
      </div>

      <div className={section}>
        <h2>
          Using the <code>icon</code> Prop
        </h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Pass a component directly via the <code>icon</code> prop instead of
          wrapping it in children. When using <code>icon</code>, stroke mode is
          enabled by default to work with most community icon libraries.
        </p>
        <div className={row}>
          <Icon icon={StrokeSvg} size='sm' />
          <Icon icon={StrokeSvg} size='md' />
          <Icon icon={StrokeSvg} size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Community Icon Libraries</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Haze UI Icon is designed as a thin wrapper — it does not bundle any
          icons. Instead, pair it with your preferred icon library:
        </p>

        <h3
          style={{
            fontSize: 'var(--haze-text-sm)',
            fontWeight: 600,
            margin: 'var(--haze-space-4) 0 var(--haze-space-2)',
          }}
        >
          Lucide React
        </h3>
        <pre
          className={codeBlock}
        >{`import { Search, ChevronDown } from 'lucide-react';
import { Icon } from 'haze-ui';

// Using icon prop (recommended)
<Icon icon={Search} size="md" />

// Using children
<Icon size="sm"><Search /></Icon>`}</pre>

        <h3
          style={{
            fontSize: 'var(--haze-text-sm)',
            fontWeight: 600,
            margin: 'var(--haze-space-4) 0 var(--haze-space-2)',
          }}
        >
          React Icons
        </h3>
        <pre
          className={codeBlock}
        >{`import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { Icon } from 'haze-ui';

<Icon size="md"><FiSearch /></Icon>`}</pre>

        <h3
          style={{
            fontSize: 'var(--haze-text-sm)',
            fontWeight: 600,
            margin: 'var(--haze-space-4) 0 var(--haze-space-2)',
          }}
        >
          Phosphor Icons
        </h3>
        <pre
          className={codeBlock}
        >{`import { MagnifyingGlass } from '@phosphor-icons/react';
import { Icon } from 'haze-ui';

<Icon icon={MagnifyingGlass} size="md" />`}</pre>

        <h3
          style={{
            fontSize: 'var(--haze-text-sm)',
            fontWeight: 600,
            margin: 'var(--haze-space-4) 0 var(--haze-space-2)',
          }}
        >
          Inline SVG
        </h3>
        <pre className={codeBlock}>{`import { Icon } from 'haze-ui';

<Icon size="lg">
  <svg viewBox="0 0 24 24">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
  </svg>
</Icon>`}</pre>
      </div>

      <div className={section}>
        <h2>Using an Icon Library</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          For production apps, pair <code>Icon</code> with a maintained icon
          library — <code>lucide-react</code> (MIT) is a good default, with
          tree-shakable stroke icons:
        </p>
        <pre className={codeBlock}>{`pnpm add lucide-react`}</pre>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Every Lucide icon is a React component, so it plugs straight into
          the <code>icon</code> prop — no wrappers needed. <code>Icon</code>{' '}
          handles the rest automatically: stroke icons render with{' '}
          <code>fill: none</code>, color follows <code>currentColor</code>,
          and sizing comes from the <code>sm</code>/<code>md</code>/{' '}
          <code>lg</code> size tokens.
        </p>
        <div className={row}>
          <Flex gap='var(--haze-space-4)' style={{ alignItems: 'center' }}>
            <Flex gap='var(--haze-space-2)' style={{ alignItems: 'center' }}>
              <Icon icon={Check} size='lg' />
              <span
                style={{
                  fontSize: 'var(--haze-text-xs)',
                  color: 'var(--haze-color-text-muted)',
                }}
              >
                Check
              </span>
            </Flex>
            <Flex gap='var(--haze-space-2)' style={{ alignItems: 'center' }}>
              <Icon icon={X} size='lg' />
              <span
                style={{
                  fontSize: 'var(--haze-text-xs)',
                  color: 'var(--haze-color-text-muted)',
                }}
              >
                X
              </span>
            </Flex>
            <Flex gap='var(--haze-space-2)' style={{ alignItems: 'center' }}>
              <Icon icon={ChevronRight} size='lg' />
              <span
                style={{
                  fontSize: 'var(--haze-text-xs)',
                  color: 'var(--haze-color-text-muted)',
                }}
              >
                ChevronRight
              </span>
            </Flex>
          </Flex>
        </div>
        <pre className={codeBlock}>{`import { Check, X, ChevronRight } from 'lucide-react';
import { Icon } from 'haze-ui';

<Icon icon={Check} size="md" />
<Icon icon={X} size="md" />
<Icon icon={ChevronRight} size="md" />`}</pre>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='IconProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Has <strong>aria-hidden=&quot;true&quot;</strong> by default —
              decorative only
            </li>
            <li>
              For meaningful icons, add <strong>aria-label</strong> to the
              parent element
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='icon' />
    </>
  );
}
