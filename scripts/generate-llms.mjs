#!/usr/bin/env node
/**
 * Generate the repo-root llms.txt — the curated index for LLM coding agents.
 *
 * The file is split in three parts:
 *   1. a hand-written preamble (the template function below — install, CSS
 *      loading modes, architecture notes) with the component count
 *      interpolated;
 *   2. a generated "## Components" section — group headers and entries
 *      parsed straight from src/views/Layout/component-groups.ts (the demo
 *      sidebar contract: the same source of truth its coverage guard and
 *      scripts/generate-registry.mjs mirror), one bullet per entry using
 *      the DESCRIPTIONS table in this file;
 *   3. hand-written closing sections (design tokens, floating tiers,
 *      headless, forms, agent protocol, links).
 *
 * The DESCRIPTIONS table must name every sidebar entry — a missing blurb
 * fails the run, so adding a component without its sentence cannot pass
 * silently (same contract as generate-registry.mjs' descriptions table).
 *
 * The output is deterministic (no timestamps) so consecutive runs are
 * byte-identical.
 *
 * CLI:  node scripts/generate-llms.mjs
 * API:  import { writeLlms } from './scripts/generate-llms.mjs'
 *       (package.json build:demo regenerates it before vite build)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = () =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Display names for bullets that present a family, not a single component
 * (the sidebar key stays the canonical lookup). Unlisted entries render
 * their sidebar name.
 */
const DISPLAY_NAMES = {
  Radio: 'Radio / RadioGroup',
  Form: 'Form (FormItem)',
  FloatButton: 'FloatButton / FloatButtonGroup',
};

/**
 * One-line blurbs, keyed by the sidebar component name. Written by hand,
 * kept in sync with generate-registry.mjs' per-css-family descriptions.
 */
const DESCRIPTIONS = {
  // General
  Avatar:
    'user avatar with image, size variants and fallback content when the image is missing.',
  AvatarGroup:
    'stacks avatars in overlapping rows with a `+N` overflow chip (`max`/`total`).',
  Badge: 'small inline status label with variant and color options.',
  Button:
    'action button with `variant`/`size`/`square` options; native `<button>` under the hood.',
  CountUp:
    'animated number ticker: rAF + ease-out interpolation toward `to`, honoring `prefers-reduced-motion` with an instant snap.',
  Divider: 'content separator line, horizontal or vertical.',
  Ellipsis:
    'interactive text truncation: N-line clamp with truncation detection, optional tooltip and expand/collapse.',
  Icon: 'inline SVG icon wrapper with token-sized `sm`/`md`/`lg` boxes.',
  Tag: 'compact status label with variant color and an optional close button.',
  TagGroup:
    'flex-wrap container laying out Tag children with consistent gap; `sortable` + `onReorder(nextOrder)` for dnd-kit drag reordering.',
  Typography: 'text primitives: `Title`, `Text`, `Paragraph` on typography tokens.',

  // Layout
  AspectRatio: 'boxes children to a fixed width/height ratio.',
  AppShell:
    'application frame with sticky header, collapsible sidebar (`ControlOrValue`), content and footer slots; CSS-Grid layout, sidebar turns overlay below 768px.',
  Container: 'centered max-width page container with horizontal padding.',
  Flex: 'flexbox layout primitive mapping props to flex CSS.',
  Grid: 'CSS grid layout primitive.',
  Masonry:
    'pinboard layout: JS greedy column distribution balances children across `columns` (order-first, shortest-column-next).',
  Resizable:
    'split-pane group with draggable dividers (`ResizableGroup`, horizontal or vertical); also exported as `SplitterGroup`/`SplitterPanel`/`SplitterHandle` (AntD-style naming).',
  ScrollArea:
    'scrollable region with custom-styled thin scrollbars and `maxHeight`.',
  Sidebar:
    'app sidebar shell with controllable collapsed state (`aside` + rail width tokens).',

  // Forms
  Cascader:
    'multi-level drill-down selector committing a path of option values; `onSearch` filters remotely while `loading` shows the pending state.',
  Checkbox: 'checkbox input with controllable `checked` state.',
  ColorPicker: 'color selector with controllable value and preset swatches.',
  Combobox:
    'autocomplete text input with filterable option list; `onSearch` defers filtering to the host.',
  Datepicker:
    'date input with popup calendar (`YYYY-MM-DD` value); `showTime` adds a time-of-day field.',
  DateRangePicker:
    'picks a start/end date range, with built-in or custom `presets` (Today, Last 7 days, …).',
  FileInput: 'trigger element that opens a hidden native file input.',
  Form:
    'react-f0rm field wrapper adding label, error and aria wiring to controlled cores.',
  InlineEdit: 'click-to-edit text value in place.',
  Input: 'text input with adornments; sugar over `InputCore`.',
  Mentions:
    'mentions input with trigger-character suggestions picked from an option list.',
  NumberInput: 'numeric input with `min`/`max`/`step`.',
  OTPInput:
    'one-time-password input of `length` segmented character boxes.',
  PasswordInput: 'text input with a visibility reveal toggle.',
  Radio:
    'radio option and group with controllable selection.',
  Rating: 'star rating with half-step support.',
  Segmented: 'segmented control selecting one option from a compact set.',
  Select:
    'dropdown select over `SelectCore` with `<option>` children; `onSearch` enables server-side filtering.',
  Signature:
    'canvas signature pad committing a PNG data URL on every stroke, with undo, clear and a no-canvas fallback notice.',
  Slider: 'native range slider with controllable value.',
  Switch: 'toggle switch (`role="switch"`) with controllable `checked`.',
  TagInput:
    'enter-to-commit token input over `TagInputCore`; `sortable` enables dnd-kit drag reordering (new order via `onChange`).',
  Textarea: 'multiline text input.',
  TimePicker: 'time-of-day input with controllable value.',
  Toggle:
    'two-state pressed button (`aria-pressed`) with sizes and `square` icon mode; `ToolbarToggle` variant rides toolbar roving focus.',
  Transfer:
    'two-column shuttle moving options between source and target lists.',
  TreeSelect:
    'tree selection in a floating panel (AntD TreeSelect counterpart): selectable rows commit one key, cascading checkboxes commit `string[]`, with panel search, lazy `loadData` and chip overflow.',
  Upload:
    'file picker with accumulating `File[]` value, `accept`/`multiple`, `directory` picking and `listType` rendering.',

  // Overlays
  BottomSheet: 'mobile-style sheet sliding from the bottom screen edge.',
  ConfirmDialog:
    'ready-made confirm dialog with confirm/cancel actions and a danger variant.',
  ContextMenu: 'floating menu opened on right-click.',
  Dialog: 'modal dialog with focus trapping.',
  Drawer: 'edge-anchored sliding panel (`placement` left/right).',
  DropdownMenu: 'click-triggered floating menu.',
  HoverCard:
    'non-modal floating preview (avatar card, link summary) anchored to its trigger.',
  Menu:
    'lightweight toggle menu with a trigger and statically positioned panel (`MenuItem`, `MenuDivider`).',
  Popover: 'floating popover anchored to a trigger element.',
  Tooltip: 'hover/focus hint bubble.',

  // Data Display
  Accordion: 'collapsible section list (`AccordionItem` with `title`).',
  Calendar: 'month-grid date surface with `min`/`max`, locale and `weekStartsOn`.',
  Card: 'content card with `elevated`/`outlined`/`filled` variants.',
  Carousel: 'slideshow with controllable active index and autoplay.',
  Chart:
    'line/area/bar/pie charts over `recharts` (a haze-ui dependency), colors and axes on haze tokens; series cycle the semantic palette, `renderTooltip` customizes the tooltip.',
  Chip: 'rounded status chip with optional icon and close button.',
  CodeBlock:
    'monospace code container with a language badge; `highlight` plugs in an async syntax highlighter.',
  DataTable:
    'feature table on `@tanstack/react-table` (sorting, row selection, client or `manual` pagination); `dataTableToCsv` exports the rows.',
  Descriptions:
    'definition-list description groups (`dl`/`dt`/`dd` on CSS Grid): `items` pairs, `columns`, `bordered`, `size`.',
  Image: 'image with fallback and `aspectRatio`/`objectFit` control.',
  JsonView:
    'collapsible JSON tree viewer with per-kind leaf colors, depth-based default expansion, truncation hints and an optional copy button.',
  Kbd: 'keyboard key-cap styling for shortcuts.',
  List: 'styled `ul`/`ol`/plain list variants.',
  Progress: 'progress bar or circle driven by a percentage `value`.',
  QRCode:
    'QR code rendered as one crisp SVG path with `value`/`size`/`level`/`bordered` options and theme-token module/background colors.',
  Stat: 'metric display with title, value and trend indicator.',
  Table: 'styled semantic table (`striped`, `bordered`).',
  Timeline: 'vertical timeline container for `TimelineItem` children.',
  Tree:
    'hierarchical tree with expand, select and check state, async `loadData` and `searchValue` filtering.',
  VirtualList:
    'windowed list rendering only visible rows; fixed or measured dynamic heights.',
  Watermark:
    'tiled canvas watermark layer over children (or `fullscreen`); theme-aware color, degrades gracefully without canvas 2d support.',

  // Navigation
  Affix: 'fixes children to a viewport edge once scrolled past an offset.',
  Anchor:
    'sticky scroll-spy navigation: `items` list highlighting the active section (IntersectionObserver, controllable `activeId`), click scrolls with `offsetTop`.',
  BackToTop: 'floating scroll-to-top button appearing past a scroll threshold.',
  Breadcrumb: 'breadcrumb trail nav with configurable separator.',
  Command:
    'command palette surface: `CommandInput` plus filterable `CommandItem`s.',
  FloatButton:
    'floating action button over the page; `FloatButtonGroup` stacks actions behind an expand trigger, with back-to-top and help glyphs built in.',
  NavigationBar: 'top nav bar with `brand` and `end` slots.',
  Pagination: 'page navigation with controllable `page` and ellipsis windows.',
  Stepper: 'step indicator driven by `activeStep` (`Step` children).',
  Tabs: 'tab panel switcher with controllable active tab.',
  Toolbar:
    'button group with toolbar a11y (roving tabindex; `ToolbarButton`, `ToolbarSeparator`).',
  Tour:
    'guided walkthrough spotlighting `steps` behind a mask, controllable `current`.',

  // Feedback
  Alert: 'inline status message box.',
  AsyncSection:
    'declarative loading / error / content states for async data.',
  Banner:
    'dismissible top banner with info/success/warning/danger variants.',
  Empty: 'empty-state placeholder with image and description.',
  Result:
    'result feedback page: status illustration (`success`/`error`/`info`/`warning`/`403`/`404`/`500`), `title`, `subTitle` and an `extra` action area; `icon` replaces the default illustration.',
  Skeleton:
    'shimmering loading placeholder (`text`/`circular`/`rectangular`).',
  Spinner: 'loading spinner.',
  Toast:
    'toast notifications via `useToast` + `ToastContainer` (imperative `toast()` helper included).',

  // AI & Chat
  ApprovalCard:
    'approval gate with approve / deny actions for agent-initiated operations.',
  ChatContainer:
    'chat transcript scroll container with stick-to-bottom auto-scroll.',
  ChatInput: 'message composer with a controllable value and onSend callback.',
  ChatMessage:
    'chat bubble with role-based layout (user / assistant / system), avatar, name, timestamp and delivery status.',
  ConversationList:
    'selectable list of conversations for a chat-history sidebar.',
  DiffViewer:
    'renders the line diff between old and new content for agent-proposed edits.',
  FilePreview:
    'attachment card with image thumbnail or extension badge, upload progress and remove/retry actions.',
  InlineCompletion:
    'ghost-text completion overlay for input/textarea; Tab accepts the suggestion, Escape dismisses it.',
  LogViewer: 'scrollable log stream with severity-level filtering.',
  MarkdownRenderer:
    'renders markdown content (including code blocks) for assistant responses.',
  ModelPicker: 'controllable dropdown for selecting the active model.',
  PromptInput:
    'AI prompt composer: auto-growing textarea with inline context tags, `@`-trigger suggestions and a configurable submit key.',
  Sources:
    'numbered citation list for RAG answers; excerpts reveal on hover/focus with a controllable `expanded` set, `compact` renders inline `[1] [2]` badges.',
  StepTimeline:
    'vertical timeline of agent execution steps with per-step status.',
  StreamingText:
    'typewriter effect that reveals streaming text character by character, with an optional cursor.',
  ThinkingIndicator:
    'animated bouncing-dots indicator that the agent is processing.',
  TokenCounter: 'context-window token usage counter with budget progress.',
  ToolCallCard:
    'card presenting an agent tool call — name, input, output and running state.',

  // Utilities
  Collapsible:
    'unstyled open/close container with controllable `open` state.',
  Disclosure:
    'summary-header disclosure panel (details/summary semantics).',
  Fullscreen:
    'wrap-mode Fullscreen API binding around a single trigger child with controllable `fullscreen` state; `useFullscreen()` hook also exported.',
  LocaleProvider:
    'supplies UI string packs (built-in English, zh-CN and ja-JP) to locale-aware components; `direction` (explicit or locale-derived) feeds `useDirection()`; `createStrings(base, overrides)` derives packs without forking the table. RTL locales (ar/he/fa/…) are derived automatically.',
  ConfigProvider:
    'component prop-default overrides (Button size, Toast duration/placement, Tooltip delay, HoverCard open/close delay) read via `useConfigDefaults()`; explicit props always win, providers nest with shallow per-section merge, and components without a provider keep their built-in defaults.',
  SwipeAction:
    'swipe-to-reveal row actions on left/right edges with a commit threshold.',
};

/**
 * Parse the COMPONENT_GROUPS literal out of component-groups.ts. The file
 * is a TS module (imports '@/generated/props.json' and runs its coverage
 * guard at load time), so it cannot be imported here — the array literal
 * is stable, simple and guarded by the module's own assertions upstream.
 */
function parseGroups(rootDir) {
  const file = path.join(rootDir, 'src/views/Layout/component-groups.ts');
  const source = readFileSync(file, 'utf8');
  const marker = 'export const COMPONENT_GROUPS';
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`COMPONENT_GROUPS not found in ${path.relative(rootDir, file)}`);
  }
  const open = source.indexOf('[', start);
  const close = source.indexOf('\n];', open);
  if (open < 0 || close < 0) {
    throw new Error(`cannot locate the COMPONENT_GROUPS array literal in ${path.relative(rootDir, file)}`);
  }
  const groups = [];
  const token =
    /group: '([^']+)'|\{\s*name:\s*'([^']+)',\s*route:\s*'([^']+)'\s*\}/g;
  for (const match of source.slice(open, close).matchAll(token)) {
    if (match[1] !== undefined) {
      groups.push({ group: match[1], items: [] });
    } else if (groups.length > 0) {
      groups.at(-1).items.push({ name: match[2], route: match[3] });
    } else {
      throw new Error('component item found before any group header');
    }
  }
  if (groups.length === 0) {
    throw new Error('no groups parsed from component-groups.ts — shape changed?');
  }
  return groups;
}

function renderComponents(groups) {
  const lines = ['## Components', ''];
  for (const { group, items } of groups) {
    lines.push(`### ${group}`, '');
    for (const item of items) {
      const blurb = DESCRIPTIONS[item.name];
      if (blurb === undefined) {
        throw new Error(
          `no llms.txt blurb written for "${item.name}" — add it to DESCRIPTIONS in scripts/generate-llms.mjs`
        );
      }
      lines.push(`- **${DISPLAY_NAMES[item.name] ?? item.name}** — ${blurb}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

const preamble = (componentCount) => `# Haze UI

> React 19 UI component library built on the \`ControlOrValue<T>\` protocol: every stateful
> component accepts one state prop (\`checked?: Control<T> | T\`) that works controlled *and*
> uncontrolled, powered by [react-use-control](https://github.com/wmzy/react-use-control).

- [Full API reference (llms-full.txt)](llms-full.txt): every component's props, types,
  defaults and descriptions in one generated file.

${componentCount} components in 9 groups (see below), styled with Linaria (zero-runtime CSS-in-JS)
against \`--haze-*\` design tokens. ESM-only, \`preserveModules\` dist, tree-shakeable.
\`'use client'\` is pre-injected on interactive modules; 36 static, hook-free modules
(tokens + presentational components) ship without it and render as React Server
Components. RTL is systemic: logical CSS properties, mirrored horizontal-key
semantics and mirrored floating placements under \`dir="rtl"\`. Peer range
\`react: ^19.0.0\` — no React 18 compatibility layer.

## Install

\`\`\`sh
npm i haze-ui
\`\`\`

Only \`react\` and \`react-dom\` are peers. Every engine — \`react-f0rm\` (forms),
\`@tanstack/react-table\` (DataTable), \`recharts\` (Chart), the \`@dnd-kit\` trio
(sortable tags), \`qrcode\` (QRCode) — is a regular dependency installed with
haze-ui, and bundlers still tree-shake the ones your imports never reach.

shadcn CLI users can instead \`pnpm dlx shadcn@latest add wmzy/haze-ui/<item>\`
— this repo is a GitHub registry (root \`registry.json\`); each item installs a
thin wrapper that re-exports from the npm package (see \`registry/README.md\`).

## CSS: two loading modes

The JS entry imports no stylesheet — pick one mode:

\`\`\`jsx
// 1) Full stylesheet (simplest)
import 'haze-ui/styles.css';

// 2) Per-component CSS: tokens once + each component you use
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/button.css';
\`\`\`

Per-component files are kebab-case names, but sub-components and cores share their
directory's family file (\`InputCore\` → \`input.css\`). Don't hardcode the mapping:
\`haze-ui/css-manifest.json\` is the machine-readable, build-generated export → css-file
map (with family absorption and a \`noCss\` list) — tooling should read it instead of
re-deriving file names.
`;

const closing = `## Design tokens

Colors are generated in **OKLCH** from \`src/lib/tokens/palette.ts\`: 12-step primitive
scales (gray/blue/green/amber/red × light/dark) plus semantic aliases. Interaction
states (hover/active/subtle/focus-ring/border-hover) are **CSS relative-color formulas**
— \`oklch(from var(--haze-color-primary) calc(l - 0.045) c h)\` — so overriding
\`--haze-color-primary\` on a theme class re-derives the whole interaction family at
runtime, no rebuild. Themes ship as classes: apply \`lightTheme\` (or \`darkTheme\`) plus
\`spacing\` and \`typography\` to a root element. Browser baseline: Chrome/Edge 119+,
Safari 16.4+, Firefox 128+ (relative-color syntax, no hex fallbacks).
\`toDesignTokens()\` (from \`haze-ui/tokens\`) exports the registry as a
[W3C Design Tokens](https://tr.designtokens.org/) JSON file for Figma Tokens /
Tokens Studio. All tokens are plain CSS custom properties prefixed \`--haze-*\`.

## Floating overlays: three tiers

Popover, DropdownMenu, Tooltip, ContextMenu, Combobox and Datepicker panels pick an
engine by feature detection: (1) native \`popover\` attribute + CSS anchor positioning
(position-area grid with fallbacks), (2) \`popover\` alone, (3) a JS-positioned fallback.
Modern engines take tier 1; positioning and light-dismiss behavior stay consistent
across tiers. Panel placements are logical: under \`dir="rtl"\` the horizontal side
mirrors automatically (tier 1 uses logical \`position-area\` values where engines
accept them, tier 2 mirrors in JS).

Dialog, Drawer, BottomSheet, Popover and DropdownMenu accept a \`ref\` exposing
\`{ open(), close(), focusTrigger() }\` — the same state outlet as user interaction,
controlled-mode aware. Dialog, Drawer and BottomSheet also take a \`viewTransition?: boolean\`:
open/close flips wrapped in the View Transitions API (\`startViewTransition\` + \`flushSync\`),
auto-degrading without engine support or under reduced motion.

## Headless primitives

\`haze-ui/headless\` re-exports the behavior layer the components are built on —
\`useFloating\` (the three-tier floating engine), \`Presence\` (exit animations),
the focus-scope hooks and the \`computeFloatingPosition\` collision math — for
component authors assembling their own panels. Same source, same version as
the styled library; stable public API with the same semver commitment.

## Forms: react-f0rm integration

Form state belongs to [react-f0rm](https://github.com/wmzy/react-f0rm) (a haze-ui dependency).
haze-ui ships controlled cores — \`InputCore\`, \`SelectCore\`, \`SwitchCore\`, \`TextareaCore\`,
\`TagInputCore\`, \`TransferCore\`, \`UploadCore\`, \`CheckboxCore\`, … — that speak the plain
\`{value, onChange}\` pair its headless \`useField\` hook emits, with zero adapters.
\`FormItem\` wraps the hook's state in label, error and aria wiring, with declarative
binding via \`as\`/\`input\` props. The sugar components (\`Input\`, \`Select\`, …) keep the
\`ControlOrValue<T>\` API for standalone use outside forms.

## AI-friendly distribution

- \`haze-ui/registry.json\` (npm artifact; also at <https://unpkg.com/haze-ui/registry.json>)
  is a shadcn/ui-compatible registry covering every component family (plus a \`base\`
  meta item that installs the whole system in one command). Its items are thin wrapper
  files that re-export the published component and import its stylesheet — haze-ui stays
  an npm dependency underneath, so wrappers are your customization layer, not vendored
  source.
- \`haze-ui/css-manifest.json\` maps every export to its css file (see "CSS" above).

## For coding agents

A self-contained, machine-executable setup protocol — every step is copy-paste safe.

1. Install the library:

   \`\`\`sh
   npm i haze-ui
   \`\`\`

   \`react\` and \`react-dom\` are the only peers; all engine packages (form,
   table, chart, dnd, qr) arrive as regular dependencies and never enter
   the bundle for components you don't import.

   Peer range is \`react: ^19.0.0\`; there is no React 18 compatibility layer.

2. Load CSS — the JS entry imports no stylesheet, so pick one mode:

   \`\`\`jsx
   import 'haze-ui/styles.css'; // mode 1: full stylesheet (simplest)
   \`\`\`

   \`\`\`jsx
   import 'haze-ui/css/tokens.css'; // mode 2: tokens once…
   import 'haze-ui/css/button.css'; // …plus each component you use
   \`\`\`

3. Derive per-component CSS file names from \`haze-ui/css-manifest.json\`
   (build-generated export → css-file map, with family absorption and a
   \`noCss\` list) — never hardcode or re-derive file names yourself.

4. Stateful props are \`ControlOrValue<T>\`: pass a plain value for uncontrolled
   use, or a \`Control<T>\` from react-use-control for controlled use — one
   prop, no \`defaultXxx\` mirror API.

5. Every component's full props table (name/type/default/description, types
   verbatim from source) lives in [llms-full.txt](llms-full.txt) — generated,
   always current.

To install the agent components via the shadcn CLI instead, see README ›
Install via shadcn CLI.

## Links

- Docs & demos: <https://wmzy.github.io/haze-ui/>
- GitHub: <https://github.com/wmzy/haze-ui>
- npm: <https://www.npmjs.com/package/haze-ui>

The Components section above is generated from the demo sidebar contract
(\`src/views/Layout/component-groups.ts\`) plus the blurb table in
\`scripts/generate-llms.mjs\` — regenerate with \`node scripts/generate-llms.mjs\`
when the component set changes. The preamble and the closing sections are
maintained by hand.
`;

/** Build the full document. */
export function generateLlms(rootDir = defaultRoot()) {
  const groups = parseGroups(rootDir);
  const componentCount = groups.reduce((sum, group) => sum + group.items.length, 0);
  return `${preamble(componentCount)}\n${renderComponents(groups)}\n${closing}`;
}

/**
 * Write llms.txt at the repo root. Idempotent: when the generated content
 * is unchanged the file is not touched (keeps watcher/build timestamps
 * stable).
 */
export function writeLlms(rootDir = defaultRoot()) {
  const content = generateLlms(rootDir);
  const outFile = path.join(rootDir, 'llms.txt');
  const unchanged =
    existsSync(outFile) &&
    readFileSync(outFile, 'utf8').trimEnd() === content.trimEnd();
  if (!unchanged) {
    writeFileSync(outFile, content);
  }
  const groups = parseGroups(rootDir);
  return {
    changed: !unchanged,
    outFile,
    componentCount: groups.reduce((sum, g) => sum + g.items.length, 0),
    groupCount: groups.length,
  };
}

const invokedDirectly = () => {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
  } catch {
    return false;
  }
};

if (invokedDirectly()) {
  try {
    const started = Date.now();
    const { changed, outFile, componentCount, groupCount } = writeLlms();
    console.log(
      `generate-llms: ${componentCount} components in ${groupCount} groups, ${changed ? 'wrote' : 'unchanged'} ${path.relative(defaultRoot(), outFile)} in ${Date.now() - started}ms`
    );
  } catch (error) {
    console.error(
      `generate-llms: ${error instanceof Error ? error.stack : String(error)}`
    );
    process.exit(1);
  }
}
