import { css } from '@linaria/core';

import { Title, Text, Paragraph } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

// Constrained width so the truncation demos actually have something to clip.
const narrow = css`
  max-width: 18rem;
  padding: var(--haze-space-3);
  border: 1px dashed var(--haze-color-border);
  border-radius: var(--haze-radius-md);
`;

// ─── Typography ─────────────────────────────────────────────────
export default function TypographyDemo() {
  return (
    <>
      <h1>Typography</h1>
      <p className={intro}>Title, Text, and Paragraph components for consistent typography.</p>

      <div className={section}>
        <h2>Title</h2>
        <Title level={1}>Heading Level 1</Title>
        <Title level={2}>Heading Level 2</Title>
        <Title level={3}>Heading Level 3</Title>
        <Title level={4}>Heading Level 4</Title>
        <Title level={5}>Heading Level 5</Title>
      </div>

      <div className={section}>
        <h2>Text</h2>
        <div className={row}>
          <Text>Default text</Text>
          <Text type='secondary'>Secondary text</Text>
          <Text type='muted'>Muted text</Text>
          <Text strong>Bold text</Text>
          <Text code>inline code</Text>
          <Text mark>Highlighted</Text>
        </div>
      </div>

      <div className={section}>
        <h2>Paragraph</h2>
        <Paragraph>This is a paragraph component with relaxed line height and bottom margin.</Paragraph>
        <Paragraph>Another paragraph follows naturally.</Paragraph>
      </div>

      <div className={section}>
        <h2>Ellipsis</h2>
        <div className={row}>
          <div className={narrow}>
            <Text ellipsis>Single-line truncation; the full text rides along in the native title attribute.</Text>
          </div>
          <div className={narrow}>
            <Text ellipsis type='secondary'>Secondary clamped text uses the same pure-CSS truncation.</Text>
          </div>
        </div>
        <div className={narrow} style={{ marginTop: 'var(--haze-space-3)' }}>
          <Paragraph ellipsis={{ lines: 2 }}>
            Multi-line truncation clamps this paragraph to two lines via line-clamp;
            hover reveals the full content through the title fallback.
          </Paragraph>
        </div>
      </div>

      <div className={section}>
        <h2>Title Props</h2>
        <PropsTable of='TitleProps' />
      </div>

      <div className={section}>
        <h2>Text Props</h2>
        <PropsTable of='TextProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Title renders semantic <strong>&lt;h1&gt;</strong> through <strong>&lt;h5&gt;</strong></li>
            <li>Text renders as <strong>&lt;span&gt;</strong>, <strong>&lt;strong&gt;</strong>, or <strong>&lt;code&gt;</strong></li>
            <li>Paragraph renders as <strong>&lt;p&gt;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
