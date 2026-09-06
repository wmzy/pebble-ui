import {css} from '@linaria/core';
import {Link} from '@native-router/react';

import {Button, Flex, Badge, Card} from '@/lib';

const wrapper = css`
  background: var(--haze-color-bg);
`;

const hero = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--haze-space-8) var(--haze-space-4);
  padding-top: 12vh;
  padding-bottom: 10vh;
`;

const title = css`
  font-family: var(--haze-font-sans);
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: var(--haze-weight-bold);
  color: var(--haze-color-text);
  margin: var(--haze-space-4) 0 var(--haze-space-3);
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

const subtitle = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-lg);
  color: var(--haze-color-text-secondary);
  margin: 0 0 var(--haze-space-8);
  max-width: 560px;
  line-height: var(--haze-leading-relaxed);
`;

const linkReset = css`
  text-decoration: none;
`;

const installBox = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  background: var(--haze-color-bg-muted);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-2) var(--haze-space-4);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  margin-top: var(--haze-space-6);
  user-select: all;
`;

const sectionTitle = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-2xl);
  font-weight: var(--haze-weight-bold);
  color: var(--haze-color-text);
  text-align: center;
  margin: 0 0 var(--haze-space-2);
`;

const sectionSubtitle = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text-secondary);
  text-align: center;
  margin: 0 0 var(--haze-space-8);
  line-height: var(--haze-leading-normal);
`;

const featuresSection = css`
  padding: var(--haze-space-8) var(--haze-space-4);
  max-width: 960px;
  margin: 0 auto;
`;

const featureGrid = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--haze-space-4);
`;

const featureIcon = css`
  font-size: 1.5rem;
  margin-bottom: var(--haze-space-2);
  line-height: 1;
`;

const featureTitle = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  font-weight: var(--haze-weight-semibold);
  color: var(--haze-color-text);
  margin: 0 0 var(--haze-space-1);
`;

const featureDesc = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  line-height: var(--haze-leading-normal);
  margin: 0;
`;

const compareSection = css`
  padding: var(--haze-space-8) var(--haze-space-4);
  max-width: 960px;
  margin: 0 auto;
`;

const compareScroll = css`
  overflow-x: auto;
`;

const compareTable = css`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  color: var(--haze-color-text-secondary);

  & th,
  & td {
    text-align: left;
    padding: var(--haze-space-2) var(--haze-space-3);
    border-bottom: 1px solid var(--haze-color-border);
    vertical-align: top;
    white-space: nowrap;
  }

  & thead th {
    color: var(--haze-color-text);
    font-weight: var(--haze-weight-semibold);
  }

  & tbody th {
    color: var(--haze-color-text);
    font-weight: var(--haze-weight-medium);
  }

  & td:first-of-type {
    color: var(--haze-color-primary);
    font-weight: var(--haze-weight-medium);
  }
`;

const statsSection = css`
  padding: var(--haze-space-8) var(--haze-space-4);
  background: var(--haze-color-bg-subtle);
`;

const statsGrid = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--haze-space-4);
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
`;

const statNumber = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-3xl);
  font-weight: var(--haze-weight-bold);
  color: var(--haze-color-primary);
  margin: 0;
`;

const statLabel = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  margin: var(--haze-space-1) 0 0;
`;

const codeSection = css`
  padding: var(--haze-space-8) var(--haze-space-4);
  max-width: 960px;
  margin: 0 auto;
`;

const codeExample = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--haze-space-6);
  align-items: start;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const codeBlock = css`
  background: var(--haze-color-bg-muted);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  overflow-x: auto;
  white-space: pre;
  color: var(--haze-color-text);
  margin: 0;
`;

const codeDescription = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
`;

const codeDescTitle = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-lg);
  font-weight: var(--haze-weight-semibold);
  color: var(--haze-color-text);
  margin: 0 0 var(--haze-space-2);
`;

const footer = css`
  padding: var(--haze-space-6) var(--haze-space-4);
  text-align: center;
  border-top: 1px solid var(--haze-color-border);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);

  & a {
    color: var(--haze-color-primary);
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

const FEATURES = [
  {
    icon: '\u26a1',
    title: 'Zero Runtime Overhead',
    desc: 'Styles are extracted at build time via Linaria. No runtime CSS-in-JS cost.',
  },
  {
    icon: '\ud83c\udfa8',
    title: 'Design Tokens',
    desc: 'Consistent theming through CSS custom properties. Light and dark themes built in.',
  },
  {
    icon: '\ud83e\udde9',
    title: '33+ Components',
    desc: 'From buttons to datepickers, all following Open UI standards for consistency.',
  },
  {
    icon: '\u267f',
    title: 'Accessible',
    desc: 'Built on native HTML elements like <dialog> and <details> for built-in a11y.',
  },
  {
    icon: '\ud83d\udce6',
    title: 'Tree-Shakeable',
    desc: 'ES module output with preserveModules. Import only what you use.',
  },
  {
    icon: '\ud83d\udd27',
    title: 'Controlled & Uncontrolled',
    desc: 'Form components support both modes via react-use-control.',
  },
  {
    icon: '\ud83d\udcdd',
    title: 'TypeScript First',
    desc: 'Written in TypeScript with exported prop types for every component.',
  },
  {
    icon: '\ud83c\udf1f',
    title: 'Lightweight',
    desc: 'Under 32KB CSS, no heavy dependencies. Designed for performance.',
  },
  {
    icon: '\ud83c\udfaf',
    title: 'Customizable',
    desc: 'Override any design token with CSS variables. className passthrough on all components.',
  },
] as const;

const COMPARE_COLUMNS = ['haze-ui', 'shadcn + Base UI', 'Radix', 'Mantine', 'MUI'] as const;

const COMPARE_ROWS = [
  {
    label: 'Styling runtime',
    cells: ['zero (Linaria)', 'zero (Tailwind)', 'unstyled', 'runtime', 'runtime'],
  },
  {
    label: 'State API',
    cells: [
      'ControlOrValue<T> single prop',
      'value/defaultValue',
      'value/defaultValue',
      'value/defaultValue',
      'value/defaultValue',
    ],
  },
  {
    label: 'Form binding',
    cells: ['react-f0rm deep integration', 'react-hook-form optional', '\u2014', 'built-in', 'built-in'],
  },
  {
    label: 'AI components',
    cells: ['18 built-in, zero runtime binding', '\u2014', '\u2014', '\u2014', '\u2014'],
  },
  {
    label: 'Per-component CSS',
    cells: ['css-manifest.json', '\u2014', '\u2014', '\u2014', '\u2014'],
  },
  {
    label: 'Shipped CSS',
    cells: ['~19 kB gzipped', 'varies', '\u2014', '\u2014', '\u2014'],
  },
] as const;

export default function Home() {
  return (
    <div className={wrapper}>
      <section className={hero}>
        <Badge variant="info">v1.0</Badge>
        <h1 className={title}>Build faster with Haze UI</h1>
        <p className={subtitle}>
          A lightweight, accessible React component library with zero-runtime
          CSS-in-JS, design tokens, and 33+ production-ready components.
        </p>
        <Flex gap="var(--haze-space-3)">
          <Link className={linkReset} to="/getting-started">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link className={linkReset} to="/components">
            <Button variant="outline" size="lg">Components</Button>
          </Link>
        </Flex>
        <div className={installBox}>
          <span>$</span> npm install haze-ui
        </div>
      </section>

      <section className={statsSection}>
        <div className={statsGrid}>
          <div>
            <p className={statNumber}>33+</p>
            <p className={statLabel}>Components</p>
          </div>
          <div>
            <p className={statNumber}>32KB</p>
            <p className={statLabel}>CSS (gzip: 5.5KB)</p>
          </div>
          <div>
            <p className={statNumber}>0</p>
            <p className={statLabel}>Runtime JS for styles</p>
          </div>
          <div>
            <p className={statNumber}>2</p>
            <p className={statLabel}>Built-in themes</p>
          </div>
        </div>
      </section>

      <section className={featuresSection}>
        <h2 className={sectionTitle}>Why Haze UI?</h2>
        <p className={sectionSubtitle}>
          Everything you need to build modern React interfaces, nothing you don&apos;t.
        </p>
        <div className={featureGrid}>
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <div className={featureIcon}>{f.icon}</div>
              <h3 className={featureTitle}>{f.title}</h3>
              <p className={featureDesc}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className={compareSection}>
        <h2 className={sectionTitle}>How it compares</h2>
        <p className={sectionSubtitle}>
          Zero-runtime styling, one-prop state control, and AI components built in.
        </p>
        <div className={compareScroll}>
          <table className={compareTable}>
            <thead>
              <tr>
                <th scope="col" aria-label="Dimension" />
                {COMPARE_COLUMNS.map((column) => (
                  <th key={column} scope="col">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {COMPARE_COLUMNS.map((column, i) => (
                    <td key={column}>{row.cells[i]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={codeSection}>
        <h2 className={sectionTitle}>Simple by design</h2>
        <p className={sectionSubtitle}>
          Clean APIs that get out of your way. Here&apos;s what it looks like:
        </p>
        <div className={codeExample}>
          <div>
            <h3 className={codeDescTitle}>Quick setup</h3>
            <p className={codeDescription}>
              Import the stylesheet (full bundle or per-component CSS), apply a
              theme class, and start using components. No providers, no context
              wrappers, no configuration files.
            </p>
          </div>
          <pre className={codeBlock}>{`import 'haze-ui/styles.css';
import { lightTheme, Button } from 'haze-ui';

export default function App() {
  return (
    <div className={lightTheme}>
      <Button>Click me</Button>
    </div>
  );
}`}</pre>
        </div>
      </section>

      <footer className={footer}>
        MIT License &middot; Built with React 19 &middot;{' '}
        <a href="https://github.com/wmzy/haze-ui" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
