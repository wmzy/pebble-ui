import {css} from '@linaria/core';

import {page, intro, section} from '@/views/ComponentDetail/styles';

const codeBlock = css`
  background: var(--haze-color-bg-muted);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  overflow-x: auto;
  margin: var(--haze-space-3) 0 var(--haze-space-6);
  white-space: pre;
  color: var(--haze-color-text);
`;

const inlineCode = css`
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  padding: 0.15em 0.4em;
  font-family: var(--haze-font-mono);
  font-size: 0.9em;
`;

const paragraph = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
  margin: 0 0 var(--haze-space-4);
`;

const stepList = css`
  list-style: none;
  padding: 0;
  margin: 0 0 var(--haze-space-6);
  counter-reset: step;

  & > li {
    counter-increment: step;
    padding-left: var(--haze-space-8);
    position: relative;
    margin-bottom: var(--haze-space-4);
    font-family: var(--haze-font-sans);
    font-size: var(--haze-text-base);
    line-height: var(--haze-leading-relaxed);
    color: var(--haze-color-text);

    &::before {
      content: counter(step);
      position: absolute;
      left: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--haze-color-primary);
      color: var(--haze-color-text-inverse);
      font-size: var(--haze-text-xs);
      font-weight: var(--haze-weight-bold);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
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

export default function GettingStarted() {
  return (
    <div className={page}>
      <h1>Getting Started</h1>
      <p className={intro}>
        Get up and running with Haze UI in your React project in just a few minutes.
      </p>

      <div className={section}>
        <h2>Installation</h2>
        <p className={paragraph}>
          Haze UI requires <code className={inlineCode}>react &gt;= 19</code> and{' '}
          <code className={inlineCode}>@linaria/core &gt;= 7</code> as peer dependencies.
        </p>
        <pre className={codeBlock}>npm install haze-ui @linaria/core</pre>
        <p className={paragraph}>Or with other package managers:</p>
        <pre className={codeBlock}>{`# pnpm
pnpm add haze-ui @linaria/core

# yarn
yarn add haze-ui @linaria/core`}</pre>
      </div>

      <div className={section}>
        <h2>Setup</h2>
        <ol className={stepList}>
          <li>
            <strong>Import the stylesheet</strong> — load the full bundle, or
            load tokens plus only the components you use.
            <pre className={codeBlock}>{`// full bundle (~12kB gzipped)
import 'haze-ui/styles.css';

// or per-component: tokens once + each component's css
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/button.css'; // OTPInput -> 'haze-ui/css/otp-input.css'`}</pre>
          </li>
          <li>
            <strong>Apply the theme</strong> — Wrap your app (or any subtree) with the theme
            class to activate design tokens.
            <pre className={codeBlock}>{`import { lightTheme, spacing, typography } from 'haze-ui';

function App() {
  return (
    <div className={\`\${lightTheme} \${spacing} \${typography}\`}>
      {/* your app */}
    </div>
  );
}`}</pre>
          </li>
          <li>
            <strong>Use components</strong> — Import and use any component directly.
            <pre className={codeBlock}>{`import { Button, Input, Card } from 'haze-ui';

function LoginForm() {
  return (
    <Card>
      <Input placeholder="Email" />
      <Input placeholder="Password" />
      <Button>Sign In</Button>
    </Card>
  );
}`}</pre>
          </li>
        </ol>
      </div>

      <div className={section}>
        <h2>Theming</h2>
        <p className={paragraph}>
          Haze UI uses CSS custom properties (design tokens) for all visual values. Two built-in
          themes are available:
        </p>
        <pre className={codeBlock}>{`import { lightTheme, darkTheme } from 'haze-ui';

// Apply to any container
<div className={darkTheme}>
  <Button>Dark Mode Button</Button>
</div>`}</pre>
        <p className={paragraph}>
          You can override any token by setting the CSS variable on a parent element:
        </p>
        <pre className={codeBlock}>{`/* Custom brand color */
.my-theme {
  --haze-color-primary: #8b5cf6;
  --haze-color-primary-hover: #7c3aed;
  --haze-color-primary-active: #6d28d9;
}`}</pre>
        <div className={note}>
          All tokens are prefixed with <code className={inlineCode}>--haze-</code> to avoid
          conflicts with other libraries. See the full list of tokens in the source code.
        </div>
        <p className={paragraph}>
          All tokens are also published in the W3C Design Tokens Format (DTF) —
          every token becomes a <code className={inlineCode}>$value</code> /{' '}
          <code className={inlineCode}>$type</code> group entry — so design-tool
          pipelines can consume them without knowing haze-ui&apos;s CSS naming:
        </p>
        <pre className={codeBlock}>{`import lightTokens from 'haze-ui/design-tokens/light.json';

// lightTokens.haze.color.primary.$value -> 'oklch(0.563 0.241 260.8)'
// lightTokens.haze.radius.md.$value -> '6px'
// dark mode: 'haze-ui/design-tokens/dark.json'`}</pre>
        <div className={note}>
          The same JSON drops straight into Style Dictionary or Tokens Studio to
          keep Figma variables and platform token output in sync with the library.
        </div>
      </div>

      <div className={section}>
        <h2>Using with Tailwind v4</h2>
        <p className={paragraph}>
          Haze UI tokens are ordinary CSS custom properties, so Tailwind v4 can consume
          them through <code className={inlineCode}>@theme</code>. Alias the tokens you
          want as Tailwind color variables, then use the matching utilities:
        </p>
        <pre className={codeBlock}>{`/* app/globals.css */
@import 'tailwindcss';

/* 'inline' makes every utility carry the var() reference itself, so each
   token resolves on the element inside your themed subtree */
@theme inline {
  --color-primary: var(--haze-color-primary);
  --color-primary-hover: var(--haze-color-primary-hover);
  --color-bg: var(--haze-color-bg);
  --color-bg-muted: var(--haze-color-bg-muted);
  --color-text: var(--haze-color-text);
  --color-border: var(--haze-color-border);
}`}</pre>
        <pre className={codeBlock}>{`<div className={lightTheme}>
  <p className="bg-primary px-4 py-2 rounded-md">
    Tailwind utilities, Haze UI tokens
  </p>
</div>`}</pre>
        <div className={note}>
          Use <code className={inlineCode}>@theme inline</code>, not plain{' '}
          <code className={inlineCode}>@theme</code>. A plain block emits{' '}
          <code className={inlineCode}>{':root { --color-primary: var(--haze-color-primary) }'}</code>{' '}
          and the var() is resolved once at <code className={inlineCode}>:root</code> —
          but Haze tokens are defined under the theme class, a descendant of{' '}
          <code className={inlineCode}>:root</code>, so every alias collapses to nothing
          there. With <code className={inlineCode}>inline</code>,{' '}
          <code className={inlineCode}>bg-primary</code> compiles to{' '}
          <code className={inlineCode}>background-color: var(--haze-color-primary)</code>{' '}
          and resolves wherever the theme class is active.
        </div>
        <p className={paragraph}>
          <strong>Cascade and load order.</strong> Haze UI CSS ships unlayered, while
          Tailwind v4 puts theme, preflight and utilities in{' '}
          <code className={inlineCode}>@layer</code>. Unlayered author styles beat any
          layer regardless of import order or specificity, so when a utility and a Haze
          component set the same property (say, a Button&apos;s background), the
          component wins. Append Tailwind v4&apos;s trailing{' '}
          <code className={inlineCode}>!</code> (e.g.{' '}
          <code className={inlineCode}>w-full!</code>) when a utility must override a
          component. Utilities win normally on properties components do not set. Because
          of layers, it does not matter whether Haze CSS or Tailwind loads first — just
          make sure the tokens are loaded once in your app root.
        </p>
        <p className={paragraph}>
          <strong>Preflight.</strong> Tailwind&apos;s reset lives in{' '}
          <code className={inlineCode}>@layer base</code> and only touches element
          defaults (borders, margins, button backgrounds). Haze components style
          themselves completely with unlayered token rules, so they render identically
          with preflight enabled — keep the default setup.
        </p>
      </div>

      <div className={section}>
        <h2>Controlled Components</h2>
        <p className={paragraph}>
          Form components support both controlled and uncontrolled modes via{' '}
          <code className={inlineCode}>react-use-control</code>:
        </p>
        <pre className={codeBlock}>{`import { Input } from 'haze-ui';
import { useControl } from 'react-use-control';

function SearchBox() {
  const [value, setValue, valueCtrl] = useControl(undefined, '');

  return (
    <>
      <Input value={valueCtrl} placeholder="Search..." />
      <p>You typed: {value}</p>
    </>
  );
}`}</pre>
        <p className={paragraph}>
          You can also pass plain values for simple uncontrolled usage — just omit the{' '}
          <code className={inlineCode}>value</code> prop and the component manages its own state.
        </p>
      </div>

      <div className={section}>
        <h2>Server rendering (Next.js)</h2>
        <p className={paragraph}>
          Every Haze UI component renders on the server and hydrates without mismatches —
          the library contains no <code className={inlineCode}>window</code> guards. This
          is enforced in-repo by two suites:{' '}
          <code className={inlineCode}>src/lib/ssr-render.node.test.tsx</code> (23 cases
          through <code className={inlineCode}>renderToString</code> in a real
          window-less node environment) and{' '}
          <code className={inlineCode}>src/lib/ssr-hydration.test.tsx</code> (22 cases
          through <code className={inlineCode}>hydrateRoot</code>, asserting hydration
          warnings stay silent) — 45 cases total, exemption list empty. A runnable
          App Router project lives at <code className={inlineCode}>examples/nextjs</code>.
        </p>
        <p className={paragraph}>
          Haze UI ships no <code className={inlineCode}>&apos;use client&apos;</code>{' '}
          directives — the boundary is yours to draw. Components own state and effects,
          so import them from a client component; that is exactly the path the SSR suites
          exercise (server render first, hydration second).
        </p>
        <p className={paragraph}>
          Load the stylesheet once in the root layout, where global CSS belongs, and apply
          the theme classes to <code className={inlineCode}>&lt;body&gt;</code>:
        </p>
        <pre className={codeBlock}>{`// app/layout.tsx
import type { Metadata } from 'next';
import { lightTheme, spacing, typography } from 'haze-ui/tokens';

import 'haze-ui/styles.css';
// or per-component: 'haze-ui/css/tokens.css' + 'haze-ui/css/button.css' + ...

export const metadata: Metadata = {
  title: 'My App',
  description: 'Built with Haze UI',
};

export default function RootLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body className={\`\${lightTheme} \${spacing} \${typography}\`}>
        {children}
      </body>
    </html>
  );
}`}</pre>
        <pre className={codeBlock}>{`// app/page.tsx
'use client';

import { Button, ToastContainer, useToast } from 'haze-ui';

export default function Page() {
  const toast = useToast();

  return (
    <ToastContainer>
      <Button onClick={() => toast('Saved', {variant: 'success'})}>
        Save
      </Button>
    </ToastContainer>
  );
}`}</pre>
        <div className={note}>
          Haze UI requires <code className={inlineCode}>react &gt;= 19</code> (Next.js 15
          or newer in the App Router) and ships ESM only —{' '}
          <code className={inlineCode}>type: &apos;module&apos;</code>, no CommonJS
          bundle. Next.js and Vite consume it out of the box; CommonJS servers should
          reach for <code className={inlineCode}>import()</code>. One deliberate
          exception to &quot;everything ships in server HTML&quot;:{' '}
          <code className={inlineCode}>StreamingText</code> intentionally renders an
          empty prefix plus cursor on the server and streams the text in on the client.
        </div>
      </div>

      <div className={section}>
        <h2>TypeScript</h2>
        <p className={paragraph}>
          Haze UI is written in TypeScript and ships type declarations out of the box.
          All component props are exported as types:
        </p>
        <pre className={codeBlock}>{`import type { ButtonProps, InputProps } from 'haze-ui';`}</pre>
      </div>

      <div className={section}>
        <h2>Browser Support</h2>
        <p className={paragraph}>
          Haze UI targets modern browsers that support CSS custom properties and the{' '}
          <code className={inlineCode}>&lt;dialog&gt;</code> element:
        </p>
        <ul className={stepList}>
          <li>Chrome / Edge 84+</li>
          <li>Firefox 98+</li>
          <li>Safari 15.4+</li>
        </ul>
      </div>
    </div>
  );
}
