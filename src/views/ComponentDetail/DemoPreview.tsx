import type { ReactNode } from 'react';

import { useState } from 'react';

import { css } from '@linaria/core';
import { ArrowLeftRight, Moon } from 'lucide-react';

import { Button, Icon, darkTheme } from '@/lib';

/*
 * Per-demo preview sandbox: the box every component demo renders into.
 * The two toolbar toggles re-scope ONLY this box — dark adds the token
 * `darkTheme` class (all `--haze-*` custom properties re-derive on the
 * box itself, so every token-driven demo inside flips without touching
 * the page theme), RTL flips its `dir`. Demo-site-local UI state that is
 * never exposed to library consumers, hence plain useState.
 */

const shell = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
`;

/* Stays visible over long demo pages: pinned to the scrollport top while
 * the box itself is in view, so the toggles never scroll out of reach. */
const toolbar = css`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  gap: var(--haze-space-1);
  padding: var(--haze-space-2) var(--haze-space-3);
  border-bottom: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg) var(--haze-radius-lg) 0 0;
  background: var(--haze-color-bg);
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

export default function DemoPreview({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(false);

  return (
    <div className={shell}>
      <div className={toolbar}>
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
          aria-label='Toggle RTL preview'
          aria-pressed={rtl}
          onClick={() => setRtl((v) => !v)}
        >
          <Icon icon={ArrowLeftRight} size='sm' />
        </Button>
      </div>
      <div
        className={previewArea}
        x-class={[dark && darkTheme]}
        dir={rtl ? 'rtl' : 'ltr'}
      >
        {children}
      </div>
    </div>
  );
}
