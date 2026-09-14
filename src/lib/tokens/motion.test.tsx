/*
 * Motion token + preset contract. vitest runs with css:false, so like
 * tokens.test.ts the emitted declarations are asserted through
 * source-level regex checks on motion.ts (the css template text is not
 * observable at runtime), while the runtime surface — class-name strings
 * and the data-state/Presence wiring the presets are designed for — is
 * asserted through rendering (presence.test.tsx precedent).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { render, screen, waitFor } from '@testing-library/react';

import { Presence } from '../utils/presence';

import { motion, motionPresets } from './motion';

const source = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'motion.ts'),
  'utf8'
);

// The motion class legitimately holds literal durations (it DEFINES the
// tokens); preset assertions scope to everything from motionPresets on.
const presetsSource = source.slice(source.indexOf('motionPresets'));

const KEYFRAMES =
  presetsSource.match(/@keyframes ([\w-]+)/g)?.map((s) => s.slice(11)) ?? [];

describe('motion class', () => {
  it('is a non-empty class-name string', () => {
    expect(typeof motion).toBe('string');
    expect(motion.length).toBeGreaterThan(0);
  });
});

describe('motionPresets', () => {
  it('covers exactly the six documented presets', () => {
    expect(Object.keys(motionPresets).sort()).toEqual([
      'fade',
      'fadeScale',
      'slideDown',
      'slideLeft',
      'slideRight',
      'slideUp',
    ]);
  });

  it('is a non-empty, unique class-name string per preset', () => {
    const names = Object.values(motionPresets);
    for (const name of names) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
    expect(new Set(names).size).toBe(names.length);
  });

  it('renders the preset class alongside data-state on a plain element', () => {
    const { container, unmount } = render(
      <div className={motionPresets.fadeScale} data-state='open'>
        Card
      </div>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain(motionPresets.fadeScale);
    expect(el).toHaveAttribute('data-state', 'open');
    unmount();
  });
});

describe('motion.ts source (preset wiring)', () => {
  it('drives every preset off both data-state selectors', () => {
    // Six templates, each with an enter rule, an exit rule and the two
    // selectors repeated inside its reduced-motion collapse.
    expect(presetsSource.match(/\[data-state='open'\]/g)).toHaveLength(12);
    expect(presetsSource.match(/\[data-state='closed'\]/g)).toHaveLength(12);
  });

  it('names every keyframe under the haze-motion- prefix, uniquely', () => {
    expect(KEYFRAMES).toHaveLength(12); // 6 presets x (enter + exit)
    expect(new Set(KEYFRAMES).size).toBe(12);
    for (const name of KEYFRAMES) {
      expect(name.startsWith('haze-motion-')).toBe(true);
    }
  });

  it('holds every exit with animation-fill-mode: forwards', () => {
    expect(presetsSource.match(/var\(--haze-ease(?:-in-out)?\) forwards/g)).toHaveLength(6);
  });

  it('uses motion tokens for every duration and easing (no literals)', () => {
    // Any timing/easing literal inside the preset templates is a drift
    // away from the token scale; only the scale factor and keyframe
    // geometry may be literal.
    expect(presetsSource).not.toMatch(/\b\d+(?:\.\d+)?m?s\b/);
    expect(presetsSource).not.toMatch(/cubic-bezier\(/);
    expect(presetsSource.match(/var\(--haze-duration-(?:fast|normal|slow)\)/g)).toHaveLength(12);
    expect(presetsSource.match(/var\(--haze-ease(?:-in-out)?\)/g)?.length).toBeGreaterThanOrEqual(12);
  });

  it('embeds a self-sufficient reduced-motion collapse per preset', () => {
    expect(
      presetsSource.match(/@media \(prefers-reduced-motion: reduce\)/g)
    ).toHaveLength(6);
    expect(presetsSource.match(/animation: none/g)).toHaveLength(6);
  });

  it('keeps the module free of hooks and DOM access (RSC-safe)', () => {
    expect(source).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(source).not.toMatch(/\b(?:document|window)\./);
    expect(source).not.toMatch(/from 'react'/);
  });
});

describe('motionPresets + Presence', () => {
  it('flips data-state through Presence so presets drive enter then exit', async () => {
    const card = (
      <div className={motionPresets.slideUp} data-testid='card'>
        Animated
      </div>
    );
    const { rerender } = render(<Presence present>{card}</Presence>);

    // Presented frame: preset class applied, enter state injected.
    const el = screen.getByTestId('card');
    expect(el.className).toContain(motionPresets.slideUp);
    expect(el).toHaveAttribute('data-state', 'open');

    // Flip to absent: still mounted as closed (exit pending) — this is
    // the window in which the preset's exit keyframes run.
    rerender(<Presence present={false}>{card}</Presence>);
    expect(el).toHaveAttribute('data-state', 'closed');

    // jsdom reports no durations, so the settle completes without events
    // and the element unmounts (presence.test.tsx precedent).
    await waitFor(() =>
      expect(screen.queryByTestId('card')).not.toBeInTheDocument()
    );
  });
});
