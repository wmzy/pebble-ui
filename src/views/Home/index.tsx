import {useState} from 'react';
import {css} from '@linaria/core';
import {Link} from '@native-router/react';

import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  Chip,
  Flex,
  Input,
  Pagination,
  Progress,
  Rating,
  Segmented,
  Slider,
  Switch,
  Tag,
  useClipboard,
  useControl,
} from '@/lib';

import propsJson from '@/generated/props.json';
import sizeReportJson from '@/generated/size-report.json';

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

/* Terminal-style install snippet. Primitive gray steps keep it a dark
   block on the light theme and flip to an inverted block on dark, so the
   command reads in both themes. */
const installBox = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--haze-space-3);
  background: var(--haze-gray-12);
  border: 1px solid var(--haze-gray-11);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-2) var(--haze-space-2) var(--haze-space-2) var(--haze-space-4);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  margin-top: var(--haze-space-6);
  min-width: min(320px, 100%);
`;

const installCommand = css`
  display: flex;
  align-items: baseline;
  gap: var(--haze-space-2);
  color: var(--haze-gray-1);
  white-space: nowrap;
  overflow-x: auto;
`;

const installPrompt = css`
  color: var(--haze-color-success);
  user-select: none;
`;

const installCmd = css`
  color: var(--haze-color-info);
  font-weight: var(--haze-weight-medium);
`;

const installArg = css`
  color: var(--haze-gray-1);
`;

const installCopyBtn = css`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-normal);
  color: var(--haze-gray-1);
  background: transparent;
  border: 1px solid var(--haze-gray-8);
  border-radius: var(--haze-radius-sm);
  padding: var(--haze-space-1) var(--haze-space-3);
  cursor: pointer;
  transition: background var(--haze-duration-fast) var(--haze-ease);

  &:hover {
    background: var(--haze-gray-11);
  }

  &:focus-visible {
    outline: 2px solid var(--haze-color-focus-ring);
    outline-offset: 2px;
  }
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

const sizeSection = css`
  padding: var(--haze-space-8) var(--haze-space-4);
  max-width: 960px;
  margin: 0 auto;
`;

const sizeToolbar = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--haze-space-3);
  margin-bottom: var(--haze-space-3);
`;

const sizeSummary = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
`;

const sizeScroll = css`
  max-height: 440px;
  overflow-y: auto;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
`;

const sizeTable = css`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
  color: var(--haze-color-text-secondary);

  & th,
  & td {
    padding: var(--haze-space-2) var(--haze-space-3);
    border-bottom: 1px solid var(--haze-color-border);
    white-space: nowrap;
  }

  & thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--haze-color-bg-muted);
    color: var(--haze-color-text);
    font-weight: var(--haze-weight-semibold);
    text-align: left;
  }

  & thead th:not(:first-child),
  & td:not(:first-child) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  & tbody th {
    color: var(--haze-color-text);
    font-weight: var(--haze-weight-medium);
    font-family: var(--haze-font-mono);
  }

  & tbody td {
    font-family: var(--haze-font-mono);
  }

  & tbody tr:last-child th,
  & tbody tr:last-child td {
    border-bottom: none;
  }
`;

const sizeNote = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  margin: var(--haze-space-2) 0 0;
`;

const sizeHint = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  text-align: center;
  margin: 0;
`;

const statsSection = css`
  padding: var(--haze-space-8) var(--haze-space-4);
  background: var(--haze-color-bg-subtle);
`;

const statsGrid = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--haze-space-4);
  max-width: 760px;
  margin: 0 auto;
`;

const statCard = css`
  text-align: center;
`;

const statNumber = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-3xl);
  font-weight: var(--haze-weight-bold);
  color: var(--haze-color-primary);
  margin: 0;
  white-space: nowrap;
`;

const statLabel = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  margin: var(--haze-space-1) 0 0;
`;

const wallSection = css`
  padding: var(--haze-space-8) var(--haze-space-4);
  max-width: 960px;
  margin: 0 auto;
`;

const wallGrid = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--haze-space-4);
`;

const wallCard = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
  min-height: 128px;
`;

const wallCaption = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--haze-color-text-muted);
  margin: 0;
`;

const wallDemo = css`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  gap: var(--haze-space-3);
`;

const wallValue = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  min-width: 2ch;
  text-align: center;
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

/** One row of src/generated/size-report.json (scripts/generate-size-report.mjs). */
type FamilySize = {
  family: string;
  cssBytes: number;
  cssGzipBytes: number;
};

type SizeReport = {
  generatedAt: string;
  distAvailable: boolean;
  families: FamilySize[];
  aggregate: FamilySize | null;
};

const sizeReport = sizeReportJson as SizeReport;

/** Live component count from the docgen pipeline — never hardcode this. */
const componentCount = Object.keys(propsJson.components).length;

const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;

/** Aggregate CSS numbers from the latest local build (size-report.json). */
const aggregateCss = sizeReport.aggregate;
const cssStatNumber = aggregateCss ? formatBytes(aggregateCss.cssGzipBytes) : '\u2014';
const cssStatLabel = aggregateCss
  ? `CSS full bundle \u00b7 ${formatBytes(aggregateCss.cssBytes)} raw`
  : 'CSS \u2014 run pnpm build';

const shippedCssCell = aggregateCss
  ? `~${formatBytes(aggregateCss.cssGzipBytes)} gzipped`
  : 'per-component CSS';

const lightweightDesc = aggregateCss
  ? `Full CSS bundle is ${formatBytes(aggregateCss.cssBytes)} (${formatBytes(aggregateCss.cssGzipBytes)} gzipped). Per-component imports ship even less.`
  : 'Tiny CSS footprint, no heavy dependencies. Designed for performance.';

const INSTALL_COMMAND = 'pnpm add haze-ui';

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
    title: `${componentCount}+ Components`,
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
    desc: lightweightDesc,
  },
  {
    icon: '\ud83c\udfaf',
    title: 'Customizable',
    desc: 'Override any design token with CSS variables. className passthrough on all components.',
  },
];

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
    cells: [shippedCssCell, 'varies', '\u2014', '\u2014', '\u2014'],
  },
] as const;

export default function Home() {
  // Bundle-size table ordering: gzip descending by default, toggleable.
  const [sizeSortDesc, setSizeSortDesc] = useState(true);
  // Hero install snippet: copy feedback flashes for ~1.5s.
  const { copied, copy } = useClipboard(1500);
  const sizeRows = [...sizeReport.families].sort((a, b) =>
    sizeSortDesc ? b.cssGzipBytes - a.cssGzipBytes : a.cssGzipBytes - b.cssGzipBytes
  );

  return (
    <div className={wrapper}>
      <section className={hero}>
        <Badge variant="info">v1.0</Badge>
        <h1 className={title}>Build faster with Haze UI</h1>
        <p className={subtitle}>
          A lightweight, accessible React component library with zero-runtime
          CSS-in-JS, design tokens, and {componentCount} production-ready components.
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
          <code className={installCommand}>
            <span className={installPrompt}>$</span>
            <span className={installCmd}>pnpm</span>
            <span className={installArg}>add haze-ui</span>
          </code>
          <button
            type="button"
            className={installCopyBtn}
            aria-label="Copy install command"
            onClick={() => {
              void copy(INSTALL_COMMAND);
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>

      <section className={statsSection}>
        <div className={statsGrid}>
          <Card variant="outlined" className={statCard}>
            <p className={statNumber}>{componentCount}</p>
            <p className={statLabel}>Components</p>
          </Card>
          <Card variant="outlined" className={statCard}>
            <p className={statNumber}>{cssStatNumber}</p>
            <p className={statLabel}>{cssStatLabel}</p>
          </Card>
          <Card variant="outlined" className={statCard}>
            <p className={statNumber}>0</p>
            <p className={statLabel}>Runtime JS for styles</p>
          </Card>
          <Card variant="outlined" className={statCard}>
            <p className={statNumber}>2</p>
            <p className={statLabel}>Built-in themes</p>
          </Card>
        </div>
      </section>

      <ComponentWall />

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

      <section className={sizeSection} id="bundle-size">
        <h2 className={sectionTitle}>Bundle size</h2>
        <p className={sectionSubtitle}>
          Per-family CSS, measured from the local library build. Ship tokens.css
          once, then only the components you render.
        </p>
        {sizeReport.distAvailable && sizeReport.aggregate ? (
          <>
            <div className={sizeToolbar}>
              <span className={sizeSummary}>
                {sizeReport.families.length} CSS families &middot; full bundle
                (haze-ui.css): {formatBytes(sizeReport.aggregate.cssBytes)} /{' '}
                {formatBytes(sizeReport.aggregate.cssGzipBytes)} gzip
              </span>
              <Button
                variant="outline"
                size="sm"
                aria-label={`Sort families by gzip size, currently ${sizeSortDesc ? 'descending' : 'ascending'}`}
                onClick={() => setSizeSortDesc((desc) => !desc)}
              >
                Sort by gzip {sizeSortDesc ? '\u2193' : '\u2191'}
              </Button>
            </div>
            <div className={sizeScroll}>
              <table className={sizeTable}>
                <thead>
                  <tr>
                    <th scope="col">Family</th>
                    <th scope="col">CSS</th>
                    <th scope="col">CSS (gzip)</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeRows.map((row) => (
                    <tr key={row.family}>
                      <th scope="row">{row.family}</th>
                      <td>{formatBytes(row.cssBytes)}</td>
                      <td>{formatBytes(row.cssGzipBytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={sizeNote}>
              Measured {new Date(sizeReport.generatedAt).toLocaleDateString()} by
              scripts/generate-size-report.mjs (gzip level 9) &middot; run pnpm
              build to regenerate.
            </p>
          </>
        ) : (
          <p className={sizeHint}>
            No local build output found &mdash; run pnpm build to regenerate this
            report.
          </p>
        )}
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

/**
 * Live component wall: every card renders a real, interactive haze-ui
 * component — not a screenshot. Controllable components follow the repo
 * demo contract (`const [v, setV, ctrl] = useControl(undefined, initial)`
 * + pass the `Control` handle); drive buttons flip state through `setV`.
 */
function ComponentWall() {
  const [switchOn, setSwitchOn, switchCtrl] = useControl(undefined, false);
  const [, , segmentCtrl] = useControl(undefined, 'week');
  const [sliderValue, , sliderCtrl] = useControl(undefined, 40);
  const [, setRating, ratingCtrl] = useControl(undefined, 3);
  const [, , emailCtrl] = useControl(undefined, '');
  const [, , pageCtrl] = useControl(undefined, 2);

  return (
    <section className={wallSection}>
      <h2 className={sectionTitle}>Real components, not screenshots</h2>
      <p className={sectionSubtitle}>
        Every control below is live — click, drag, and type your way through
        the actual library.
      </p>
      <div className={wallGrid}>
        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Button</h3>
          <div className={wallDemo}>
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="outline">Outline</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Switch</h3>
          <div className={wallDemo}>
            <Switch checked={switchCtrl} aria-label="Notifications" />
            <span className={wallValue}>{switchOn ? 'On' : 'Off'}</span>
            <Button size="sm" variant="ghost" onClick={() => setSwitchOn((v) => !v)}>
              Toggle
            </Button>
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Slider</h3>
          <div className={wallDemo}>
            <Slider value={sliderCtrl} aria-label="Opacity" />
            <span className={wallValue}>{sliderValue}%</span>
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Segmented</h3>
          <div className={wallDemo}>
            <Segmented options={['Day', 'Week', 'Month']} value={segmentCtrl} />
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Badge</h3>
          <div className={wallDemo}>
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Avatar Group</h3>
          <div className={wallDemo}>
            <AvatarGroup max={3} total={5}>
              <Avatar alt="Ada Lovelace" />
              <Avatar alt="Grace Hopper" />
              <Avatar alt="Alan Turing" />
              <Avatar alt="Katherine Johnson" />
              <Avatar alt="Margaret Hamilton" />
            </AvatarGroup>
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Rating</h3>
          <div className={wallDemo}>
            <Rating value={ratingCtrl} />
            <Button size="sm" variant="ghost" onClick={() => setRating(3)}>
              Reset
            </Button>
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Progress</h3>
          <div className={wallDemo}>
            <Progress value={72} />
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Chip</h3>
          <div className={wallDemo}>
            <Chip>Design</Chip>
            <Chip variant="outline" color="primary">React</Chip>
            <Chip color="success">Shipped</Chip>
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Tag</h3>
          <div className={wallDemo}>
            <Tag>Default</Tag>
            <Tag variant="primary">New</Tag>
            <Tag variant="success">Stable</Tag>
            <Tag variant="danger" closable>Deprecated</Tag>
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Input</h3>
          <div className={wallDemo}>
            <Input value={emailCtrl} placeholder="you@example.com" aria-label="Email address" />
          </div>
        </Card>

        <Card variant="outlined" className={wallCard}>
          <h3 className={wallCaption}>Pagination</h3>
          <div className={wallDemo}>
            <Pagination page={pageCtrl} total={50} aria-label="Demo pages" />
          </div>
        </Card>
      </div>
    </section>
  );
}
