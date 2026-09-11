import { css } from '@linaria/core';

import { intro, page, section } from '@/views/ComponentDetail/styles';

/*
 * Accessibility statement page. Every number below is measured from the
 * repo (2026-09 snapshot) — re-run these before editing the constants:
 *   AXE_COMPONENT_FILES  grep -rl "axe(" src/lib/components --include='*.test.tsx' | wc -l
 *   (all component test  find src/lib/components -name '*.test.tsx' | wc -l
 *    files have scans)
 *   AXE_LIB_FILES        grep -rl "axe(" src/lib --include='*.test.tsx' | wc -l
 *   E2E_SPEC_FILES       ls e2e/*.spec.ts | wc -l
 *   E2E_CHROMIUM_TESTS   sum of test() per spec + the 29-iteration static
 *                        snapshots loop (16 source tests → 44 executed)
 *   ENGINE_SENSITIVE     e2e/playwright.config.ts firefox/webkit testMatch
 *   VISUAL_BASELINES     find e2e/__snapshots__ -name '*.png' | wc -l
 *   FOCUS_RING_FILES     grep -rl focus-ring src/lib/components --include='*.tsx'
 *                        | grep -v test | wc -l
 *   REDUCED_MOTION_TESTS grep -c '^\s*test(' e2e/reduced-motion.spec.ts
 * The APG pattern names follow https://www.w3.org/WAI/ARIA/apg/patterns/.
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

const tableWrap = css`
  overflow-x: auto;
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const a11yTable = css`
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

// Measured constants — see the header comment for the commands.
const AXE_COMPONENT_FILES = 122;
const AXE_LIB_FILES = 127;
const E2E_SPEC_FILES = 12;
const E2E_CHROMIUM_TESTS = 101;
const ENGINE_SENSITIVE_SPECS = 6;
const VISUAL_BASELINES = 45;
const FOCUS_RING_FILES = 53;
const REDUCED_MOTION_TESTS = 13;

const VERIFICATION_ROWS = [
  {
    layer: 'Unit (jsdom)',
    tooling: 'jest-axe',
    contract: `All ${AXE_COMPONENT_FILES} component test files — every component directory ships at least one, and each file renders its component and asserts zero axe violations on the WCAG-tagged rules. The best-practice-only region rule is disabled because a test harness is not a real document. Lib-wide, form, RTL and floating-primitive suites bring the total to ${AXE_LIB_FILES} scanning files.`,
  },
  {
    layer: 'E2E axe',
    tooling: '@axe-core/playwright',
    contract:
      'The demo harness scanned with the WCAG tags (wcag2a through wcag22aa) in closed and open states: open Popover and dropdown-menu panels, a shown toast, and FormItem with and without a validation error — 5 scans. Open panels are where the aria wiring lives (aria-controls, aria-activedescendant, panel-internal roles), so panels are scanned, not just triggers.',
  },
  {
    layer: 'Real-engine behavior',
    tooling: 'Playwright, 3 engines',
    contract: `${E2E_SPEC_FILES} spec files, ${E2E_CHROMIUM_TESTS} tests on the chromium projects. The ${ENGINE_SENSITIVE_SPECS} engine-sensitive specs — floating collision, popover, dialog, dropdown menu, rtl and keyboard-critical — run on chromium, firefox and webkit alike: real focus navigation, top-layer popover behavior and key dispatch are things jsdom cannot vouch for, so the same assertions must pass on every engine. A fourth project pins phone-viewport contracts (412×839, touch).`,
  },
  {
    layer: 'Visual baselines',
    tooling: 'Playwright screenshots',
    contract: `${VISUAL_BASELINES} pixel baselines: 29 static component sections plus 16 interaction frames (open panels, a dark-theme dialog, RTL mirrors). Layout regressions and color/contrast drift move pixels; a 2% diff ratio absorbs only platform rasterization noise.`,
  },
] as const;

const PATTERN_ROWS = [
  {
    component: 'Switch',
    pattern: 'Switch Pattern',
    keyboard:
      'Native button with role="switch" and aria-checked; Space/Enter toggle.',
  },
  {
    component: 'Checkbox, Radio',
    pattern: 'Checkbox / Radio (native)',
    keyboard:
      'Native inputs wrapped in labels — native activation keys and grouping for free.',
  },
  {
    component: 'Accordion, Disclosure',
    pattern: 'Disclosure (native details/summary)',
    keyboard:
      'Native summary activation; zero ARIA overrides needed — the platform already owns the semantics.',
  },
  {
    component:
      'Dialog, Drawer, BottomSheet, Image Preview, Command dialog, Tour',
    pattern: 'Dialog (Modal)',
    keyboard:
      'Native dialog element in the top layer; Esc cancels, Tab cycles inside the trapped scope, focus returns to the trigger on close, and the title is wired via aria-labelledby.',
  },
  {
    component: 'Popover',
    pattern: 'Non-modal disclosure',
    keyboard:
      'popover=auto gives Esc and outside-pointer light dismissal; the trigger span carries an honest role="button".',
  },
  {
    component: 'Dropdown Menu, Context Menu, Menu',
    pattern: 'Menu Button / Menu',
    keyboard:
      'Roving tabindex; arrows wrap skipping disabled items; Home/End jump; Escape and Tab close and return focus to the trigger; printable characters run typeahead (500 ms buffer); submenu arrows mirror under dir="rtl".',
  },
  {
    component: 'Select',
    pattern: 'Listbox (Combobox when filterable)',
    keyboard:
      'Enter/Space toggle the panel; arrows highlight via aria-activedescendant; Enter picks; Escape closes; Home/End jump; typing filters; Backspace drops the last chip in multiple mode.',
  },
  {
    component: 'Combobox',
    pattern: 'Combobox',
    keyboard:
      'Typing filters; ArrowDown/ArrowUp open the panel and move the highlight; Enter picks or toggles a chip; Backspace drops the last chip; Escape closes.',
  },
  {
    component: 'Mentions, Prompt Input',
    pattern: 'Combobox (inline popup)',
    keyboard:
      'The textarea/input owns aria-activedescendant into the open listbox only — a closed listbox never owns it.',
  },
  {
    component: 'Tree, Tree Select',
    pattern: 'Tree View',
    keyboard:
      'A single roving tab stop (tabindex 0/-1); arrows move, ArrowRight expands or descends, ArrowLeft collapses, Enter commits the selection.',
  },
  {
    component: 'Tabs',
    pattern: 'Tabs Pattern',
    keyboard:
      'Left/Right arrows with selection following focus; Home/End jump to the ends; keys mirror under dir="rtl".',
  },
  {
    component: 'Calendar',
    pattern: 'Grid (roving tabindex)',
    keyboard:
      'Arrows rove the day/month grid; PageUp/PageDown hop by month or year; Enter commits.',
  },
  {
    component: 'Slider',
    pattern: 'Slider (native range)',
    keyboard:
      'Native input[type=range] — arrows, Home/End and page keys come from the platform.',
  },
  {
    component: 'Rating',
    pattern: 'Radio group (roving)',
    keyboard:
      'Up/Down step the value (half steps with allowHalf); Left/Right mirror under dir="rtl"; Home/End jump; Space/Enter commit.',
  },
  {
    component: 'Toolbar',
    pattern: 'Toolbar',
    keyboard: 'Roving tabindex across its buttons and separators.',
  },
  {
    component: 'Progress',
    pattern: 'Progressbar',
    keyboard:
      'role="progressbar" with aria-valuenow/min/max; non-interactive by design.',
  },
  {
    component: 'Alert, Toast',
    pattern: 'Alert / Status',
    keyboard:
      'Danger toasts assert via role="alert"; everything else announces politely via role="status".',
  },
] as const;

export default function A11yGuide() {
  return (
    <div className={page}>
      <h1>Accessibility</h1>
      <p className={intro}>
        Accessibility in haze-ui is a set of engineering contracts, not a
        checklist: every interactive component ships an axe scan in its
        unit tests, keyboard behavior runs against real browser engines,
        focus is trapped and restored by shared primitives, and all motion
        collapses to zero when the user opts out. This page states what
        the library guarantees and where each guarantee is enforced —
        every number below is measured from this repository.
      </p>

      <div className={section}>
        <h2>Verification layers</h2>
        <p className={paragraph}>
          Four layers, each covering what the previous one cannot. The
          unit layer vouches for ARIA markup and interaction logic; the
          e2e layers vouch for behavior on real engines.
        </p>
        <div className={tableWrap}>
          <table className={a11yTable}>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Tooling</th>
                <th>Scope and contract</th>
              </tr>
            </thead>
            <tbody>
              {VERIFICATION_ROWS.map((row) => (
                <tr key={row.layer}>
                  <td>{row.layer}</td>
                  <td>
                    <code>{row.tooling}</code>
                  </td>
                  <td>{row.contract}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={section}>
        <h2>Component ARIA patterns</h2>
        <p className={paragraph}>
          Interactive components map to{' '}
          <a
            href='https://www.w3.org/WAI/ARIA/apg/patterns/'
            target='_blank'
            rel='noreferrer'
          >
            WAI-ARIA APG patterns
          </a>
          . Where the platform already provides the semantics —{' '}
          <code className={inlineCode}>details/summary</code>,{' '}
          <code className={inlineCode}>input[type=range]</code>, the
          native <code className={inlineCode}>dialog</code> element — the
          library uses the native element and adds ARIA only where native
          semantics stop. Fewer overrides means fewer ways to be wrong.
        </p>
        <div className={tableWrap}>
          <table className={a11yTable}>
            <thead>
              <tr>
                <th>Component</th>
                <th>APG pattern</th>
                <th>Keyboard behavior</th>
              </tr>
            </thead>
            <tbody>
              {PATTERN_ROWS.map((row) => (
                <tr key={row.component}>
                  <td>{row.component}</td>
                  <td>{row.pattern}</td>
                  <td>{row.keyboard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={section}>
        <h2>Keyboard conventions</h2>
        <p className={paragraph}>
          The contracts below are implemented once, as shared primitives,
          and consumed by every relevant component — so keyboard behavior
          cannot drift between components.
        </p>
        <div className={note}>
          <strong>Focus containment.</strong>{' '}
          <code className={inlineCode}>useFocusScope</code> traps the Tab
          cycle inside a scope (document-level Tab interception plus a
          focusout pull-back), supports initial autofocus and restores
          focus to the trigger on close. It backs every modal — Dialog,
          Drawer, BottomSheet, Confirm Dialog, the Command dialog, Image
          Preview — and the menu family.
        </div>
        <div className={note}>
          <strong>Roving tabindex as machinery.</strong>{' '}
          <code className={inlineCode}>useRovingTabindex</code> and{' '}
          <code className={inlineCode}>useMenuKeyboard</code> implement
          the APG roving contract a single time: one tab stop per
          container, main-axis arrows wrapping past disabled items,
          Home/End, typeahead, Escape/Tab-close with focus return, and
          orientation-aware keys that mirror under{' '}
          <code className={inlineCode}>dir=&quot;rtl&quot;</code>. Tree,
          Tabs, Menu, the context/dropdown menus, Rating, Calendar,
          Toolbar, Command and Cascader all consume them.
        </div>
        <div className={note}>
          <strong>The keyboard open path.</strong> Floating panels never
          open on pointer-driven focus: focus fires synchronously inside
          pointerdown, and a panel shown mid-gesture gets light-dismissed
          by the same click. Triggers toggle with Enter/Space, and panels
          open from the keyboard via ArrowDown or typing — Combobox
          enforces this with a regression test.
        </div>
        <div className={note}>
          <strong>Escape is universal.</strong> The{' '}
          <code className={inlineCode}>popover=auto</code> attribute
          gives Esc and outside-click light dismissal to every floating
          panel, and fourteen components additionally handle Escape
          explicitly in their own keymaps (BottomSheet, Calendar,
          Cascader, Combobox, ConfirmDialog, the DataTable cell editor,
          FloatButton, InlineCompletion, InlineEdit, Mentions, Prompt
          Input, Select, Tour and Tree Select).
        </div>
        <div className={note}>
          <strong>Focus is visible.</strong>{' '}
          {FOCUS_RING_FILES} component files style{' '}
          <code className={inlineCode}>:focus-visible</code> through the{' '}
          <code className={inlineCode}>--haze-color-focus-ring</code>{' '}
          token — an outline is never removed without a replacement.
        </div>
      </div>

      <div className={section}>
        <h2>Reduced motion</h2>
        <p className={paragraph}>
          The <code className={inlineCode}>motion</code> token class
          declares{' '}
          <code className={inlineCode}>--haze-duration-fast/normal/slow</code>{' '}
          (120/200/300 ms) and the easing curves; every transition and
          enter/exit animation in the library resolves through them.
          Inside{' '}
          <code className={inlineCode}>
            @media (prefers-reduced-motion: reduce)
          </code>{' '}
          all three durations collapse to 0 ms, so token-driven motion
          completes within a single frame — easing is left untouched
          because it is irrelevant at 0 ms. Custom properties inherit, so
          the media query covers every descendant of the token class and
          re-evaluates live when the OS preference flips.
        </p>
        <p className={paragraph}>
          The opt-in modal View Transitions (Dialog, Drawer, BottomSheet)
          skip <code className={inlineCode}>startViewTransition</code>{' '}
          entirely when the user prefers reduced motion or the engine
          lacks the API.{' '}
          {REDUCED_MOTION_TESTS} e2e tests pin the contract: under{' '}
          <code className={inlineCode}>emulateMedia</code> reduce, every
          computed duration resolves to 0 s and stays non-zero under
          no-preference — including after a live preference flip without
          a reload.
        </p>
      </div>

      <div className={section}>
        <h2>What unit tests cannot vouch for</h2>
        <p className={paragraph}>
          jsdom has no layout engine, no top layer and no real focus
          navigation — a unit suite can assert that the right attributes
          exist, not that a Tab keypress actually moves focus or that a
          popover survives engine-specific light-dismiss quirks. That is
          precisely the split this repo makes: jsdom vouches for ARIA
          markup and logic; the{' '}
          {ENGINE_SENSITIVE_SPECS} engine-sensitive e2e specs vouch for
          real focus movement, top-layer behavior, key dispatch and
          collision containment on chromium, firefox and webkit; pixel
          baselines (chromium only) vouch for visual regressions.
        </p>
        <p className={paragraph}>
          WCAG-tagged axe rules run at both the unit and e2e layers. The
          guarantee is scoped to what those rules and specs cover: full
          WCAG conformance of your application also depends on your
          content, labels and page structure.
        </p>
      </div>
    </div>
  );
}
