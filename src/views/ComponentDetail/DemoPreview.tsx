import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useState } from 'react';

import { css } from '@linaria/core';
import { ArrowLeftRight, Monitor, Moon, Smartphone, Tablet } from 'lucide-react';

import { Button, Icon, darkTheme } from '@/lib';

/*
 * Per-demo preview sandbox: the box every component demo renders into.
 * The toolbar re-scopes ONLY this box — dark adds the token `darkTheme`
 * class (all `--haze-*` custom properties re-derive on the box itself, so
 * every token-driven demo inside flips without touching the page theme),
 * RTL flips its `dir`, and the viewport presets constrain the demo's
 * content width (Auto leaves it exactly as before). Demo-site-local UI
 * state that is never exposed to library consumers, hence plain useState.
 */

type ViewportPreset = {
  id: 'auto' | 'mobile' | 'tablet';
  label: string;
  /** null = Auto — content fills the box as it always did. */
  width: number | null;
  icon: LucideIcon;
};

const VIEWPORTS: readonly ViewportPreset[] = [
  { id: 'auto', label: 'Auto', width: null, icon: Monitor },
  { id: 'mobile', label: '375', width: 375, icon: Smartphone },
  { id: 'tablet', label: '768', width: 768, icon: Tablet },
] as const;

const shell = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
`;

/* Stays visible over long demo pages: pinned to the scrollport top while
 * the box itself is in view, so the controls never scroll out of reach. */
const toolbar = css`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--haze-space-1);
  padding: var(--haze-space-2) var(--haze-space-3);
  border-bottom: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg) var(--haze-radius-lg) 0 0;
  background: var(--haze-color-bg);
`;

const toolbarGroup = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-1);
`;

/* Readout of the currently selected content width (Auto = unconstrained). */
const widthTag = css`
  padding: var(--haze-space-0) var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-tight);
  color: var(--haze-color-text-secondary);
`;

/* Background/color resolve against the box itself: with `darkTheme`
 * applied here the dark token values take over, so the sandbox reads as
 * a dark surface with readable text rather than light page showing dark
 * widgets. (Headings inherit no color anywhere on the site — declare it
 * so the dark scope actually restyles them.) */
const previewArea = css`
  padding: var(--haze-space-4) var(--haze-space-6) var(--haze-space-6);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  border-radius: 0 0 var(--haze-radius-lg) var(--haze-radius-lg);
`;

/* Width-constrained demo viewport (375/768 presets): centered with a
 * dashed boundary so the simulated device width is visually traceable.
 * Logical properties keep it correct under the RTL toggle. */
const constrained = css`
  margin-inline: auto;
  padding: var(--haze-space-2) var(--haze-space-4);
  border-inline: 1px dashed var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
`;

export default function DemoPreview({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [viewportId, setViewportId] = useState<ViewportPreset['id']>('auto');
  const viewport = VIEWPORTS.find((v) => v.id === viewportId) ?? VIEWPORTS[0]!;

  return (
    <div className={shell}>
      <div className={toolbar}>
        <div className={toolbarGroup} role='group' aria-label='Preview viewport width'>
          {VIEWPORTS.map((preset) => (
            <Button
              key={preset.id}
              size='sm'
              variant={preset.id === viewportId ? 'solid' : 'ghost'}
              aria-pressed={preset.id === viewportId}
              onClick={() => setViewportId(preset.id)}
            >
              <Icon icon={preset.icon} size='sm' />
              {preset.label}
            </Button>
          ))}
          <span className={widthTag} aria-live='polite'>
            {viewport.width === null ? 'Auto' : `${viewport.width}px`}
          </span>
        </div>
        <div className={toolbarGroup}>
          <Button
            size='sm'
            square
            variant={dark ? 'solid' : 'ghost'}
            aria-label='Toggle dark preview'
            aria-pressed={dark}
            onClick={() => setDark((v) => !v)}
          >
            <Icon icon={Moon} size='sm' />
          </Button>
          <Button
            size='sm'
            square
            variant={rtl ? 'solid' : 'ghost'}
            aria-pressed={rtl}
            aria-label='Toggle RTL preview'
            onClick={() => setRtl((v) => !v)}
          >
            <Icon icon={ArrowLeftRight} size='sm' />
          </Button>
        </div>
      </div>
      <div
        className={previewArea}
        x-class={[dark && darkTheme]}
        dir={rtl ? 'rtl' : 'ltr'}
      >
        {viewport.width === null ? (
          children
        ) : (
          <div className={constrained} style={{ maxWidth: viewport.width }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
