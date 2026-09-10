import { css } from '@linaria/core';

import { Badge } from '@/lib';
import { badgeVariants, badgeSizes } from '@/lib/components/Badge';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// Composition demo: wear the exported skin pieces on a custom element.
const brandedCompose = css`
  border: 1px solid var(--haze-color-primary);
`;

// ─── Badge ─────────────────────────────────────────────────────
export default function BadgeDemo() {
  return (
    <>
      <h1>Badge</h1>
      <p className={intro}>
        Small status indicators for labeling and categorization.
      </p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row}>
          <Badge variant='default'>Default</Badge>
          <Badge variant='success'>Success</Badge>
          <Badge variant='warning'>Warning</Badge>
          <Badge variant='danger'>Danger</Badge>
          <Badge variant='info'>Info</Badge>
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Badge size='sm'>Small</Badge>
          <Badge size='md'>Medium</Badge>
        </div>
      </div>

      <div className={section}>
        <h2>Composing with badgeVariants / badgeSizes</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          The exported <code>badgeVariants</code> /{' '}
          <code>badgeSizes</code> maps carry the exact skin classes{' '}
          <code>Badge</code> wears — spread them onto any custom element
          (same shape and rationale as Button&apos;s{' '}
          <code>buttonVariants</code>). This span composes the{' '}
          <code>info</code> variant with the <code>sm</code> size and one
          custom class on top.
        </p>
        <div className={row}>
          <span
            className={`${badgeVariants.info} ${badgeSizes.sm} ${brandedCompose}`}
          >
            Composed span
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BadgeProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a <strong>&lt;span&gt;</strong> — purely decorative
            </li>
            <li>
              Add <strong>aria-label</strong> if the badge conveys meaning not
              present in surrounding text
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='badge' />
    </>
  );
}
