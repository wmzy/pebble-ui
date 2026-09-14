import type { MotionPreset } from '@/lib/tokens';

import { useState } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';
import { Link } from '@native-router/react';

import { Button, CodeBlock, Flex, Switch } from '@/lib';
import { Presence } from '@/lib/headless';
import { motionPresets } from '@/lib/tokens';
import { intro, page, section } from '@/views/ComponentDetail/styles';

/*
 * Motion guide: the data-state-driven enter/exit pattern — the motion
 * token class, the motionPresets classes, and how Presence keeps an
 * exiting element mounted until its exit animation settles.
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

const tableWrap = css`
  overflow-x: auto;
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const presetTable = css`
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

/* Fixed-height stage: the card mounts/unmounts inside it without the
 * controls below jumping around the layout shift. */
const demoStage = css`
  min-height: 148px;
  border: 1px dashed var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4);
  margin: var(--haze-space-4) 0 var(--haze-space-2);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const demoCard = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg-subtle);
  padding: var(--haze-space-4) var(--haze-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-1);
  align-items: center;
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
  box-shadow: var(--haze-shadow-sm);
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

const PRESETS: readonly MotionPreset[] = [
  'fade',
  'fadeScale',
  'slideUp',
  'slideDown',
  'slideLeft',
  'slideRight',
];

/**
 * The pattern in miniature: one control drives both the Switch and
 * Presence (the ControlOrValue idiom), Presence injects data-state and
 * defers the unmount while the preset's exit keyframes play, and the
 * preset class itself is the only styling involved.
 */
function PresetPlaygroundDemo() {
  const [preset, setPreset] = useState<MotionPreset>('fadeScale');
  // One control, two consumers: the Switch writes it, Presence reads it.
  const [shown, , shownCtrl] = useControl(undefined, true);

  return (
    <div>
      <Flex gap='var(--haze-space-2)' wrap align='center'>
        {PRESETS.map((name) => (
          <Button
            key={name}
            size='sm'
            variant={preset === name ? 'solid' : 'ghost'}
            onClick={() => setPreset(name)}
          >
            {name}
          </Button>
        ))}
        <Switch checked={shownCtrl} aria-label='Toggle the animated card' />
      </Flex>
      <div className={demoStage}>
        <Presence present={shown}>
          <div x-class={[demoCard, motionPresets[preset]]}>
            <strong>{preset}</strong>
            <span className={demoStatus}>
              data-state: {shown ? 'open' : 'closed'}
            </span>
          </div>
        </Presence>
      </div>
      <p className={demoCaption}>
        Flip the switch off and watch the card leave with the preset&apos;s
        exit animation instead of vanishing — then flip it back on mid-exit:
        Presence cancels the unmount and re-enters from the start. Enable your
        OS &ldquo;reduce motion&rdquo; preference and every preset collapses to
        an instant swap.
      </p>
    </div>
  );
}

export default function MotionGuide() {
  return (
    <div className={page}>
      <h1>Motion presets</h1>
      <p className={intro}>
        haze-ui animates mount and unmount with plain CSS: one class from{' '}
        <code className={inlineCode}>motionPresets</code> on the element, and
        a <code className={inlineCode}>data-state</code> attribute that
        flips between <code className={inlineCode}>&apos;open&apos;</code>{' '}
        and <code className={inlineCode}>&apos;closed&apos;</code>. The open
        state plays the enter keyframes, the closed state plays the exit
        keyframes, and the <code className={inlineCode}>Presence</code>{' '}
        primitive from <code className={inlineCode}>haze-ui/headless</code>{' '}
        keeps the element mounted until the exit finishes. No animation
        library, no JS touching <code className={inlineCode}>style</code>.
      </p>

      <div className={section}>
        <h2>The pattern: one class plus data-state</h2>
        <p className={paragraph}>
          A preset is a single Linaria class that targets its own host
          element through the attribute selectors{' '}
          <code className={inlineCode}>&amp;[data-state=&apos;open&apos;]</code>{' '}
          and{' '}
          <code className={inlineCode}>&amp;[data-state=&apos;closed&apos;]</code>.
          Because the selectors match on the element itself, the class works
          anywhere — your own components, haze-ui components that mirror
          their open state as <code className={inlineCode}>data-state</code>{' '}
          (animated floating panels do exactly this), or a bare{' '}
          <code className={inlineCode}>&lt;div&gt;</code>:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { motionPresets } from 'haze-ui';
// or: from 'haze-ui/tokens'

// Statically mounted: flips data-state itself
<div className={motionPresets.fadeScale} data-state={open ? 'open' : 'closed'}>
  Card content
</div>`}
        </CodeBlock>
        <p className={paragraph}>
          The exit rule carries{' '}
          <code className={inlineCode}>animation-fill-mode: forwards</code>,
          so a finished exit holds its end state (opacity 0, offset
          transform) instead of flashing back to the resting look for the
          frames between &ldquo;closed&rdquo; and the actual unmount.
        </p>
      </div>

      <div className={section}>
        <h2>Animating the unmount with Presence</h2>
        <p className={paragraph}>
          The catch with exit animations is React itself: the moment a
          conditional render flips, the element is gone — the exit keyframes
          never get a frame to play.{' '}
          <code className={inlineCode}>Presence</code> bridges that gap. It
          injects <code className={inlineCode}>data-state</code> (
          <code className={inlineCode}>&apos;open&apos;</code> when present,{' '}
          <code className={inlineCode}>&apos;closed&apos;</code> the instant{' '}
          <code className={inlineCode}>present</code> turns false) and keeps
          the child mounted until{' '}
          <code className={inlineCode}>whenExitSettles</code> observes the
          closing animation finish:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { useControl } from 'react-use-control';
import { Switch } from 'haze-ui';
import { Presence } from 'haze-ui/headless';
import { motionPresets } from 'haze-ui';

function AnimatedCard() {
  // One control, two consumers: the Switch writes it, Presence reads it
  const [shown, , shownControl] = useControl(undefined, true);

  return (
    <>
      <Switch checked={shownControl} aria-label='Toggle the card' />
      <Presence present={shown}>
        <div className={motionPresets.slideUp}>
          Rises in from just below, sinks back out on exit.
        </div>
      </Presence>
    </>
  );
}`}
        </CodeBlock>
        <div className={note}>
          Everything is coordinating through the one boolean: the Switch
          writes the control, <code className={inlineCode}>Presence</code>{' '}
          reads the resolved value. That is the same ControlOrValue contract
          every stateful haze-ui component offers — the demo above is your
          component with different names. Re-presenting mid-exit is handled:
          Presence flips the attribute back to{' '}
          <code className={inlineCode}>&apos;open&apos;</code> and the
          abandoned settle cannot unmount a card that is open again.
        </div>
        <PresetPlaygroundDemo />
      </div>

      <div className={section}>
        <h2>The preset gallery</h2>
        <p className={paragraph}>
          Slide names describe the direction the element{' '}
          <em>travels on enter</em>; the exit reverses it, so the element
          always leaves toward the side it arrived from. Slides fade as they
          travel (a pure translate reads as sliding glass over content), and
          the travel distance is a spacing token — a{' '}
          <Link to='/guides/density'>compacted</Link> subtree slides
          shorter.
        </p>
        <div className={tableWrap}>
          <table className={presetTable}>
            <thead>
              <tr>
                <th>Preset</th>
                <th>Enter</th>
                <th>Exit</th>
                <th>Reaches for</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>fade</code>
                </td>
                <td>opacity 0 → 1</td>
                <td>opacity 1 → 0</td>
                <td>
                  The safe default, and the only transform-free preset —
                  this is what animated floating panels (Popover,
                  DropdownMenu, Select, Tooltip) use.
                </td>
              </tr>
              <tr>
                <td>
                  <code>fadeScale</code>
                </td>
                <td>
                  opacity 0 + scale 0.97 → 1
                </td>
                <td>
                  1 → opacity 0 + scale 0.97
                </td>
                <td>
                  Centered surfaces that own the viewport focus: dialogs,
                  image previews, cards stepping in.
                </td>
              </tr>
              <tr>
                <td>
                  <code>slideUp</code>
                </td>
                <td>
                  rises from <code>--haze-space-4</code> below
                </td>
                <td>sinks back down</td>
                <td>
                  Bottom-anchored things: bottom sheets, snackbars, menus
                  opening under a trigger.
                </td>
              </tr>
              <tr>
                <td>
                  <code>slideDown</code>
                </td>
                <td>
                  descends from <code>--haze-space-4</code> above
                </td>
                <td>rises back up</td>
                <td>
                  Top-anchored things: banners, dropdown rows opening
                  downward from a header bar.
                </td>
              </tr>
              <tr>
                <td>
                  <code>slideLeft</code>
                </td>
                <td>
                  arrives from <code>--haze-space-4</code> right
                </td>
                <td>leaves back right</td>
                <td>
                  Panels that belong to the right edge, or content moving
                  leftward through a carousel step.
                </td>
              </tr>
              <tr>
                <td>
                  <code>slideRight</code>
                </td>
                <td>
                  arrives from <code>--haze-space-4</code> left
                </td>
                <td>leaves back left</td>
                <td>
                  Panels that belong to the left edge (drawers, sidebars),
                  or content moving rightward.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={paragraph}>
          Enter runs at{' '}
          <code className={inlineCode}>--haze-duration-normal</code> (200ms),
          exit at <code className={inlineCode}>--haze-duration-fast</code>{' '}
          (120ms) — exits read snappier at the same perceived
          responsiveness. Both ease with{' '}
          <code className={inlineCode}>--haze-ease</code>.
        </p>
      </div>

      <div className={section}>
        <h2>The motion token class</h2>
        <p className={paragraph}>
          Presets read their timing from the motion tokens — duration and
          easing custom properties declared by the{' '}
          <code className={inlineCode}>motion</code> class, the same way
          colors come from <code className={inlineCode}>lightTheme</code>/
          <code className={inlineCode}>darkTheme</code> and spacing from{' '}
          <code className={inlineCode}>spacing</code>. Put it on your theme
          root next to the other token classes:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`import { lightTheme, spacing, typography, motion } from 'haze-ui';

<div className={\`\${lightTheme} \${spacing} \${typography} \${motion}\`}>
  <App />
</div>`}
        </CodeBlock>
        <p className={paragraph}>
          The class declares{' '}
          <code className={inlineCode}>--haze-duration-fast/normal/slow</code>{' '}
          and <code className={inlineCode}>--haze-ease</code>/
          <code className={inlineCode}>--haze-ease-in-out</code> — write your
          own transitions against them and every duration in the tree moves
          together when you retune the scale.
        </p>
      </div>

      <div className={section}>
        <h2>Reduced motion is built in</h2>
        <p className={paragraph}>
          Users who enable &ldquo;reduce motion&rdquo; get no enter/exit
          animation from these presets, on two independent levels. Every
          preset embeds its own{' '}
          <code className={inlineCode}>prefers-reduced-motion: reduce</code>{' '}
          block that sets <code className={inlineCode}>animation: none</code>{' '}
          — self-sufficient, with no requirement that the{' '}
          <code className={inlineCode}>motion</code> class is on any
          ancestor. And when it is, that class additionally collapses every{' '}
          <code className={inlineCode}>--haze-duration-*</code> to 0ms, which
          zeroes any custom token-driven animation you wrote by hand. Both
          paths agree; neither depends on the other.
        </p>
        <CodeBlock language='css' className={codeMargin}>
          {`/* Inside every preset class: */
@media (prefers-reduced-motion: reduce) {
  &[data-state='open'],
  &[data-state='closed'] {
    animation: none;
  }
}`}
        </CodeBlock>
        <div className={note}>
          The unmount still waits for the settle — with the animation
          disabled, <code className={inlineCode}>whenExitSettles</code> sees
          no positive duration and resolves immediately, so{' '}
          <code className={inlineCode}>Presence</code> unmounts on the next
          frame. Reduced motion degrades to an instant swap, never a hang.
        </div>
      </div>

      <div className={section}>
        <h2>Rolling your own</h2>
        <p className={paragraph}>
          One preset per element —{' '}
          <code className={inlineCode}>animation</code> is a single CSS
          property, so two preset classes on the same element cannot merge
          their keyframes; the later class in stylesheet order wins
          outright. For a bespoke motion, follow the preset shape in your
          own Linaria class: both attribute selectors, forwards on the exit,
          a <code className={inlineCode}>haze-motion-</code>-prefixed
          keyframe pair (keyframe names share the global CSS namespace once
          emitted), tokens for every duration and easing, and the embedded
          reduced-motion collapse.
        </p>
        <div className={note}>
          Keep transform-bearing presets —{' '}
          <code className={inlineCode}>fadeScale</code> and the slides — off
          JS-positioned floating panels. Both positioning tiers behind
          Popover/DropdownMenu/Tooltip measure the panel with{' '}
          <code className={inlineCode}>getBoundingClientRect</code>, and
          that rect includes transforms: an animating panel poisons its own
          placement math. Floating surfaces fade; that is why{' '}
          <code className={inlineCode}>fade</code> is transform-free.
        </div>
      </div>
    </div>
  );
}
