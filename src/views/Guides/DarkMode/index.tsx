import { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@linaria/core';

import {
  Button,
  CodeBlock,
  Flex,
  Input,
  darkTheme,
} from '@/lib';
import { createBrandTheme } from '@/lib/tokens';
import { useDarkMode } from '@/lib/hooks';
import { intro, page, section } from '@/views/ComponentDetail/styles';

/*
 * Dark mode guide: the two token classes, the useDarkMode hook (storage,
 * system follow, functional updates), a scoped-container live demo, the
 * mode persistence comparison, next-themes interop (documented only —
 * the demo app deliberately does not depend on next-themes), and runtime
 * custom brand themes via createBrandTheme / the haze-ui-theme CLI.
 */

const paragraph = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
  margin: 0 0 var(--haze-space-4);
`;

const inlineCode = css`
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  padding: 0.15em 0.4em;
  font-family: var(--haze-font-mono);
  font-size: 0.9em;
`;

const codeMargin = css`
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const note = css`
  background: var(--haze-color-primary-subtle);
  border-left: 3px solid var(--haze-color-primary);
  border-radius: 0 var(--haze-radius-md) var(--haze-radius-md) 0;
  padding: var(--haze-space-3) var(--haze-space-4);
  margin: var(--haze-space-4) 0;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-normal);
`;

const islandRow = css`
  display: flex;
  gap: var(--haze-space-4);
  flex-wrap: wrap;
  margin: var(--haze-space-4) 0 var(--haze-space-6);
`;

const island = css`
  flex: 1;
  min-width: 220px;
  max-width: 320px;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
  font-size: var(--haze-text-sm);
`;

const scopedDemo = css`
  max-width: 420px;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4);
  margin: var(--haze-space-4) 0 var(--haze-space-2);
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
  font-family: var(--haze-font-sans);
  transition: background var(--haze-duration-normal) var(--haze-ease);
`;

const demoCaption = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  margin: 0 0 var(--haze-space-6);
`;

const demoStatus = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-mono);
`;

const tableWrap = css`
  overflow-x: auto;
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const modeTable = css`
  border-collapse: collapse;
  width: 100%;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);

  th,
  td {
    border: 1px solid var(--haze-color-border);
    padding: var(--haze-space-2) var(--haze-space-3);
    text-align: start;
    vertical-align: top;
  }

  th {
    background: var(--haze-color-bg-subtle);
    font-weight: var(--haze-weight-medium);
  }

  code {
    font-family: var(--haze-font-mono);
    font-size: 0.9em;
  }
`;

/** Two static theme islands — the page stays light, one subtree flips. */
function ThemeIslandsDemo() {
  return (
    <div className={islandRow}>
      <div className={island}>
        <strong>lightTheme (page default)</strong>
        Tokens resolve to the light palette everywhere inside.
        <Button size='sm'>Button</Button>
        <Input size='sm' placeholder='Input' aria-label='Light island input' />
      </div>
      <div x-class={[island, darkTheme]}>
        <strong>darkTheme</strong>
        One class on the container — every descendant re-resolves.
        <Button size='sm'>Button</Button>
        <Input size='sm' placeholder='Input' aria-label='Dark island input' />
      </div>
    </div>
  );
}

/**
 * Scoped useDarkMode: the hook owns a container instead of the document,
 * persists under its own key (so the demo never fights this site's own
 * theme header), and starts in 'system' mode.
 */
function ScopedDarkModeDemo() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDark, setIsDark, mode, setMode] = useDarkMode({
    target: ref,
    storageKey: 'haze-docs-dark-mode-demo',
    defaultMode: 'system',
  });

  return (
    <div>
      <div ref={ref} className={scopedDemo}>
        <Flex gap='var(--haze-space-1)' wrap>
          <Button
            size='sm'
            variant={mode === 'light' ? 'solid' : 'ghost'}
            onClick={() => setMode('light')}
          >
            Light
          </Button>
          <Button
            size='sm'
            variant={mode === 'dark' ? 'solid' : 'ghost'}
            onClick={() => setMode('dark')}
          >
            Dark
          </Button>
          <Button
            size='sm'
            variant={mode === 'system' ? 'solid' : 'ghost'}
            onClick={() => setMode('system')}
          >
            System
          </Button>
        </Flex>
        {/* Functional update: flips the current resolution and always
            leaves 'system' — same as setMode(isDark ? 'light' : 'dark'). */}
        <Button size='sm' variant='outline' onClick={() => setIsDark((prev) => !prev)}>
          Toggle (functional update)
        </Button>
        <div className={demoStatus}>
          mode: {mode} · resolved: {isDark ? 'dark' : 'light'}
        </div>
      </div>
      <p className={demoCaption}>
        Flip your OS appearance while <code className={inlineCode}>System</code>{' '}
        is active — the card follows live. Any explicit choice (Light, Dark,
        or the toggle) pins the card and stops the following until you pick{' '}
        <code className={inlineCode}>System</code> again.
      </p>
    </div>
  );
}

/**
 * Runtime brand theme: createBrandTheme builds the full token set from a
 * seed hex at runtime; the demo injects the blocks as plain CSS classes and
 * renders the same island pair under them. Primary/info/focus-ring follow
 * the seed; neutrals and success/warning/danger stay on the default scales.
 */
function RuntimeBrandDemo() {
  const [draft, setDraft] = useState('#7c3aed');
  const seed = draft.trim();
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(seed);
  const theme = useMemo(() => (valid ? createBrandTheme({name: 'demo', light: seed}) : null), [valid, seed]);

  useEffect(() => {
    if (theme === null) return;
    const style = document.createElement('style');
    style.setAttribute('data-haze-demo-brand', '');
    style.textContent = `.demo-brand-light {\n${theme.light}\n}\n\n.demo-brand-dark {\n${theme.dark}\n}`;
    document.head.append(style);
    return () => {
      style.remove();
    };
  }, [theme]);

  return (
    <div>
      <Flex gap='var(--haze-space-2)' wrap align='center' style={{marginBottom: 'var(--haze-space-3)'}}>
        <Input
          size='sm'
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label='Brand seed hex'
          style={{width: 130, fontFamily: 'var(--haze-font-mono)'}}
        />
        <span className={demoStatus}>
          {valid ? 'dark mode derived automatically (oklch l +0.2)' : 'enter a #rgb or #rrggbb hex'}
        </span>
      </Flex>
      <div className={islandRow}>
        <div className='demo-brand-light'>
          <div x-class={island}>
            <strong>demo-brand-light</strong>
            Generated at runtime from the seed above.
            <Button size='sm'>Button</Button>
            <Input size='sm' placeholder='Focus shows the brand ring' aria-label='Runtime brand light input' />
          </div>
        </div>
        <div className='demo-brand-dark'>
          <div x-class={island}>
            <strong>demo-brand-dark</strong>
            Derived dark: same hue, lifted lightness.
            <Button size='sm'>Button</Button>
            <Input size='sm' placeholder='Focus shows the brand ring' aria-label='Runtime brand dark input' />
          </div>
        </div>
      </div>
      <p className={demoCaption}>
        Try <code className={inlineCode}>&apos;#0066ff&apos;</code>,{' '}
        <code className={inlineCode}>&apos;#0f766e&apos;</code> or{' '}
        <code className={inlineCode}>&apos;#c2410c&apos;</code> — the hover,
        active and subtle states re-resolve with it because they are CSS
        relative-color formulas over the generated primitives.
      </p>
    </div>
  );
}

export default function DarkModeGuide() {
  return (
    <div className={page}>
      <h1>Dark mode</h1>
      <p className={intro}>
        Every haze-ui color is a <code className={inlineCode}>--haze-*</code>{' '}
        custom property defined by one of two theme classes —{' '}
        <code className={inlineCode}>lightTheme</code> /{' '}
        <code className={inlineCode}>darkTheme</code>. Dark mode is therefore
        just &ldquo;which class is on the container&rdquo;: put{' '}
        <code className={inlineCode}>darkTheme</code> on{' '}
        <code className={inlineCode}>&lt;html&gt;</code> for the app, on any
        subtree for a dark island, or let{' '}
        <code className={inlineCode}>useDarkMode</code> manage it with
        persistence and system-preference following.
      </p>

      <div className={section}>
        <h2>The theme classes</h2>
        <p className={paragraph}>
          The classes are plain strings exported from the package. They work
          on any element, compose with your own class names, and cascade —
          a nested <code className={inlineCode}>lightTheme</code> inside a
          dark page is a light island. Both cards below are rendered by the
          same components; only the container&apos;s class differs:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { lightTheme, darkTheme, spacing, typography } from 'haze-ui';

// app root — one class flips the whole tree
<div className={\`\${darkTheme} \${spacing} \${typography}\`}>
  <App />
</div>

// or a dark island inside a light page — nesting wins by proximity
<div className={darkTheme}>
  <Card>…</Card>
</div>`}
        </CodeBlock>
        <ThemeIslandsDemo />
        <div className={note}>
          Because theme classes carry <em>token definitions</em>, not styles,
          they never fight your CSS: your rules keep their specificity, they
          just re-resolve <code className={inlineCode}>var(--haze-*)</code>{' '}
          references inside the subtree. Inheriting custom properties from a
          dark ancestor is exactly how the islands above work with zero
          per-component dark-mode code.
        </div>
      </div>

      <div className={section}>
        <h2>Brand presets</h2>
        <p className={paragraph}>
          Five preset brand themes ship alongside the default blue:{' '}
          <code className={inlineCode}>violetTheme</code>,{' '}
          <code className={inlineCode}>tealTheme</code>,{' '}
          <code className={inlineCode}>cyanTheme</code>,{' '}
          <code className={inlineCode}>orangeTheme</code> and{' '}
          <code className={inlineCode}>roseTheme</code>, each exposing a{' '}
          <code className={inlineCode}>light</code> and a{' '}
          <code className={inlineCode}>dark</code> class. A brand class is a{' '}
          <strong>complete replacement</strong> for{' '}
          <code className={inlineCode}>lightTheme</code>/
          <code className={inlineCode}>darkTheme</code> — never stack the two
          on the same element. Primary, info and focus-ring re-resolve to the
          brand&apos;s scale; neutrals and success/warning/danger stay put:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { violetTheme, spacing, typography } from 'haze-ui';

// violetTheme.light REPLACES lightTheme — it carries the full token set
// (primitive scales + semantic aliases + interaction states)
<div className={\`\${violetTheme.light} \${spacing} \${typography}\`}>
  <App />
</div>

// dark works the same way against darkTheme
<div className={\`\${violetTheme.dark} \${spacing} \${typography}\`}>
  <App />
</div>`}
        </CodeBlock>
        <div className={note}>
          Why replacement instead of an overlay: a brand class and{' '}
          <code className={inlineCode}>lightTheme</code> would declare the
          same custom properties at the same specificity, leaving the winner
          to stylesheet emission order. Custom-property overrides must land
          on the very element that declares them — so the brand classes
          restate the entire theme (every token the default themes carry)
          rather than shipping a diff that only works when stacked.
        </div>
      </div>

      <div className={section}>
        <h2>Custom brand themes at runtime</h2>
        <p className={paragraph}>
          When none of the presets match,{' '}
          <code className={inlineCode}>createBrandTheme</code> builds the
          same complete theme from your own seed color — one hex for light
          mode, an optional second for dark. It runs the preset pipeline
          (primitive 12-step scales, primary/info/focus-ring rerouting,
          relative-color interaction states), so the result is
          indistinguishable from a shipped preset:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { createBrandTheme } from 'haze-ui/tokens';

const brand = createBrandTheme({
  name: 'acme',        // → --haze-acme-1…12 (lowercase kebab)
  light: '#0066ff',    // light-mode primary seed
  // dark: '#0a3d99',  // optional — derived from light (oklch l +0.2) if omitted
  // overrides: {light: {10: '#…'}, dark: {8: '#…'}},  // pin extra anchors
});

// bare declaration blocks — wrap them in classes once:
const style = document.createElement('style');
style.textContent = \`.acme-light { \\\${brand.light} }\\n.acme-dark { \\\${brand.dark} }\`;
document.head.append(style);`}
        </CodeBlock>
        <RuntimeBrandDemo />
        <div className={note}>
          Two rules carry over from the presets: the blocks are{' '}
          <strong>replacements</strong> for{' '}
          <code className={inlineCode}>lightTheme</code>/
          <code className={inlineCode}>darkTheme</code> (never stack), and
          you own contrast — pick a light-mode seed dark enough for white
          text (the presets&rsquo; step-9 anchors sit near Tailwind&rsquo;s
          600/700 range for exactly that reason).
        </div>
        <p className={paragraph}>
          Outside React, the{' '}
          <code className={inlineCode}>haze-ui-theme</code> CLI emits the
          identical CSS as a file — handy for design handoff or static
          sites. Brand presets are also exported as W3C design-token JSON
          via{' '}
          <code className={inlineCode}>haze-ui/design-tokens/&#123;brand&#125;/&#123;mode&#125;.json</code>.
        </p>
        <CodeBlock language='bash' className={codeMargin}>
          {`npx haze-ui-theme --primary '#0066ff' --name acme --out acme-theme.css
# → .haze-acme-light / .haze-acme-dark classes, complete token set`}
        </CodeBlock>
      </div>

      <div className={section}>
        <h2>useDarkMode — persistence &amp; system following</h2>
        <p className={paragraph}>
          <code className={inlineCode}>useDarkMode</code> is the stateful
          half: it persists the chosen mode to{' '}
          <code className={inlineCode}>localStorage</code> (cross-tab synced
          via the <code className={inlineCode}>storage</code> event),
          resolves <code className={inlineCode}>mode === &apos;system&apos;</code>{' '}
          against <code className={inlineCode}>prefers-color-scheme</code>{' '}
          live, and toggles the right theme class on a target element —{' '}
          <code className={inlineCode}>document.documentElement</code> by
          default, or any element/ref for a scoped container. The card below
          runs scoped, with its own storage key:
        </p>
        <ScopedDarkModeDemo />
        <p className={paragraph}>
          The full return value and options:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { useDarkMode } from 'haze-ui';

const [isDark, setIsDark, mode, setMode] = useDarkMode({
  storageKey: 'my-app-color-mode', // default 'haze-ui-color-mode'
  defaultMode: 'system',           // 'light' | 'dark' | 'system' (default 'system')
  target: rootRef,                 // element or ref; default document.documentElement
});

setMode('system');           // follow the OS preference again
setIsDark(true);             // shorthand for setMode('dark')
setIsDark((prev) => !prev);  // functional — flips the current resolution`}
        </CodeBlock>
        <p className={paragraph}>
          Call it once near the root of the app and pass the values down (or
          through your own context) — the class toggling is idempotent, so a
          second call site is harmless, but one owner keeps the mode single
          sourced. Two behaviors are deliberate:
        </p>
        <ul className={paragraph}>
          <li>
            <strong>Unmounting never removes the class.</strong> A theme is a
            page-level fact — stripping <code className={inlineCode}>
            darkTheme
            </code>{' '}
            on unmount would flash the page white.
          </li>
          <li>
            <strong>SSR-safe by construction.</strong> Nothing touches{' '}
            <code className={inlineCode}>document</code> during render and
            the effect only runs on the client, so server HTML and the first
            client render agree. The class lands right after hydration; if
            you need it before first paint in a plain SPA, add a tiny inline
            script in <code className={inlineCode}>index.html</code> that
            reads the storage key — the Next.js section below shows the
            framework-managed equivalent.
          </li>
        </ul>

        <h3>Mode persistence compared</h3>
        <div className={tableWrap}>
          <table className={modeTable}>
            <thead>
              <tr>
                <th>mode</th>
                <th>persisted value</th>
                <th>resolved isDark</th>
                <th>follows OS changes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>&apos;light&apos;</code>
                </td>
                <td>
                  <code>&apos;light&apos;</code>
                </td>
                <td>
                  <code>false</code> — always
                </td>
                <td>No</td>
              </tr>
              <tr>
                <td>
                  <code>&apos;dark&apos;</code>
                </td>
                <td>
                  <code>&apos;dark&apos;</code>
                </td>
                <td>
                  <code>true</code> — always
                </td>
                <td>No</td>
              </tr>
              <tr>
                <td>
                  <code>&apos;system&apos;</code>
                </td>
                <td>
                  <code>&apos;system&apos;</code> (the choice, not the
              resolution)
                </td>
                <td>
                  <code>matchMedia(&apos;(prefers-color-scheme: dark)&apos;)</code>
                </td>
                <td>
                  Yes — live, via the matchMedia listener (no reload needed)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={paragraph}>
          Note the third row stores the <em>choice</em>, not the resolved
          value: a user on &apos;system&apos; whose OS is light now will
          still get dark automatically when the OS switches. Any explicit{' '}
          <code className={inlineCode}>setIsDark(…)</code> or{' '}
          <code className={inlineCode}>setMode(&apos;light&apos; | &apos;dark&apos;)</code>{' '}
          pins the mode and stops the following until{' '}
          <code className={inlineCode}>setMode(&apos;system&apos;)</code>{' '}
          re-enables it — mirroring the Light/Dark/Auto pattern in this
          site&apos;s own header.
        </p>
      </div>

      <div className={section}>
        <h2>Interoperating with next-themes</h2>
        <p className={paragraph}>
          next-themes stays the theme owner; haze only needs the right token
          class on an ancestor. The classes are build-time strings, so hand
          them to next-themes directly and it writes exactly these class
          names on <code className={inlineCode}>&lt;html&gt;</code> — no sync
          effect, no flash handling of your own:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`// app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';
import { darkTheme, lightTheme } from 'haze-ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute='class'
      enableSystem
      // maps next-themes' resolved names onto haze's token classes;
      // suppressHydrationWarning on <html> stays recommended by next-themes
      value={{ light: lightTheme, dark: darkTheme }}
    >
      {children}
    </ThemeProvider>
  );
}`}
        </CodeBlock>
        <p className={paragraph}>
          Already locked into a provider config you cannot change? A small
          sync effect does the same job — it reads{' '}
          <code className={inlineCode}>resolvedTheme</code> (never{' '}
          <code className={inlineCode}>theme</code>, which can be{' '}
          <code className={inlineCode}>&apos;system&apos;</code>) and mirrors
          it onto the class list:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`// app/haze-theme-sync.tsx
'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { darkTheme, lightTheme } from 'haze-ui';

export function HazeThemeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(lightTheme, resolvedTheme !== 'dark');
    root.classList.toggle(darkTheme, resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return null;
}`}
        </CodeBlock>
        <div className={note}>
          Pick <strong>one</strong> writer for the theme classes. When
          next-themes (or any manager) owns them, do not also mount{' '}
          <code className={inlineCode}>useDarkMode</code> — two writers on
          the same class list fight, and persistence belongs to whoever owns
          the switch (next-themes&apos; own{' '}
          <code className={inlineCode}>storageKey</code> in that setup).
          Tailwind&apos;s <code className={inlineCode}>dark:</code> variants
          coexist fine: next-themes can write both a{' '}
          <code className={inlineCode}>dark</code> utility class and haze&apos;s
          token classes if you list them together in{' '}
          <code className={inlineCode}>value</code>.
        </div>
      </div>
    </div>
  );
}
