import { useState } from 'react';

import { Button, Tag } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── Tag ───────────────────────────────────────────────────────
export default function TagDemo() {
  const [tags, setTags] = useState(['React', 'TypeScript', 'Linaria']);

  return (
    <>
      <h1>Tag</h1>
      <p className={intro}>
        Interactive labels for categorization and filtering.
      </p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row}>
          <Tag variant='default'>Default</Tag>
          <Tag variant='primary'>Primary</Tag>
          <Tag variant='success'>Success</Tag>
          <Tag variant='warning'>Warning</Tag>
          <Tag variant='danger'>Danger</Tag>
        </div>
      </div>

      <div className={section}>
        <h2>Closable</h2>
        <div className={row}>
          {tags.map((t) => (
            <Tag
              key={t}
              closable
              onClose={() => setTags((prev) => prev.filter((x) => x !== t))}
            >
              {t}
            </Tag>
          ))}
          {tags.length === 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setTags(['React', 'TypeScript', 'Linaria'])}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TagProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Close button has <strong>aria-label=&quot;Remove&quot;</strong>
            </li>
            <li>
              Close button is keyboard accessible via <strong>Tab</strong> +{' '}
              <strong>Enter</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tag' />
    </>
  );
}
