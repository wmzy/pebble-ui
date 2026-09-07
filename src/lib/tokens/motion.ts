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
