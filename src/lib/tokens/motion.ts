import { css } from '@linaria/core';

export const motion = css`
  --haze-duration-fast: 120ms;
  --haze-duration-normal: 200ms;
  --haze-duration-slow: 300ms;
  --haze-ease: cubic-bezier(0.2, 0, 0, 1);
  --haze-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Users who opt out of motion get every duration collapsed to zero, so
     all token-driven transitions and enter/exit animations complete
     within a single frame. Easing is left untouched — it is irrelevant
     once the duration is 0ms. Custom properties inherit, so overriding
     them on the theme class covers every descendant, and the media query
     re-evaluates live when the OS preference changes. */
  @media (prefers-reduced-motion: reduce) {
    --haze-duration-fast: 0ms;
    --haze-duration-normal: 0ms;
    --haze-duration-slow: 0ms;
  }
`;

/*
 * Named enter/exit animation presets driven by `data-state`.
 *
 * Put one preset class on the element whose appearance you animate. While
 * the element carries data-state='open' the enter keyframes run; when the
 * attribute flips to 'closed' the exit keyframes run with
 * animation-fill-mode: forwards, so the element holds its exited look for
 * the frames between "closed" and the real unmount. The attribute is what
 * Presence (haze-ui/headless) injects while deferring the unmount until
 * whenExitSettles sees the exit finish — class plus Presence is the whole
 * pattern, no JS touches the animation.
 *
 * Conventions:
 * - Slide names describe the ENTER travel direction (slide-up rises into
 *   place, arriving from just below); the exit reverses the travel — the
 *   element leaves toward the side it arrived from. Slides fade as they
 *   travel: a pure translate reads as sliding glass over content.
 * - Durations and easings come from the motion tokens above: normal
 *   (200ms) on enter, fast (120ms) on exit — exits read snappier at the
 *   same perceived responsiveness. Distances use spacing tokens, so a
 *   density-compacted subtree slides shorter too.
 * - Every preset embeds its own prefers-reduced-motion collapse
 *   (animation: none), self-sufficient without the motion class on any
 *   ancestor; when the class is also present both paths agree (no
 *   animation at collapsed durations).
 * - Keyframe names land in the global CSS namespace once emitted, hence
 *   the haze-motion- prefix; each preset owns a unique enter/exit pair so
 *   two classes can never fight over a shared name (last-emitted
 *   definition would silently win).
 * - One preset per element: animation is a single property, two preset
 *   classes cannot merge their keyframes.
 * - Keep transform-bearing presets (fade-scale, the slides) off
 *   JS-positioned floating panels: getBoundingClientRect includes
 *   transforms, so an animating panel poisons its own placement math.
 *   Floating panels fade only (see floatingAnimated in utils/floating).
 */
export const motionPresets = {
  /** Opacity only — the safe default, also the one floating panels use. */
  fade: css`
    &[data-state='open'] {
      animation: haze-motion-fade-in var(--haze-duration-normal)
        var(--haze-ease);
    }

    &[data-state='closed'] {
      animation: haze-motion-fade-out var(--haze-duration-fast)
        var(--haze-ease) forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      &[data-state='open'],
      &[data-state='closed'] {
        animation: none;
      }
    }

    @keyframes haze-motion-fade-in {
      from {
        opacity: 0;
      }
    }

    @keyframes haze-motion-fade-out {
      to {
        opacity: 0;
      }
    }
  `,

  /** Fade plus a subtle settle from 97% scale — cards, dialogs, images. */
  fadeScale: css`
    &[data-state='open'] {
      animation: haze-motion-fade-scale-in var(--haze-duration-normal)
        var(--haze-ease);
    }

    &[data-state='closed'] {
      animation: haze-motion-fade-scale-out var(--haze-duration-fast)
        var(--haze-ease) forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      &[data-state='open'],
      &[data-state='closed'] {
        animation: none;
      }
    }

    @keyframes haze-motion-fade-scale-in {
      from {
        opacity: 0;
        transform: scale(0.97);
      }
    }

    @keyframes haze-motion-fade-scale-out {
      to {
        opacity: 0;
        transform: scale(0.97);
      }
    }
  `,

  /** Rises into place from just below; sinks back down on exit. */
  slideUp: css`
    &[data-state='open'] {
      animation: haze-motion-slide-up-in var(--haze-duration-normal)
        var(--haze-ease);
    }

    &[data-state='closed'] {
      animation: haze-motion-slide-up-out var(--haze-duration-fast)
        var(--haze-ease) forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      &[data-state='open'],
      &[data-state='closed'] {
        animation: none;
      }
    }

    @keyframes haze-motion-slide-up-in {
      from {
        opacity: 0;
        transform: translateY(var(--haze-space-4));
      }
    }

    @keyframes haze-motion-slide-up-out {
      to {
        opacity: 0;
        transform: translateY(var(--haze-space-4));
      }
    }
  `,

  /** Descends into place from just above; rises back up on exit. */
  slideDown: css`
    &[data-state='open'] {
      animation: haze-motion-slide-down-in var(--haze-duration-normal)
        var(--haze-ease);
    }

    &[data-state='closed'] {
      animation: haze-motion-slide-down-out var(--haze-duration-fast)
        var(--haze-ease) forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      &[data-state='open'],
      &[data-state='closed'] {
        animation: none;
      }
    }

    @keyframes haze-motion-slide-down-in {
      from {
        opacity: 0;
        transform: translateY(calc(-1 * var(--haze-space-4)));
      }
    }

    @keyframes haze-motion-slide-down-out {
      to {
        opacity: 0;
        transform: translateY(calc(-1 * var(--haze-space-4)));
      }
    }
  `,

  /** Slides in leftward, arriving from just right; exits back right. */
  slideLeft: css`
    &[data-state='open'] {
      animation: haze-motion-slide-left-in var(--haze-duration-normal)
        var(--haze-ease);
    }

    &[data-state='closed'] {
      animation: haze-motion-slide-left-out var(--haze-duration-fast)
        var(--haze-ease) forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      &[data-state='open'],
      &[data-state='closed'] {
        animation: none;
      }
    }

    @keyframes haze-motion-slide-left-in {
      from {
        opacity: 0;
        transform: translateX(var(--haze-space-4));
      }
    }

    @keyframes haze-motion-slide-left-out {
      to {
        opacity: 0;
        transform: translateX(var(--haze-space-4));
      }
    }
  `,

  /** Slides in rightward, arriving from just left; exits back left. */
  slideRight: css`
    &[data-state='open'] {
      animation: haze-motion-slide-right-in var(--haze-duration-normal)
        var(--haze-ease);
    }

    &[data-state='closed'] {
      animation: haze-motion-slide-right-out var(--haze-duration-fast)
        var(--haze-ease) forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      &[data-state='open'],
      &[data-state='closed'] {
        animation: none;
      }
    }

    @keyframes haze-motion-slide-right-in {
      from {
        opacity: 0;
        transform: translateX(calc(-1 * var(--haze-space-4)));
      }
    }

    @keyframes haze-motion-slide-right-out {
      to {
        opacity: 0;
        transform: translateX(calc(-1 * var(--haze-space-4)));
      }
    }
  `,
} as const;

/** Preset names accepted wherever a motion preset can be chosen. */
export type MotionPreset = keyof typeof motionPresets;
