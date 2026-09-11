#!/usr/bin/env node
/**
 * Generate the shadcn CLI registries for haze-ui — two channels from one
 * pass (run AFTER `pnpm build`; dist/css-manifest.json is required; the
 * `pnpm build` script chains this):
 *
 * 1. GitHub registry (committed to git): root `registry.json` plus
 *    `registry/<item>.json` (flat registry-item payloads with wrapper
 *    source embedded as files[].content) and `registry/<item>.tsx`
 *    (wrapper sources). Since shadcn 2026-06 a public GitHub
 *    repository *is* a registry: the CLI reads the root registry.json
 *    and installs the repo files an item declares —
 *    `pnpm dlx shadcn@latest add wmzy/haze-ui/button`. The root index
 *    carries all items inline (an `include` list only accepts files
 *    literally named registry.json, so kebab-case per-item files cannot
 *    be composed via include), each item referencing its wrapper file
 *    by repo-relative path. The per-item JSONs additionally allow
 *    direct file-path installs (`wmzy/haze-ui/registry/button.json` —
 *    addresses ending in .json are read as files; the CLI only writes
 *    files with embedded content on that path, hence the duplication)
 *    and must stay flat registry-item payloads, not `{ items: [...] }`
 *    wrappers.
 *
 * 2. npm artifact: `dist/registry.json` (exported as `haze-ui/
 *    registry.json`, also served from unpkg). Same items, but the
 *    wrapper source is embedded as `files[].content` because a served
 *    payload has no repository to read paths from.
 *
 * ── Wrapper design ───────────────────────────────────────────────────
 * A shadcn registry normally vendors component *source* into the
 * consumer's project. That is not viable for haze-ui: the components are
 * compiled CSS-in-JS (linaria) whose classes only exist after a library
 * build, and every rule is written against `--haze-*` design tokens.
 * Copying the source would produce files that neither style nor build.
 *
 * So each registry item ships a thin *wrapper* file instead: it imports
 * the named component(s) from the npm package plus their stylesheet
 * (`haze-ui/css/<family>.css`, family resolved from the build's own
 * dist/css-manifest.json — never hand-maintained), and re-exports them.
 * `shadcn add wmzy/haze-ui/button` therefore yields a customization
 * layer the consumer owns, while `haze-ui` remains a normal npm
 * dependency that keeps updating underneath. Consumers apply the theme
 * exactly as the docs app and examples/ do: the `lightTheme` (+
 * `spacing` + `typography`) classes on a root element — see the wrapper
 * header (and the dedicated `tokens` item).
 *
 * Coverage: every *styled* named export of the main barrel
 * (src/lib/index.ts), grouped by css family. Multi-export directories
 * (Tabs/TabList/Tab/TabPanel, Resizable + its Splitter aliases, …)
 * merge into one item; the token classes (lightTheme/darkTheme/
 * spacing/typography across three modules) merge into the `tokens`
 * item. On top of the generated set, the hand-curated `haze-tokens`
 * item (a design-token onboarding guide installed as a markdown doc)
 * is carried over from the first manual iteration of this registry,
 * and a `base` meta item (type `registry:base`) references every
 * component item through `registryDependencies` — one command,
 * `shadcn add wmzy/haze-ui/base`, installs the whole design system.
 * Pure-logic exports (hooks, TOKEN_REGISTRY/COMPONENT_TOKENS,
 * LocaleProvider string packs, direction utils, the useControl
 * re-export, …) ship no css of their own and are skipped — the run log
 * lists them. Optional peer packages statically imported by a family's
 * sources (recharts, @tanstack/react-table, the dnd-kit trio,
 * react-f0rm) are detected from source and added to that item's
 * `dependencies`, so `shadcn add` installs them automatically.
 *
 * Every item also carries two metadata fields the shadcn CLI surfaces:
 * `docs` — a markdown usage string (one-line component description,
 * install command, token-activation notes) shown by `shadcn docs` —
 * and `categories` (kebab-case, mirrored from the demo sidebar groups
 * in src/views/Layout/component-groups.ts) for `shadcn search`
 * filtering.
 *
 * Static content under registry/ that the generator does not own and
 * never touches: README.md, tsconfig.json (typechecks the wrappers via
 * the package-name self-reference), haze-tokens/haze-tokens.md (the
 * curated doc item's file).
 *
 * The script self-checks both artifacts (required fields, unique
 * kebab-case names, non-empty paths/content, `haze-ui` dependency, root
 * index ↔ registry/ per-item files 1:1, referenced files exist) and
 * exits non-zero on failure.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const libDir = path.join(rootDir, 'src', 'lib');
const distDir = path.join(rootDir, 'dist');
const manifestPath = path.join(distDir, 'css-manifest.json');
const barrelPath = path.join(libDir, 'index.ts');
const registryDir = path.join(rootDir, 'registry');
const registryIndexPath = path.join(rootDir, 'registry.json');
const HOMEPAGE = 'https://github.com/wmzy/haze-ui';
const AUTHOR = 'wmzy <https://github.com/wmzy>';
const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json';
const ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';
const TOKENS_FAMILY = 'tokens';
// Files/directories under registry/ that are not generated per-item.
const REGISTRY_STATICS = new Set(['README.md', 'tsconfig.json', 'css.d.ts', 'haze-tokens']);

function fail(message) {
  console.error(`generate-registry: ${message}`);
  process.exit(1);
}

// ---- inputs: css-manifest (build artifact) + the whole main barrel ----

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(
    `cannot read ${path.relative(rootDir, manifestPath)} (${error.code ?? error.message}). ` +
      'It is produced by pnpm build via scripts/split-css.mjs — run the build first.'
  );
}

// module spec -> { values: [public export names], types: [...] }, in barrel order.
// Clause forms handled: `Button`, `default as LocaleProvider`, `XProps as YProps`.
const modules = new Map();
for (const m of readFileSync(barrelPath, 'utf8').matchAll(
  /^export\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/gm
)) {
  const [, isType, names, spec] = m;
  if (!modules.has(spec)) modules.set(spec, { values: [], types: [] });
  const bucket = isType ? 'types' : 'values';
  for (const clause of names.split(',')) {
    const words = clause.trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) modules.get(spec)[bucket].push(words[words.length - 1]);
  }
}
if (modules.size === 0) fail('main barrel parsed empty — barrel shape changed?');

// Optional peers (package.json peerDependenciesMeta) scanned for in family
// sources; `react` is assumed present in any shadcn CLI consumer project.
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const optionalPeers = Object.keys(pkg.peerDependenciesMeta ?? {})
  .filter((name) => pkg.peerDependenciesMeta[name].optional === true && name !== 'react')
  .sort();

// ---- group barrel exports into css-family items, collecting skips ----

// family -> { exports: [], types: [], modules: Set<spec> }
const families = new Map();
const skipped = [];
for (const [spec, mod] of modules) {
  if (!spec.startsWith('./')) {
    for (const name of mod.values) {
      skipped.push([name, `re-export of external package '${spec}' — depend on it directly`]);
    }
    for (const name of mod.types) {
      skipped.push([`type ${name}`, 'type of an external re-export']);
    }
    continue;
  }
  const moduleFamilies = [...new Set(mod.values.map((v) => manifest.families[v]))];
  if (moduleFamilies.length > 1) {
    fail(`${spec} spans multiple css families (${moduleFamilies.join(', ')}) — split the barrel export or teach the script the mapping`);
  }
  const family = moduleFamilies[0];
  if (family === undefined) {
    const untracked = mod.values.filter((v) => !manifest.noCss.includes(v));
    if (untracked.length > 0) {
      fail(`${spec} exports not present in css-manifest.json: ${untracked.join(', ')} — rerun pnpm build so the manifest catches up`);
    }
    for (const name of mod.values) {
      skipped.push([name, 'logic-only export — ships no css of its own (noCss in css-manifest)']);
    }
    for (const name of mod.types) {
      skipped.push([`type ${name}`, 'type of a css-less module, skipped with it']);
    }
    continue;
  }
  if (!families.has(family)) families.set(family, { exports: [], types: [], modules: new Set() });
  const entry = families.get(family);
  entry.exports.push(...mod.values);
  entry.types.push(...mod.types);
  entry.modules.add(spec);
}

// The manifest and the barrel must agree exactly.
const barrelValues = new Set([...modules.values()].flatMap((mod) => mod.values));
const staleFamilies = Object.keys(manifest.families).filter((name) => !barrelValues.has(name));
if (staleFamilies.length > 0) {
  fail(`css-manifest families not exported by the main barrel: ${staleFamilies.join(', ')} — rerun pnpm build`);
}

// ---- optional-peer detection from family sources ----------------------

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const peerImportPattern = (peer) =>
  new RegExp(`(?:from\\s+|import\\(\\s*)['"]${escapeRe(peer)}(?:/[^'"]*)?['"]`);

const listSourceFiles = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)) files.push(full);
  }
  return files;
};

// './components/Button' is a directory module; './tokens/colors' is a file
// module whose directory (src/lib/tokens) carries its siblings.
const moduleSourceDir = (spec) => {
  const base = path.join(libDir, spec.replace(/^\.\//, ''));
  if (!existsSync(base)) {
    for (const ext of ['.ts', '.tsx']) {
      if (existsSync(base + ext)) return path.dirname(base);
    }
  }
  return base;
};

const resolveLocalImport = (fromFile, spec) => {
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
};

// A family's runtime dependency set includes locally-imported modules
// outside its directory (e.g. TagInput → utils/sortable → @dnd-kit/core),
// so peer detection walks the relative-import closure, not just the dir.
// `valueOnly` strips type-only import/export statements first: they ship
// no runtime code (and no css), so the css closure below must not follow
// them, while peer detection keeps the conservative whole-file view.
const localImportClosure = (rootFiles, { valueOnly = false } = {}) => {
  const seen = new Set();
  const queue = [...rootFiles];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    let content = readFileSync(file, 'utf8');
    if (valueOnly) {
      content = content
        .replace(/^[ \t]*import\s+type\s[^\n]*$/gm, '')
        .replace(
          /^[ \t]*export\s+type\s+\{[\s\S]*?\}[ \t]*from[ \t]*['"][^'"]+['"];?[ \t]*$/gm,
          ''
        );
    }
    for (const m of content.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const resolved = resolveLocalImport(file, m[1]);
      if (resolved !== null) queue.push(resolved);
    }
  }
  return seen;
};

const extraDependencies = (entry) => {
  const found = new Set();
  for (const spec of entry.modules) {
    const dir = moduleSourceDir(spec);
    if (!existsSync(dir)) fail(`cannot resolve module '${spec}' to a source directory under src/lib`);
    for (const file of localImportClosure(listSourceFiles(dir))) {
      const content = readFileSync(file, 'utf8');
      for (const peer of optionalPeers) {
        if (peerImportPattern(peer).test(content)) found.add(peer);
      }
    }
  }
  return [...found].sort();
};

// ---- transitive css closure (wrapper stylesheet imports) ----------------
//
// A component family's wrapper must import the css of every css-carrying
// component it renders, not just its own: TreeSelect renders Tree and
// Chip, so its wrapper needs tree.css and chip.css beside tree-select.css
// (a flat manifest lookup would miss them — the css-manifest maps each
// export to its own defining family only). The closure walks value-only
// relative imports (type-only statements ship no css) and maps every
// reached file to its css family through the same whole-directory rule
// split-css.mjs groups by. utils/ modules are skipped: their css rides
// inside consumer families through split-css's sharedLayers. Modules
// without a css family of their own (LocaleProvider, hooks) drop out via
// the existing-families check.

const kebabCase = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').toLowerCase();

const existingFamilies = new Set(Object.values(manifest.families));

const cssFamilyOfSource = (file) => {
  const segments = path.relative(libDir, file).split(path.sep);
  if (segments[0] === 'components' && segments.length > 1) {
    const family = kebabCase(segments[1]);
    return existingFamilies.has(family) ? family : null;
  }
  if (segments[0] === 'form') return existingFamilies.has('form') ? 'form' : null;
  if (segments[0] === 'tokens') return TOKENS_FAMILY;
  return null;
};

/** Css families of every css-carrying module the family's sources reach
 *  through value-only relative imports (own family included). */
const cssClosure = (entry) => {
  const found = new Set();
  for (const spec of entry.modules) {
    const dir = moduleSourceDir(spec);
    if (!existsSync(dir)) fail(`cannot resolve module '${spec}' to a source directory under src/lib`);
    for (const file of localImportClosure(listSourceFiles(dir), { valueOnly: true })) {
      const family = cssFamilyOfSource(file);
      if (family !== null) found.add(family);
    }
  }
  return [...found].sort();
};

// ---- wrapper generation ------------------------------------------------

const wrapper = ({ components, types, css, extraCss = [] }) => {
  const importList = components.join(', ');
  // tokens first, then the family's own css, then every transitive css
  // family its sources render (see cssClosure) — deduped in order.
  const cssImports = [TOKENS_FAMILY, css, ...extraCss].filter(
    (family, index, all) => family !== undefined && all.indexOf(family) === index
  );
  const typeExport =
    types.length > 0 ? `export type { ${types.join(', ')} } from 'haze-ui';\n` : '';
  return `// haze-ui registry wrapper — generated by scripts/generate-registry.mjs.
//
// This is a thin wrapper around the published haze-ui npm package, not
// vendored component source: it re-exports the component(s) from
// 'haze-ui' and imports their stylesheet, so the package keeps updating
// underneath. Edit this file to customize — wrap, restyle, compose; that
// is what it is for. (haze-ui is compiled CSS-in-JS (linaria) styled
// against --haze-* design tokens, so vendoring the source would neither
// build nor style — forking this wrapper is the intended customization
// path.)
//
// Theming (once per app): apply the token classes to a root element, e.g.
//   import { lightTheme, spacing, typography } from 'haze-ui';
//   <div className={\`\${lightTheme} \${spacing} \${typography}\`}>…</div>
// (darkTheme is a drop-in swap). haze-ui dist modules ship their own
// 'use client' directive, so imports resolve cleanly from RSC; the
// wrapper inherits client semantics either way.

import { ${importList} } from 'haze-ui';

${cssImports.map((family) => `import 'haze-ui/css/${family}.css';`).join('\n')}

export { ${importList} };
${typeExport}`;
};

// One-line descriptions of the wrapped components (human-written, kept in
// sync with llms.txt's component blurbs).
const descriptions = {
  accordion: 'Collapsible section list with titled `AccordionItem` sections.',
  affix: 'Fixes children to a viewport edge once scrolled past an offset.',
  alert: 'Inline status message box.',
  anchor:
    'Sticky scroll-spy navigation: an `items` list highlighting the active section, click scrolls with an offset.',
  'app-shell':
    'Application frame with sticky header, collapsible sidebar, content and footer slots; the sidebar becomes an overlay below 768px.',
  'approval-card':
    'Approval gate with approve / deny actions for agent-initiated operations.',
  'aspect-ratio': 'Boxes children to a fixed width/height ratio.',
  'async-section': 'Declarative loading / error / content states for async data.',
  avatar: 'User avatar with image, size variants and fallback content when the image is missing.',
  'avatar-group':
    'Stacks avatars in overlapping rows with a `+N` overflow chip (`max`/`total`).',
  'back-to-top': 'Floating scroll-to-top button appearing past a scroll threshold.',
  badge: 'Small inline status label with variant and color options.',
  banner: 'Dismissible top banner with info/success/warning/danger variants.',
  'bottom-sheet': 'Mobile-style sheet sliding from the bottom screen edge.',
  breadcrumb: 'Breadcrumb trail nav with configurable separator.',
  button:
    'Action button with `variant`/`size`/`square` options over a native `<button>`; `ButtonLink` renders the same styles as an anchor.',
  calendar: 'Month-grid date surface with `min`/`max`, locale and `weekStartsOn`.',
  card: 'Content card with `elevated`/`outlined`/`filled` variants.',
  carousel: 'Slideshow with controllable active index and autoplay.',
  cascader:
    'Multi-level drill-down selector committing a path of option values; `onSearch` filters remotely, `loading` shows the pending state.',
  chart:
    'Line/area/bar/pie charts over recharts with colors and axes on haze tokens; series cycle the semantic palette, `renderTooltip` customizes the tooltip.',
  'chat-container': 'Chat transcript scroll container with stick-to-bottom auto-scroll.',
  'chat-input': 'Message composer with a controllable value and onSend callback.',
  'chat-message':
    'Chat bubble with role-based layout (user / assistant / system), avatar, name, timestamp and delivery status.',
  checkbox:
    'Checkbox input with controllable `checked` state; `CheckboxCore` is the headless form-bindable core.',
  chip: 'Rounded status chip with optional icon and close button.',
  'code-block':
    'Monospace code container with a language badge; `highlight` plugs in an async syntax highlighter.',
  collapsible:
    'Unstyled open/close container with controllable `open` state (`CollapsibleTrigger`, `CollapsibleContent`).',
  'color-picker': 'Color selector with controllable value and preset swatches.',
  combobox: 'Autocomplete text input with filterable option list; `onSearch` defers filtering to the host.',
  'count-up':
    'Animated number ticker: rAF + ease-out interpolation toward `to`, honoring `prefers-reduced-motion` with an instant snap.',
  command:
    'Command palette surface: `CommandInput` plus filterable `CommandItem`s in a `CommandList`.',
  'confirm-dialog': 'Ready-made confirm dialog with confirm/cancel actions and a danger variant.',
  container: 'Centered max-width page container with horizontal padding.',
  'context-menu': 'Floating menu opened on right-click.',
  'conversation-list': 'Selectable list of conversations for a chat-history sidebar.',
  'data-table':
    'Feature table on @tanstack/react-table with sorting, (manual) pagination, row selection and `dataTableToCsv` export.',
  'date-range-picker':
    'Picks a start/end date range, with built-in or custom `presets` (Today, Last 7 days, …).',
  datepicker:
    'Date input with popup calendar (`YYYY-MM-DD` value); `showTime` adds a time-of-day field. `DatepickerCore` is the headless core.',
  dialog: 'Modal dialog with focus trapping.',
  'diff-viewer': 'Renders the line diff between old and new content for agent-proposed edits.',
  disclosure: 'Summary-header disclosure panel (details/summary semantics).',
  divider: 'Content separator line, horizontal or vertical.',
  drawer: 'Edge-anchored sliding panel (`placement` left/right).',
  'dropdown-menu':
    'Click-triggered floating menu with `DropdownMenuTrigger`/`Content`/`Item`/`Separator` parts.',
  empty: 'Empty-state placeholder with image and description.',
  ellipsis:
    'Interactive text truncation: N-line clamp with truncation detection, optional tooltip and expand/collapse; Typography also ships a pure-CSS `ellipsis` prop.',
  'file-input': 'Trigger element that opens a hidden native file input.',
  flex: 'Flexbox layout primitive mapping props to flex CSS.',
  form: 'react-f0rm field wrapper adding label, error and aria wiring to controlled cores.',
  grid: 'CSS grid layout primitive with `GridItem` children.',
  'hover-card':
    'Non-modal floating preview (avatar card, link summary) anchored to its trigger.',
  icon: 'Inline SVG icon wrapper with token-sized `sm`/`md`/`lg` boxes.',
  image: 'Image with fallback and `aspectRatio`/`objectFit` control.',
  'inline-edit': 'Click-to-edit text value in place.',
  input: 'Text input with adornments; `InputCore` is the headless form-bindable core.',
  kbd: 'Keyboard key-cap styling for shortcuts.',
  list: 'Styled `ul`/`ol`/plain list with `ListItem` children.',
  'log-viewer': 'Scrollable log stream with severity-level filtering.',
  'markdown-renderer': 'Renders markdown content (including code blocks) for assistant responses.',
  mentions:
    'Mentions input with trigger-character suggestions picked from an option list (`MentionsCore` is the headless core).',
  menu: 'Lightweight toggle menu with a trigger and statically positioned panel (`MenuItem`, `MenuDivider`).',
  'model-picker': 'Controllable dropdown for selecting the active model.',
  'navigation-bar': 'Top nav bar with `brand` and `end` slots plus `NavLink` items.',
  'number-input': 'Numeric input with `min`/`max`/`step`.',
  'otp-input': 'One-time-password input of `length` segmented character boxes.',
  'pagination': 'Page navigation with controllable `page` and ellipsis windows.',
  'password-input': 'Text input with a visibility reveal toggle.',
  'popover': 'Floating popover anchored to a trigger element.',
  'prompt-input':
    'AI prompt composer: auto-growing textarea with inline context tags, `@`-trigger suggestions and a configurable submit key.',
  progress: 'Progress bar or circle driven by a percentage `value`.',
  'qr-code':
    'QR code rendered as one crisp SVG path over the `qrcode` optional peer; theme-token module/background colors with `value`/`size`/`level`/`bordered` options.',
  radio:
    'Radio option and group with controllable selection (`Radio`, `RadioGroup`, headless `RadioGroupCore`).',
  rating: 'Star rating with half-step support.',
  resizable:
    'Split-pane group with draggable dividers, horizontal or vertical; also exported as `SplitterGroup`/`SplitterPanel`/`SplitterHandle` (AntD-style naming).',
  result:
    'Result feedback page: status illustration (`success`/`error`/`info`/`warning`/`403`/`404`/`500`), `title`, `subTitle` and an `extra` action area; `icon` replaces the default illustration.',
  'scroll-area': 'Scrollable region with custom-styled thin scrollbars and `maxHeight`.',
  segmented: 'Segmented control selecting one option from a compact set.',
  select:
    'Dropdown select over `SelectCore` with `<option>` children; `onSearch` enables server-side filtering.',
  sidebar:
    'App sidebar shell with controllable collapsed state: `SidebarGroup`/`SidebarItem`/`SidebarFooter`/`SidebarToggle` parts.',
  skeleton: 'Shimmering loading placeholder (`text`/`circular`/`rectangular`).',
  slider: 'Native range slider with controllable value.',
  spinner: 'Loading spinner.',
  stat: 'Metric display with title, value and trend indicator (`StatGroup` container).',
  'step-timeline': 'Vertical timeline of agent execution steps with per-step status.',
  stepper: 'Step indicator driven by `activeStep` (`Step` children).',
  'streaming-text':
    'Typewriter effect that reveals streaming text character by character, with an optional cursor.',
  'swipe-action': 'Swipe-to-reveal row actions on left/right edges with a commit threshold.',
  switch: 'Toggle switch (`role="switch"`) with controllable `checked`.',
  table: 'Styled semantic table (`striped`, `bordered`) with head/body/row/cell parts.',
  tabs: 'Tab panel switcher with controllable active tab (`TabList`, `Tab`, `TabPanel`).',
  tag: 'Compact status label with variant color and optional close button.',
  'tag-group':
    'Flex-wrap container laying out Tag children with consistent gap; `SortableTagGroup` + `onReorder` for dnd-kit drag reordering.',
  'tag-input':
    'Enter-to-commit token input; `SortableTagInput` enables dnd-kit drag reordering (via `onChange`).',
  textarea: 'Multiline text input.',
  'thinking-indicator': 'Animated bouncing-dots indicator that the agent is processing.',
  'time-picker': 'Time-of-day input with controllable value.',
  timeline: 'Vertical timeline container for `TimelineItem` children.',
  toast: 'Toast notifications via `useToast` + `ToastContainer`, with the imperative `toast()` helper.',
  toggle: 'Two-state pressed button (`aria-pressed`) with sizes and `square` icon mode.',
  'token-counter': 'Context-window token usage counter with budget progress.',
  tokens:
    'Theme classes for haze-ui: `lightTheme`/`darkTheme` plus `spacing` and `typography`, applied to a root element to activate the `--haze-*` design tokens.',
  'tool-call-card': 'Card presenting an agent tool call — name, input, output and running state.',
  toolbar:
    'Button group with toolbar a11y (roving tabindex): `ToolbarButton`, `ToolbarSeparator`, `ToolbarToggle`.',
  tooltip: 'Hover/focus hint bubble.',
  tour: 'Guided walkthrough spotlighting `steps` behind a mask, controllable `current`.',
  transfer: 'Two-column shuttle moving options between source and target lists.',
  tree: 'Hierarchical tree with expand, select, check state, async `loadData` and `searchValue` filtering.',
  'tree-select':
    'Tree selection in a floating panel (AntD TreeSelect counterpart): selectable rows commit one key, cascading checkboxes commit `string[]`, with panel search, lazy `loadData` and chip overflow.',
  typography: 'Text primitives: `Title`, `Text`, `Paragraph` on typography tokens.',
  upload:
    'File picker with accumulating `File[]` value, `accept`/`multiple`, `directory` picking and `listType` rendering.',
  'virtual-list':
    'Windowed list rendering only visible rows; fixed or measured dynamic heights.',
  watermark:
    'Tiled canvas watermark layer over children (or `fullscreen`), theme-aware color.',
  descriptions:
    'Definition-list description groups (`dl`/`dt`/`dd` over CSS Grid): `items` pairs, `columns`, `bordered`, `size`.',
  'json-view':
    'Collapsible JSON tree viewer with per-kind leaf colors, depth-based default expansion, truncation hints and an optional copy button.',
  sources:
    'Numbered citation list for RAG answers; excerpts reveal on hover/focus with a controllable `expanded` set, `compact` footnote form included.',
  'file-preview':
    'Attachment card with image thumbnail or extension badge, size formatting, upload progress and remove/retry actions.',
  'inline-completion':
    'Ghost-text completion overlay for input/textarea: Tab accepts the suggestion, Escape dismisses it.',
  'float-button':
    'Floating action button over the page (`FloatButtonGroup` for expandable stacks) with built-in back-to-top and help glyphs.',
  masonry:
    'Masonry (pinboard) layout: JS greedy column distribution balances children across `columns`.',
  signature:
    'Canvas signature pad committing a PNG data URL on every stroke, with undo, clear and a no-canvas fallback notice.',
};

// Component categories for the shadcn `categories` field (search
// filtering), mirrored read-only from the demo sidebar grouping in
// src/views/Layout/component-groups.ts — 'AI & Chat' becomes `agent`;
// the non-component items (tokens, haze-tokens, base) use `theme`.
// Every css family must appear exactly once; the run fails on a
// missing entry (same contract as the descriptions table).
const CATEGORY_GROUPS = {
  general: [
    'avatar', 'avatar-group', 'badge', 'button', 'count-up', 'divider',
    'ellipsis', 'icon', 'tag', 'tag-group', 'typography',
  ],
  layout: [
    'aspect-ratio', 'app-shell', 'container', 'flex', 'grid', 'masonry',
    'resizable', 'scroll-area', 'sidebar',
  ],
  form: [
    'cascader', 'checkbox', 'color-picker', 'combobox', 'datepicker',
    'date-range-picker', 'file-input', 'form', 'inline-edit', 'input',
    'mentions', 'number-input', 'otp-input', 'password-input', 'radio',
    'rating', 'segmented', 'select', 'signature', 'slider', 'switch',
    'tag-input', 'textarea', 'time-picker', 'toggle', 'transfer',
    'tree-select', 'upload',
  ],
  overlay: [
    'bottom-sheet', 'confirm-dialog', 'context-menu', 'dialog', 'drawer',
    'dropdown-menu', 'hover-card', 'menu', 'popover', 'tooltip',
  ],
  'data-display': [
    'accordion', 'calendar', 'card', 'carousel', 'chart', 'chip',
    'code-block', 'data-table', 'descriptions', 'image', 'json-view', 'kbd',
    'list', 'progress', 'qr-code', 'stat', 'table', 'timeline', 'tree',
    'virtual-list', 'watermark',
  ],
  navigation: [
    'affix', 'anchor', 'back-to-top', 'breadcrumb', 'command',
    'float-button', 'navigation-bar', 'pagination', 'stepper', 'tabs',
    'toolbar', 'tour',
  ],
  feedback: [
    'alert', 'async-section', 'banner', 'empty', 'result', 'skeleton',
    'spinner', 'toast',
  ],
  agent: [
    'approval-card', 'chat-container', 'chat-input', 'chat-message',
    'conversation-list', 'diff-viewer', 'file-preview', 'inline-completion',
    'log-viewer', 'markdown-renderer', 'model-picker', 'prompt-input',
    'sources', 'step-timeline', 'streaming-text', 'thinking-indicator',
    'token-counter', 'tool-call-card',
  ],
  utilities: ['collapsible', 'disclosure', 'swipe-action'],
};

const categoryByFamily = new Map();
for (const [category, familyList] of Object.entries(CATEGORY_GROUPS)) {
  for (const family of familyList) {
    if (categoryByFamily.has(family)) {
      fail(`family "${family}" is listed in more than one CATEGORY_GROUPS entry`);
    }
    categoryByFamily.set(family, category);
  }
}
for (const family of categoryByFamily.keys()) {
  if (!families.has(family)) {
    fail(`CATEGORY_GROUPS lists "${family}" but no such css family exists — remove or fix the entry`);
  }
}

const categoryOf = (family) => {
  if (family === TOKENS_FAMILY) return 'theme';
  const category = categoryByFamily.get(family);
  if (category === undefined) {
    fail(`no category written for "${family}" — add it to CATEGORY_GROUPS (mirror src/views/Layout/component-groups.ts)`);
  }
  return category;
};

// ---- item docs (markdown `docs` field, shown by `shadcn docs`) --------

const REGISTRY_URL = 'https://github.com/wmzy/haze-ui/tree/main/registry';
const fence = (lang, lines) => ['```' + lang, ...lines, '```'].join('\n');
const THEME_SNIPPET = [
  "import { lightTheme, spacing, typography } from 'haze-ui';",
  '',
  '// on <body> or any root container — darkTheme is a drop-in swap',
  '<div className={`${lightTheme} ${spacing} ${typography}`}>…</div>',
];

const installSection = (name) => ['## Install', '', fence('bash', [`npx shadcn@latest add wmzy/haze-ui/${name}`])];

const themeSection = (family) => [
  '## Theming',
  '',
  ...(family === TOKENS_FAMILY
    ? [
        "This wrapper re-exports the 'lightTheme' (or 'darkTheme'), 'spacing' and",
        "'typography' classes from 'haze-ui' and imports 'haze-ui/css/tokens.css'.",
      ]
    : [
        'haze-ui ships JS and CSS separately — the installed wrapper already imports',
        `\`haze-ui/css/tokens.css\` and \`haze-ui/css/${family}.css\`, so no extra stylesheet setup is needed.`,
      ]),
  '',
  'Activate the design tokens by applying the classes to a root element:',
  '',
  fence('jsx', THEME_SNIPPET),
];

const componentDocs = (family, exports) =>
  [
    descriptions[family],
    '',
    `Exports: ${exports.map((name) => '`' + name + '`').join(', ')}.`,
    '',
    ...installSection(family),
    '',
    family === TOKENS_FAMILY
      ? 'The wrapper lands at `lib/haze/tokens.tsx` (via the `@lib/` target placeholder from `components.json`); the `haze-ui` npm package is installed automatically as a dependency.'
      : `The wrapper lands at \`components/ui/haze/${family}.tsx\` (via the \`@ui/\` target placeholder from \`components.json\`) and re-exports the component(s) from the \`haze-ui\` npm package, which is installed automatically.`,
    '',
    ...themeSection(family),
    '',
    `Details: ${REGISTRY_URL}`,
  ].join('\n');

const baseDocs = (itemCount) =>
  [
    'One command installs the entire haze-ui design system: the theme tokens',
    '(this item ships the token-activation wrapper) plus a thin re-export',
    `wrapper for every styled component — ${itemCount} registry items pulled`,
    'in through `registryDependencies`, resolved recursively by the CLI.',
    '',
    ...installSection('base'),
    '',
    'Each component wrapper lands at `components/ui/haze/<component>.tsx` and',
    're-exports its component from the `haze-ui` npm package (installed',
    'automatically), importing its stylesheet — no other setup is needed.',
    '',
    ...themeSection(TOKENS_FAMILY),
    '',
    `Details: ${REGISTRY_URL}`,
  ].join('\n');

// ---- assemble items ----------------------------------------------------

// { name, type, title, description, dependencies, files, content } —
// `content` is channel-specific and stripped when serializing.
const items = [];
for (const [family, entry] of [...families].sort(([a], [b]) => a.localeCompare(b))) {
  const description = descriptions[family];
  if (!description) fail(`no description written for "${family}" — add one to the descriptions table`);
  const isTokens = family === TOKENS_FAMILY;
  const type = isTokens ? 'registry:lib' : 'registry:ui';
  items.push({
    name: family,
    type,
    title: isTokens
      ? 'Theme tokens (lightTheme / darkTheme / spacing / typography)'
      : entry.exports.join(' / '),
    description,
    author: AUTHOR,
    docs: componentDocs(family, entry.exports),
    categories: [categoryOf(family)],
    dependencies: ['haze-ui', ...extraDependencies(entry)],
    files: [
      {
        path: `registry/${family}.tsx`,
        type,
        target: isTokens ? '@lib/haze/tokens.tsx' : `@ui/haze/${family}.tsx`,
      },
    ],
    content: wrapper({
      components: entry.exports,
      types: entry.types,
      css: family,
      extraCss: cssClosure(entry).filter((extra) => extra !== family),
    }),
  });
}

// Hand-curated doc item carried over from the first manual iteration of
// this registry (installs the token onboarding guide as a project doc).
const hazeTokensGuide = path.join(registryDir, 'haze-tokens', 'haze-tokens.md');
if (!existsSync(hazeTokensGuide)) {
  fail('registry/haze-tokens/haze-tokens.md is missing — restore it from git before regenerating');
}
items.push({
  name: 'haze-tokens',
  type: 'registry:item',
  title: 'Haze UI Tokens',
  description:
    'haze-ui 设计令牌（OKLCH 色板、间距、排版、动效）的引入与主题化指南。Design-token onboarding guide: where tokens.css lives and how to load, theme and interop it.',
  author: AUTHOR,
  docs:
    'haze-ui ships JS and CSS separately. Import the stylesheet once in your app entry: ' +
    "`import 'haze-ui/styles.css'` (full sheet) or `import 'haze-ui/css/tokens.css'` plus per-component CSS. " +
    "Activate tokens with the `lightTheme`/`darkTheme` + `spacing` + `typography` classes from 'haze-ui'. " +
    'Details: https://github.com/wmzy/haze-ui/tree/main/registry',
  dependencies: ['haze-ui'],
  categories: ['theme'],
  files: [
    {
      path: 'registry/haze-tokens/haze-tokens.md',
      type: 'registry:file',
      target: '~/docs/haze-tokens.md',
    },
  ],
  content: undefined, // doc item: the file lives in the repo, no wrapper to embed
});

// Meta item: one command installs the whole design system — the theme
// activation wrapper below plus every component item via
// registryDependencies (the CLI resolves those recursively, each bringing
// its own wrapper, stylesheet import and optional peers). Dependency
// entries are full GitHub item addresses (`<owner>/<repo>/<item>`), NOT
// plain names: the shadcn CLI resolves plain names against the official
// shadcn registry (styles/<style>/<name>.json), so `button` would install
// shadcn's own button instead of the haze-ui one — only owner/repo/item
// addresses resolve back into this repository's registry.json.
const tokensEntry = families.get(TOKENS_FAMILY);
if (!tokensEntry) fail('the tokens css family is missing — cannot build the base item');
const themeClasses = [...tokensEntry.exports].sort();
const componentItemNames = [...families.keys()].sort();
const registrySource = new URL(HOMEPAGE).pathname.replace(/^\//, '');
const ghItem = (name) => `${registrySource}/${name}`;
const baseWrapper = `// haze-ui registry base — generated by scripts/generate-registry.mjs.
//
// Meta item: 'npx shadcn add wmzy/haze-ui/base' installs the entire
// design system — this theme-activation wrapper plus, through
// registryDependencies, a thin wrapper for every styled component under
// components/ui/haze/. The implementation keeps coming from the haze-ui
// npm package; edit the wrappers to customize.
//
// Theming (once per app): apply the token classes to a root element, e.g.
//   import { lightTheme, spacing, typography } from 'haze-ui';
//   <div className={\`\${lightTheme} \${spacing} \${typography}\`}>…</div>
// (darkTheme is a drop-in swap).

import { ${themeClasses.join(', ')} } from 'haze-ui';

import 'haze-ui/css/tokens.css';

export { ${themeClasses.join(', ')} };
`;
items.push({
  name: 'base',
  type: 'registry:base',
  title: 'Haze UI base (tokens + every component wrapper)',
  description:
    'One-command setup of the whole haze-ui design system: theme tokens plus a thin wrapper for every styled component, pulled in through registryDependencies.',
  author: AUTHOR,
  docs: baseDocs(componentItemNames.length),
  categories: ['theme', 'setup'],
  dependencies: ['haze-ui'],
  registryDependencies: componentItemNames.map(ghItem),
  files: [
    {
      path: 'registry/base.tsx',
      type: 'registry:lib',
      target: '@lib/haze/base.tsx',
    },
  ],
  content: baseWrapper,
});
items.sort((a, b) => a.name.localeCompare(b.name));

// ---- write the GitHub registry (root index + registry/ directory) -----

const stripContent = (item) => {
  const { content, ...rest } = item;
  return rest;
};

const githubIndex = {
  $schema: REGISTRY_SCHEMA,
  name: 'haze-ui',
  homepage: HOMEPAGE,
  items: items.map(stripContent),
};
writeFileSync(registryIndexPath, `${JSON.stringify(githubIndex, null, 2)}\n`);

mkdirSync(registryDir, { recursive: true });
// Per-item flat payloads are self-contained: every `files[].content` is
// embedded (wrapper source, or the repo file for doc items) so the JSON
// also works through non-GitHub channels — direct .json address, URL
// fetch — the same shape `shadcn build` emits per item.
const flatItem = (item) => {
  const files = item.files.map((file, index) => ({
    ...file,
    content:
      typeof item.content === 'string' && index === 0
        ? item.content
        : readFileSync(path.join(rootDir, file.path), 'utf8'),
  }));
  return { $schema: ITEM_SCHEMA, ...stripContent(item), files };
};
for (const item of items) {
  writeFileSync(
    path.join(registryDir, `${item.name}.json`),
    `${JSON.stringify(flatItem(item), null, 2)}\n`
  );
  if (typeof item.content === 'string') {
    writeFileSync(path.join(registryDir, `${item.name}.tsx`), item.content);
  }
}
// Drop wrapper/payload files from previous runs whose item no longer
// exists. Never touch REGISTRY_STATICS or unknown entries (self-check
// flags those instead).
const expectedFiles = new Set(
  items.flatMap((item) => [
    `${item.name}.json`,
    ...(typeof item.content === 'string' ? [`${item.name}.tsx`] : []),
  ])
);
const removedStale = [];
for (const entry of readdirSync(registryDir)) {
  if (expectedFiles.has(entry) || REGISTRY_STATICS.has(entry)) continue;
  if (/^[a-z0-9]+(-[a-z0-9]+)*\.(json|tsx)$/.test(entry)) {
    rmSync(path.join(registryDir, entry));
    removedStale.push(entry);
  }
}

// ---- write the npm artifact (dist/registry.json, embedded content) ----

const distItems = items
  .filter((item) => typeof item.content === 'string')
  .map(({ name, type, title, description, author, docs, categories, dependencies, registryDependencies, content }) => ({
    name,
    type,
    title,
    description,
    author,
    docs,
    categories,
    dependencies,
    registryDependencies, // undefined on non-base items — dropped by JSON.stringify
    files: [{ path: `components/haze/${name}.tsx`, content, type }],
  }));
writeFileSync(
  path.join(distDir, 'registry.json'),
  `${JSON.stringify(
    { $schema: REGISTRY_SCHEMA, name: 'haze-ui', homepage: HOMEPAGE, items: distItems },
    null,
    2
  )}\n`
);

// ---- self-check: schema shape + cross-artifact consistency ------------

const problems = [];
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const checkItems = (label, list, { requireContent }) => {
  const seen = new Set();
  for (const item of list) {
    if (seen.has(item.name)) problems.push(`${label}: duplicate item name "${item.name}"`);
    seen.add(item.name);
    if (typeof item.name !== 'string' || !KEBAB.test(item.name)) {
      problems.push(`${label}: item name "${item.name}" is missing or not kebab-case`);
    }
    for (const field of ['type', 'title', 'description']) {
      if (typeof item[field] !== 'string' || item[field].trim() === '') {
        problems.push(`${label}: item "${item.name}" field "${field}" missing or empty`);
      }
    }
    if (typeof item.docs !== 'string' || item.docs.trim() === '') {
      problems.push(`${label}: item "${item.name}" field "docs" missing or empty`);
    }
    if (!Array.isArray(item.categories) || item.categories.length === 0) {
      problems.push(`${label}: item "${item.name}" field "categories" missing or empty`);
    } else {
      for (const category of item.categories) {
        if (typeof category !== 'string' || !KEBAB.test(category)) {
          problems.push(`${label}: item "${item.name}" category "${category}" is not lowercase kebab-case`);
        }
      }
    }
    if (item.registryDependencies !== undefined) {
      if (!Array.isArray(item.registryDependencies)) {
        problems.push(`${label}: item "${item.name}" field "registryDependencies" is not an array`);
      } else {
        for (const dep of item.registryDependencies) {
          // Plain names resolve against the OFFICIAL shadcn registry in the
          // CLI, so cross-item references must be owner/repo/item addresses.
          if (
            typeof dep !== 'string' ||
            !/^[^/\s]+\/[^/\s]+\/[a-z0-9]+(-[a-z0-9]+)*$/.test(dep)
          ) {
            problems.push(
              `${label}: item "${item.name}" registryDependency "${dep}" is not an <owner>/<repo>/<kebab-item> address`
            );
          }
        }
      }
    }
    if (!Array.isArray(item.files) || item.files.length === 0) {
      problems.push(`${label}: item "${item.name}" has no files`);
    }
    for (const file of item.files ?? []) {
      if (typeof file.path !== 'string' || file.path.trim() === '') {
        problems.push(`${label}: item "${item.name}" has a files[] entry with no path`);
      }
      if (typeof file.type !== 'string' || file.type.trim() === '') {
        problems.push(`${label}: item "${item.name}" file "${file.path}" has no type`);
      }
      if (file.type === 'registry:file' && typeof file.target !== 'string') {
        problems.push(`${label}: item "${item.name}" file "${file.path}" needs a target (registry:file)`);
      }
      if (requireContent && (typeof file.content !== 'string' || file.content.trim() === '')) {
        problems.push(`${label}: item "${item.name}" file "${file.path}" has no content`);
      }
    }
    if (!Array.isArray(item.dependencies) || !item.dependencies.includes('haze-ui')) {
      problems.push(`${label}: item "${item.name}" dependencies missing "haze-ui"`);
    }
  }
  return new Set(list.map((item) => item.name));
};

const githubNames = checkItems('registry.json', githubIndex.items, { requireContent: false });
checkItems('dist/registry.json', distItems, { requireContent: true });

// Root index ↔ registry/ directory: every item has a per-item JSON (and a
// .tsx when it wraps components), every generated file maps back to an
// item, and nothing unknown lingers at the top level.
const onDisk = new Set(readdirSync(registryDir));
const payloadStems = new Set();
for (const name of githubNames) {
  for (const ext of ['.json', '.tsx']) {
    if (ext === '.tsx' && !items.some((item) => item.name === name && typeof item.content === 'string')) {
      continue;
    }
    if (!onDisk.has(`${name}${ext}`)) {
      problems.push(`registry/: expected "registry/${name}${ext}" (declared by the root index) is missing`);
    }
  }
  const payloadPath = path.join(registryDir, `${name}.json`);
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8'));
  payloadStems.add(name);
  if (payload.name !== name) {
    problems.push(`registry/${name}.json declares name "${payload.name}"`);
  }
  const indexed = githubIndex.items.find((candidate) => candidate.name === name);
  const withoutContent = (files) => files.map(({ content, ...file }) => file);
  if (JSON.stringify(withoutContent(payload.files)) !== JSON.stringify(indexed.files)) {
    problems.push(`registry/${name}.json files differ from the root index entry`);
  }
  for (const file of payload.files) {
    if (typeof file.content !== 'string' || file.content.trim() === '') {
      problems.push(`registry/${name}.json file "${file.path}" has no embedded content`);
    }
  }
}
for (const entry of onDisk) {
  const stem = entry.replace(/\.(json|tsx)$/, '');
  if (REGISTRY_STATICS.has(entry)) continue;
  if (!payloadStems.has(stem)) problems.push(`registry/: "${entry}" has no item in the root index`);
}
// Every wrapper the index declares must exist and be non-empty; every css
// family from the build must be covered.
for (const item of githubIndex.items) {
  for (const file of item.files) {
    if (!existsSync(path.join(rootDir, file.path))) {
      problems.push(`registry.json: item "${item.name}" references missing file "${file.path}"`);
    }
  }
}
const manifestFamilies = new Set(Object.values(manifest.families));
for (const family of manifestFamilies) {
  if (!githubNames.has(family)) problems.push(`css family "${family}" from css-manifest has no registry item`);
}

// The base meta item must reference exactly the component item set:
// every registryDependencies entry resolves to a real item in this
// registry (strip the owner/repo/ address prefix), and every css family
// (tokens included) is covered — `shadcn add …/base` really installs the
// whole system.
const baseItems = githubIndex.items.filter((item) => item.name === 'base');
if (baseItems.length !== 1) {
  problems.push(`registry.json: expected exactly one "base" meta item, found ${baseItems.length}`);
} else {
  const depName = (dep) => dep.split('/').pop();
  const baseDeps = new Set((baseItems[0].registryDependencies ?? []).map(depName));
  for (const dep of baseItems[0].registryDependencies ?? []) {
    if (!githubNames.has(depName(dep))) {
      problems.push(`registry.json: base registryDependency "${dep}" matches no item`);
    }
    if (depName(dep) === 'base') problems.push('registry.json: base registryDependency includes itself');
  }
  for (const family of manifestFamilies) {
    if (!baseDeps.has(family)) {
      problems.push(`registry.json: base does not cover css family "${family}" — add it to the base item`);
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`generate-registry: self-check failed — ${problem}`);
  process.exit(1);
}

// ---- report ------------------------------------------------------------

const peerItems = items.filter((item) => item.dependencies.length > 1);
console.log(
  `generate-registry: ${items.length} items / ` +
    `${items.reduce((n, item) => n + item.title.split(' / ').length, 0)} components — ` +
    `root registry.json + registry/ (${expectedFiles.size} generated files) + dist/registry.json`
);
const baseReportItem = items.find((item) => item.name === 'base');
console.log(
  `  base item: registryDependencies on ${baseReportItem.registryDependencies.length} component items ` +
    `(tokens + every css family) — npx shadcn@latest add wmzy/haze-ui/base installs the whole system`
);
if (peerItems.length > 0) {
  console.log(
    `  optional peers added: ${peerItems
      .map((item) => `${item.name} → ${item.dependencies.slice(1).join(', ')}`)
      .join('; ')}`
  );
}
if (removedStale.length > 0) console.log(`  removed stale registry/ files: ${removedStale.join(', ')}`);
console.log(`  skipped exports (${skipped.length}):`);
for (const [name, reason] of skipped) console.log(`    ${name} — ${reason}`);
