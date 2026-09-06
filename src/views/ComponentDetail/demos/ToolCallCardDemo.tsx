import { ToolCallCard } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── ToolCallCard ─────────────────────────────────────────────
export default function ToolCallCardDemo() {
  return (
    <>
      <h1>ToolCallCard</h1>
      <p className={intro}>
        Displays tool/function call details with input, output, and status
        indicator.
      </p>

      <div className={section}>
        <h2>Statuses</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
            maxWidth: 400,
          }}
        >
          <ToolCallCard name='search_docs' status='pending' />
          <ToolCallCard name='fetch_data' input='url: /api/users' status='running' />
          <ToolCallCard
            name='calculate'
            input='expression: 2 + 2'
            output='4'
            status='done'
          />
          <ToolCallCard name='send_email' input='to: user@example.com' status='error' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ToolCallCardProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Status is indicated by a colored dot and text label</li>
            <li>Uses monospace font for input/output content</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='toolcallcard' />
    </>
  );
}
