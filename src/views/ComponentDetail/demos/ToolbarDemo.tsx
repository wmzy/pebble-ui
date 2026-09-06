import { useState } from 'react';

import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/lib/components/Toolbar';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row, codeBlock } from '../styles';

// ─── Toolbar ───────────────────────────────────────────────────
export default function ToolbarDemo() {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(true);
  const [align, setAlign] = useState('left');

  return (
    <>
      <h1>Toolbar</h1>
      <p className={intro}>
        A row (or column) of related controls with roving tabindex: one Tab
        stop in total, arrow keys move between items, Home/End jump to the
        ends.
      </p>

      <div className={section}>
        <h2>Text formatting</h2>
        <div className={row}>
          <Toolbar aria-label="Text formatting">
            <ToolbarButton
              square
              aria-pressed={bold}
              onClick={() => setBold((v) => !v)}
            >
              B
            </ToolbarButton>
            <ToolbarButton
              square
              aria-pressed={italic}
              onClick={() => setItalic((v) => !v)}
            >
              I
            </ToolbarButton>
            <ToolbarSeparator />
            {(['left', 'center', 'right'] as const).map((mode) => (
              <ToolbarButton
                key={mode}
                aria-pressed={align === mode}
                onClick={() => setAlign(mode)}
              >
                {mode}
              </ToolbarButton>
            ))}
            <ToolbarSeparator />
            <ToolbarButton variant="outline">Clear</ToolbarButton>
            <ToolbarButton disabled>Link (disabled)</ToolbarButton>
          </Toolbar>
        </div>
        <p className={row}>
          Tab into the toolbar, travel with ←/→ (Home/End for the ends);
          pressed items keep their tint while toggled.
        </p>
      </div>

      <div className={section}>
        <h2>Vertical</h2>
        <div className={row}>
          <Toolbar orientation="vertical" aria-label="Zoom controls">
            <ToolbarButton square>+</ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton square>−</ToolbarButton>
            <ToolbarButton square aria-pressed>
              ⤢
            </ToolbarButton>
          </Toolbar>
        </div>
        <p className={row}>
          Vertical toolbars take ↑/↓ for travel; separators rotate to match.
        </p>
      </div>

      <div className={section}>
        <h2>Usage</h2>
        <pre className={codeBlock}>{`import { Toolbar, ToolbarButton, ToolbarSeparator } from 'haze-ui';

<Toolbar aria-label="Text formatting">
  <ToolbarButton aria-pressed={bold} onClick={() => setBold(!bold)}>B</ToolbarButton>
  <ToolbarSeparator />
  <ToolbarButton disabled>Link</ToolbarButton>
</Toolbar>`}</pre>
      </div>

      <div className={section}>
        <h2>Toolbar Props</h2>
        <PropsTable of="ToolbarProps" />
      </div>

      <div className={section}>
        <h2>ToolbarButton Props</h2>
        <PropsTable of="ToolbarButtonProps" />
      </div>

      <div className={section}>
        <h2>ToolbarSeparator Props</h2>
        <PropsTable of="ToolbarSeparatorProps" />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Container exposes <strong>role=&quot;toolbar&quot;</strong> with{' '}
              <strong>aria-orientation</strong> — give it an accessible name
              (aria-label) describing its purpose
            </li>
            <li>
              <strong>Roving tabindex</strong>: one tab stop total; arrows,
              Home and End move focus (wrapping), Tab leaves the toolbar
            </li>
            <li>
              ToolbarButton is a native <strong>&lt;button&gt;</strong>;
              toggles report state with <strong>aria-pressed</strong>
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
