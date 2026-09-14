/*
 * English source dictionary for the docs-site locale layer (./index.tsx).
 *
 * This is the extraction base: every user-visible string that the site
 * chrome (Layout/CommandPalette/SidebarSearch), Home, GettingStarted,
 * ComponentDetail and the sidebar component groups render lives here as
 * flat data, so zh.ts can override any subset (DeepPartial) while missing
 * keys fall back to these values.
 *
 * Conventions:
 *  - Plain strings for simple copy; `{placeholder}` tokens are expanded by
 *    `fill()` from ./index.tsx.
 *  - Paragraphs that mix prose with inline `<code>`/`<strong>` runs use
 *    RichText segments (GettingStarted) so the en rendering stays
 *    byte-identical to the hand-written JSX it replaced.
 *  - `components` is keyed by display name (component-groups.ts) — the
 *    one-line blurbs mirror scripts/generate-llms.mjs DESCRIPTIONS
 *    (backticks stripped for HTML rendering).
 */

/** One run of a rich paragraph: plain text, inline code, or bold text. */
export type RichSeg = string | { code: string } | { strong: string };

/** A paragraph rendered by `Rich` (./index.tsx). */
export type RichText = readonly RichSeg[];

/* Component one-liners (en source): keyed by display name, mirroring the
 * DESCRIPTIONS table in scripts/generate-llms.mjs (markdown backticks
 * stripped for HTML rendering). An open record — the dictionary parity
 * test pins key coverage against component-groups.ts. */
const COMPONENT_BLURBS = {
  Avatar:
    'User avatar with image, size variants and fallback content when the image is missing.',
  AvatarGroup:
    'Stacks avatars in overlapping rows with a +N overflow chip (max/total).',
  Badge: 'Small inline status label with variant and color options.',
  Button:
    'Action button with variant/size/square options; native <button> under the hood.',
  CountUp:
    'Animated number ticker: rAF + ease-out interpolation toward the target, honoring prefers-reduced-motion with an instant snap.',
  Divider: 'Content separator line, horizontal or vertical.',
  Ellipsis:
    'Interactive text truncation: N-line clamp with truncation detection, optional tooltip and expand/collapse.',
  Icon: 'Inline SVG icon wrapper with token-sized sm/md/lg boxes.',
  Tag: 'Compact status label with variant color and an optional close button.',
  TagGroup:
    'Flex-wrap container laying out Tag children with consistent gap; sortable + onReorder for drag reordering.',
  Typography: 'Text primitives: Title, Text, Paragraph on typography tokens.',

  // Layout
  AspectRatio: 'Boxes children to a fixed width/height ratio.',
  AppShell:
    'Application frame with sticky header, collapsible sidebar, content and footer slots; sidebar turns overlay below 768px.',
  Container: 'Centered max-width page container with horizontal padding.',
  Flex: 'Flexbox layout primitive mapping props to flex CSS.',
  Grid: 'CSS grid layout primitive.',
  Masonry:
    'Pinboard layout: JS greedy column distribution balances children across columns (order-first, shortest-column-next).',
  Resizable:
    'Split-pane group with draggable dividers (ResizableGroup, horizontal or vertical); also exported as SplitterGroup/SplitterPanel/SplitterHandle.',
  ScrollArea:
    'Scrollable region with custom-styled thin scrollbars and maxHeight.',
  Sidebar:
    'App sidebar shell with controllable collapsed state (aside + rail width tokens).',

  // Forms
  Cascader:
    'Multi-level drill-down selector committing a path of option values; onSearch filters remotely while loading shows the pending state.',
  Checkbox: 'Checkbox input with controllable checked state.',
  ColorPicker: 'Color selector with controllable value and preset swatches.',
  Combobox:
    'Autocomplete text input with filterable option list; onSearch defers filtering to the host.',
  Datepicker:
    'Date input with popup calendar (YYYY-MM-DD value); showTime adds a time-of-day field.',
  DateRangePicker:
    'Picks a start/end date range, with built-in or custom presets (Today, Last 7 days, …).',
  FileInput: 'Trigger element that opens a hidden native file input.',
  Form: 'react-f0rm field wrapper adding label, error and aria wiring to controlled cores.',
  InlineEdit: 'Click-to-edit text value in place.',
  Input: 'Text input with adornments; sugar over InputCore.',
  Mentions:
    'Mentions input with trigger-character suggestions picked from an option list.',
  NumberInput: 'Numeric input with min/max/step.',
  OTPInput: 'One-time-password input of length segmented character boxes.',
  PasswordInput: 'Text input with a visibility reveal toggle.',
  Radio: 'Radio option and group with controllable selection.',
  Rating: 'Star rating with half-step support.',
  Segmented: 'Segmented control selecting one option from a compact set.',
  Select:
    'Dropdown select over SelectCore with <option> children; onSearch enables server-side filtering.',
  Signature:
    'Canvas signature pad committing a PNG data URL on every stroke, with undo, clear and a no-canvas fallback notice.',
  Slider: 'Native range slider with controllable value.',
  Switch: 'Toggle switch (role="switch") with controllable checked.',
  TagInput:
    'Enter-to-commit token input over TagInputCore; sortable enables drag reordering (new order via onChange).',
  Textarea: 'Multiline text input.',
  TimePicker: 'Time-of-day input with controllable value.',
  Toggle:
    'Two-state pressed button (aria-pressed) with sizes and square icon mode; ToolbarToggle variant rides toolbar roving focus.',
  Transfer:
    'Two-column shuttle moving options between source and target lists.',
  TreeSelect:
    'Tree selection in a floating panel: selectable rows commit one key, cascading checkboxes commit string[], with panel search, lazy loadData and chip overflow.',
  Upload:
    'File picker with accumulating File[] value, accept/multiple, directory picking and listType rendering.',

  // Overlays
  BottomSheet: 'Mobile-style sheet sliding from the bottom screen edge.',
  ConfirmDialog:
    'Ready-made confirm dialog with confirm/cancel actions and a danger variant.',
  ContextMenu: 'Floating menu opened on right-click.',
  Dialog: 'Modal dialog with focus trapping.',
  Drawer: 'Edge-anchored sliding panel (placement left/right).',
  DropdownMenu: 'Click-triggered floating menu.',
  HoverCard:
    'Non-modal floating preview (avatar card, link summary) anchored to its trigger.',
  Menu: 'Lightweight toggle menu with a trigger and statically positioned panel (MenuItem, MenuDivider).',
  Popover: 'Floating popover anchored to a trigger element.',
  Tooltip: 'Hover/focus hint bubble.',

  // Data Display
  Accordion: 'Collapsible section list (AccordionItem with title).',
  Calendar: 'Month-grid date surface with min/max, locale and weekStartsOn.',
  Card: 'Content card with elevated/outlined/filled variants.',
  Carousel: 'Slideshow with controllable active index and autoplay.',
  Chart:
    'Line/area/bar/pie charts over recharts, colors and axes on haze tokens; series cycle the semantic palette, renderTooltip customizes the tooltip.',
  Chip: 'Rounded status chip with optional icon and close button.',
  CodeBlock:
    'Monospace code container with a language badge; highlight plugs in an async syntax highlighter.',
  DataTable:
    'Feature table on @tanstack/react-table (sorting, row selection, client or manual pagination); dataTableToCsv exports the rows.',
  Descriptions:
    'Definition-list description groups (dl/dt/dd on CSS Grid): items pairs, columns, bordered, size.',
  Image: 'Image with fallback and aspectRatio/objectFit control.',
  JsonView:
    'Collapsible JSON tree viewer with per-kind leaf colors, depth-based default expansion, truncation hints and an optional copy button.',
  Kbd: 'Keyboard key-cap styling for shortcuts.',
  List: 'Styled ul/ol/plain list variants.',
  Progress: 'Progress bar or circle driven by a percentage value.',
  QRCode:
    'QR code rendered as one crisp SVG path with value/size/level/bordered options and theme-token module/background colors.',
  Stat: 'Metric display with title, value and trend indicator.',
  Table: 'Styled semantic table (striped, bordered).',
  Timeline: 'Vertical timeline container for TimelineItem children.',
  Tree: 'Hierarchical tree with expand, select and check state, async loadData and searchValue filtering.',
  VirtualList:
    'Windowed list rendering only visible rows; fixed or measured dynamic heights.',
  Watermark:
    'Tiled canvas watermark layer over children (or fullscreen); theme-aware color, degrades gracefully without canvas 2d support.',

  // Navigation
  Affix: 'Fixes children to a viewport edge once scrolled past an offset.',
  Anchor:
    'Sticky scroll-spy navigation: items list highlighting the active section (IntersectionObserver, controllable activeId), click scrolls with offsetTop.',
  BackToTop: 'Floating scroll-to-top button appearing past a scroll threshold.',
  Breadcrumb: 'Breadcrumb trail nav with configurable separator.',
  Command:
    'Command palette surface: CommandInput plus filterable CommandItems.',
  FloatButton:
    'Floating action button over the page; FloatButtonGroup stacks actions behind an expand trigger, with back-to-top and help glyphs built in.',
  NavigationBar: 'Top nav bar with brand and end slots.',
  Pagination: 'Page navigation with controllable page and ellipsis windows.',
  Stepper: 'Step indicator driven by activeStep (Step children).',
  Tabs: 'Tab panel switcher with controllable active tab.',
  Toolbar:
    'Button group with toolbar a11y (roving tabindex; ToolbarButton, ToolbarSeparator).',
  Tour: 'Guided walkthrough spotlighting steps behind a mask, controllable current.',

  // Feedback
  Alert: 'Inline status message box.',
  AsyncSection: 'Declarative loading / error / content states for async data.',
  Banner: 'Dismissible top banner with info/success/warning/danger variants.',
  Empty: 'Empty-state placeholder with image and description.',
  Result:
    'Result feedback page: status illustration (success/error/info/warning/403/404/500), title, subTitle and an extra action area; icon replaces the default illustration.',
  Skeleton: 'Shimmering loading placeholder (text/circular/rectangular).',
  Spinner: 'Loading spinner.',
  Toast:
    'Toast notifications via useToast + ToastContainer (imperative toast() helper included).',

  // AI & Chat
  ApprovalCard:
    'Approval gate with approve / deny actions for agent-initiated operations.',
  ChatContainer:
    'Chat transcript scroll container with stick-to-bottom auto-scroll.',
  ChatInput: 'Message composer with a controllable value and onSend callback.',
  ChatMessage:
    'Chat bubble with role-based layout (user / assistant / system), avatar, name, timestamp and delivery status.',
  ConversationList:
    'Selectable list of conversations for a chat-history sidebar.',
  DiffViewer:
    'Renders the line diff between old and new content for agent-proposed edits.',
  FilePreview:
    'Attachment card with image thumbnail or extension badge, upload progress and remove/retry actions.',
  InlineCompletion:
    'Ghost-text completion overlay for input/textarea; Tab accepts the suggestion, Escape dismisses it.',
  LogViewer: 'Scrollable log stream with severity-level filtering.',
  MarkdownRenderer:
    'Renders markdown content (including code blocks) for assistant responses.',
  ModelPicker: 'Controllable dropdown for selecting the active model.',
  PromptInput:
    'AI prompt composer: auto-growing textarea with inline context tags, @-trigger suggestions and a configurable submit key.',
  Sources:
    'Numbered citation list for RAG answers; excerpts reveal on hover/focus with a controllable expanded set, compact renders inline [1] [2] badges.',
  StepTimeline:
    'Vertical timeline of agent execution steps with per-step status.',
  StreamingText:
    'Typewriter effect that reveals streaming text character by character, with an optional cursor.',
  ThinkingIndicator:
    'Animated bouncing-dots indicator that the agent is processing.',
  TokenCounter: 'Context-window token usage counter with budget progress.',
  ToolCallCard:
    'Card presenting an agent tool call — name, input, output and running state.',

  // Utilities
  Collapsible: 'Unstyled open/close container with controllable open state.',
  Disclosure: 'Summary-header disclosure panel (details/summary semantics).',
  Fullscreen:
    'Wrap-mode Fullscreen API binding around a single trigger child with controllable fullscreen state; useFullscreen() hook also exported.',
  LocaleProvider:
    'Supplies UI string packs (built-in English, zh-CN and ja-JP) to locale-aware components; direction (explicit or locale-derived) feeds useDirection(); createStrings(base, overrides) derives packs without forking the table.',
  ConfigProvider:
    'Component prop-default overrides (Button size, Toast duration/placement, Tooltip delay, HoverCard open/close delay) read via useConfigDefaults(); explicit props always win, providers nest with shallow per-section merge.',
  SwipeAction:
    'Swipe-to-reveal row actions on left/right edges with a commit threshold.',
};

export const en = {
  chrome: {
    openNavigation: 'Open navigation',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    language: 'Language',
    noCustomTheme: 'No custom theme',
    themeEditor: 'Theme Editor',
    viewSourceAt: 'View source at {version} ({commit})',
    viewSource: 'View source on GitHub',
    starOnGitHub: 'Star on GitHub',
    search: 'Search',
    searchComponents: 'Search components',
    searchPlaceholder: 'Search components…',
    clearSearch: 'Clear search',
    noComponentsMatch: 'No components match “{query}”',
    noResultsMatch: 'No results match “{query}”',
    docs: 'Docs',
  },
  nav: {
    home: 'Home',
    gettingStarted: 'Getting Started',
    recipes: 'Recipes',
    guides: 'Guides',
    tokens: 'Tokens',
    components: 'Components',
    overview: 'Overview',
    aiShowcase: 'AI Showcase',
    themeEditor: 'Theme Editor',
    changelog: 'Changelog',
    help: 'Help',
    about: 'About',
  },
  guides: {
    darkMode: 'Dark mode',
    density: 'Density (compact)',
    a11y: 'Accessibility',
    migration: 'Migrating from AntD / shadcn',
    streamingA11y: 'Streaming a11y',
    motion: 'Motion presets',
  },
  /* One-line summaries shown under the guide links (zh mode only for now;
   * the strings exist for both locales so any surface can adopt them). */
  guideSummaries: {
    darkMode:
      'The light/dark token classes, the useDarkMode hook and runtime brand themes.',
    density: 'Compact/comfortable spacing scales via density tokens.',
    a11y: 'Keyboard, screen-reader and WCAG practices baked into every component.',
    migration: 'Porting recipes from AntD or shadcn/ui to haze-ui.',
    streamingA11y:
      'Accessible streamed AI output: live regions, announcements and reduced motion.',
    motion:
      'data-state-driven enter/exit animation presets over the motion tokens.',
  },
  /* Sidebar component-group display names; keys mirror component-groups.ts. */
  componentGroups: {
    General: 'General',
    Layout: 'Layout',
    Forms: 'Forms',
    Overlays: 'Overlays',
    'Data Display': 'Data Display',
    Navigation: 'Navigation',
    Feedback: 'Feedback',
    'AI & Chat': 'AI & Chat',
    Utilities: 'Utilities',
  },
  /* One-line component blurbs, keyed by display name. Mirrors the
   * DESCRIPTIONS table in scripts/generate-llms.mjs (markdown backticks
   * stripped). Deliberately an open record: new components keep earning
   * entries without touching the dictionary type — the parity test pins
   * coverage against component-groups.ts instead. */
  components: COMPONENT_BLURBS as Record<string, string>,
  home: {
    hero: {
      title: 'Build faster with Haze UI',
      subtitle:
        'A lightweight, accessible React component library with zero-runtime CSS-in-JS, design tokens, and {count} production-ready components.',
      getStarted: 'Get Started',
      components: 'Components',
      copyAria: 'Copy install command',
      copied: 'Copied',
      copy: 'Copy',
    },
    stats: {
      components: 'Components',
      cssLabelFull: 'CSS full bundle · {raw} raw',
      cssLabelFallback: 'CSS — run pnpm build',
      runtimeJs: 'Runtime JS for styles',
      builtInThemes: 'Built-in themes',
    },
    wall: {
      title: 'Real components, not screenshots',
      subtitle:
        'Every control below is live — click, drag, and type your way through the actual library.',
    },
    features: {
      title: 'Why Haze UI?',
      subtitle:
        'Everything you need to build modern React interfaces, nothing you don\u2019t.',
      zeroRuntime: {
        title: 'Zero Runtime Overhead',
        desc: 'Styles are extracted at build time via Linaria. No runtime CSS-in-JS cost.',
      },
      designTokens: {
        title: 'Design Tokens',
        desc: 'Consistent theming through CSS custom properties. Light and dark themes built in.',
      },
      components: {
        title: '{count}+ Components',
        desc: 'From buttons to datepickers, all following Open UI standards for consistency.',
      },
      accessible: {
        title: 'Accessible',
        desc: 'Built on native HTML elements like <dialog> and <details> for built-in a11y.',
      },
      treeShakeable: {
        title: 'Tree-Shakeable',
        desc: 'ES module output with preserveModules. Import only what you use.',
      },
      controlled: {
        title: 'Controlled & Uncontrolled',
        desc: 'Form components support both modes via react-use-control.',
      },
      typescript: {
        title: 'TypeScript First',
        desc: 'Written in TypeScript with exported prop types for every component.',
      },
      lightweight: {
        title: 'Lightweight',
        descFull:
          'Full CSS bundle is {raw} ({gzip} gzipped). Per-component imports ship even less.',
        descFallback:
          'Tiny CSS footprint, no heavy dependencies. Designed for performance.',
      },
      customizable: {
        title: 'Customizable',
        desc: 'Override any design token with CSS variables. className passthrough on all components.',
      },
    },
    compare: {
      title: 'How it compares',
      subtitle:
        'Zero-runtime styling, one-prop state control, and AI components built in.',
      dimension: 'Dimension',
      rows: {
        stylingRuntime: 'Styling runtime',
        stateApi: 'State API',
        formBinding: 'Form binding',
        aiComponents: 'AI components',
        perComponentCss: 'Per-component CSS',
        shippedCss: 'Shipped CSS',
      },
      shippedFull: '~{gzip} gzipped',
      shippedFallback: 'per-component CSS',
    },
    size: {
      title: 'Bundle size',
      subtitle:
        'Per-family CSS, measured from the local library build. Ship tokens.css once, then only the components you render.',
      summary:
        '{families} CSS families \u00b7 full bundle (haze-ui.css): {raw} / {gzip} gzip',
      sortAriaDesc: 'Sort families by gzip size, currently descending',
      sortAriaAsc: 'Sort families by gzip size, currently ascending',
      sortLabel: 'Sort by gzip',
      family: 'Family',
      css: 'CSS',
      cssGzip: 'CSS (gzip)',
      note: 'Measured {date} by scripts/generate-size-report.mjs (gzip level 9) \u00b7 run pnpm build to regenerate.',
      hint: 'No local build output found — run pnpm build to regenerate this report.',
    },
    code: {
      title: 'Simple by design',
      subtitle:
        'Clean APIs that get out of your way. Here\u2019s what it looks like:',
      quickSetup: 'Quick setup',
      description:
        'Import the stylesheet (full bundle or per-component CSS), apply a theme class, and start using components. No providers, no context wrappers, no configuration files.',
    },
    footer: {
      license: 'MIT License',
      builtWith: 'Built with React 19',
    },
  },
  gettingStarted: {
    title: 'Getting Started',
    intro:
      'Get up and running with Haze UI in your React project in just a few minutes.',
    installation: {
      title: 'Installation',
      peers: [
        'Haze UI requires ',
        { code: 'react >= 19' },
        ' and ',
        { code: '@linaria/core >= 7' },
        ' as peer dependencies.',
      ],
      orOtherManagers: 'Or with other package managers:',
    },
    setup: {
      title: 'Setup',
      steps: [
        {
          lead: [
            { strong: 'Import the stylesheet' },
            ' — load the full bundle, or load tokens plus only the components you use.',
          ],
        },
        {
          lead: [
            { strong: 'Apply the theme' },
            ' — Wrap your app (or any subtree) with the theme class to activate design tokens.',
          ],
        },
        {
          lead: [
            { strong: 'Use components' },
            ' — Import and use any component directly.',
          ],
        },
      ],
    },
    theming: {
      title: 'Theming',
      tokensPara:
        'Haze UI uses CSS custom properties (design tokens) for all visual values. Two built-in themes are available:',
      overridePara:
        'You can override any token by setting the CSS variable on a parent element:',
      prefixNote: [
        'All tokens are prefixed with ',
        { code: '--haze-' },
        ' to avoid conflicts with other libraries. See the full list of tokens in the source code.',
      ],
      dtfPara: [
        'All tokens are also published in the W3C Design Tokens Format (DTF) — every token becomes a ',
        { code: '$value' },
        ' / ',
        { code: '$type' },
        " group entry — so design-tool pipelines can consume them without knowing haze-ui's CSS naming:",
      ],
      dtfNote:
        'The same JSON drops straight into Style Dictionary or Tokens Studio to keep Figma variables and platform token output in sync with the library.',
    },
    tailwind: {
      title: 'Using with Tailwind v4',
      intro: [
        'Haze UI tokens are ordinary CSS custom properties, so Tailwind v4 can consume them through ',
        { code: '@theme' },
        '. Alias the tokens you want as Tailwind color variables, then use the matching utilities:',
      ],
      inlineNote: [
        'Use ',
        { code: '@theme inline' },
        ', not plain ',
        { code: '@theme' },
        '. A plain block emits ',
        { code: ':root { --color-primary: var(--haze-color-primary) }' },
        ' and the var() is resolved once at ',
        { code: ':root' },
        ' — but Haze tokens are defined under the theme class, a descendant of ',
        { code: ':root' },
        ', so every alias collapses to nothing there. With ',
        { code: 'inline' },
        ', ',
        { code: 'bg-primary' },
        ' compiles to ',
        { code: 'background-color: var(--haze-color-primary)' },
        ' and resolves wherever the theme class is active.',
      ],
      cascadePara: [
        { strong: 'Cascade and load order.' },
        ' Haze UI CSS ships unlayered, while Tailwind v4 puts theme, preflight and utilities in ',
        { code: '@layer' },
        '. Unlayered author styles beat any layer regardless of import order or specificity, so when a utility and a Haze component set the same property (say, a Button\u2019s background), the component wins. Append Tailwind v4\u2019s trailing ',
        { code: '!' },
        ' (e.g. ',
        { code: 'w-full!' },
        ') when a utility must override a component. Utilities win normally on properties components do not set. Because of layers, it does not matter whether Haze CSS or Tailwind loads first — just make sure the tokens are loaded once in your app root.',
      ],
      preflightPara: [
        { strong: 'Preflight.' },
        ' Tailwind\u2019s reset lives in ',
        { code: '@layer base' },
        ' and only touches element defaults (borders, margins, button backgrounds). Haze components style themselves completely with unlayered token rules, so they render identically with preflight enabled — keep the default setup.',
      ],
    },
    controlled: {
      title: 'Controlled Components',
      intro: [
        'Form components support both controlled and uncontrolled modes via ',
        { code: 'react-use-control' },
        ':',
      ],
      outro: [
        'You can also pass plain values for simple uncontrolled usage — just omit the ',
        { code: 'value' },
        ' prop and the component manages its own state.',
      ],
    },
    ssr: {
      title: 'Server rendering (Next.js)',
      enforcedPara: [
        'Every Haze UI component renders on the server and hydrates without mismatches — the library contains no ',
        { code: 'window' },
        ' guards. This is enforced in-repo by two suites: ',
        { code: 'src/lib/ssr-render.node.test.tsx' },
        ' (23 cases through ',
        { code: 'renderToString' },
        ' in a real window-less node environment) and ',
        { code: 'src/lib/ssr-hydration.test.tsx' },
        ' (22 cases through ',
        { code: 'hydrateRoot' },
        ', asserting hydration warnings stay silent) — 45 cases total, exemption list empty. A runnable App Router project lives at ',
        { code: 'examples/nextjs' },
        '.',
      ],
      boundaryPara: [
        'Haze UI ships no ',
        { code: "'use client'" },
        ' directives — the boundary is yours to draw. Components own state and effects, so import them from a client component; that is exactly the path the SSR suites exercise (server render first, hydration second).',
      ],
      loadPara: [
        'Load the stylesheet once in the root layout, where global CSS belongs, and apply the theme classes to ',
        { code: '<body>' },
        ':',
      ],
      note: [
        'Haze UI requires ',
        { code: 'react >= 19' },
        ' (Next.js 15 or newer in the App Router) and ships ESM only — ',
        { code: "type: 'module'" },
        ', no CommonJS bundle. Next.js and Vite consume it out of the box; CommonJS servers should reach for ',
        { code: 'import()' },
        '. One deliberate exception to \u201ceverything ships in server HTML\u201d: ',
        { code: 'StreamingText' },
        ' intentionally renders an empty prefix plus cursor on the server and streams the text in on the client.',
      ],
    },
    typescript: {
      title: 'TypeScript',
      para: [
        'Haze UI is written in TypeScript and ships type declarations out of the box. All component props are exported as types:',
      ],
    },
    browser: {
      title: 'Browser Support',
      para: [
        'Haze UI targets modern browsers that support CSS custom properties and the ',
        { code: '<dialog>' },
        ' element:',
      ],
      browsers: ['Chrome / Edge 84+', 'Firefox 98+', 'Safari 15.4+'],
    },
  },
  componentDetail: {
    notFoundTitle: 'Component not found: {name}',
    notFoundHintSuggestions: 'No component lives at this URL. Did you mean:',
    notFoundHintPlain: 'No component lives at this URL.',
    backToAllComponents: 'Back to all components',
    copyImport: 'Copy import',
    copied: 'Copied',
  },
};

export type SiteStrings = typeof en;

/**
 * Override shape for locale dictionaries: every level optional, arrays
 * (RichText paragraphs) replaced wholesale, leaves keep their type.
 * A locale dictionary may only use keys that exist in `en` — the parity
 * test in i18n.test.tsx walks the object and rejects unknown keys.
 */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
