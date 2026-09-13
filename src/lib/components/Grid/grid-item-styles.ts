import { css } from '@linaria/core';

/**
 * Pre-generated per-(breakpoint, span) classes for GridItem's container-query
 * responsive spans. Every class gets its own named const so the emitted
 * selectors stay unique, and all of them share this single file so Linaria
 * emits the rules in a stable cascade order:
 *
 * 1. `base*` — unconditional fallback (`grid-column: span N`) used when no
 *    breakpoint matches.
 * 2. `sm*` → `md*` → `lg*` — `@container (min-width: …)` overrides. Container
 *    queries add no specificity, so at a width where several queries match
 *    the latest-defined rule wins: lg > md > sm.
 *
 * The `@container` rules only take effect when an ancestor declares
 * `container-type: inline-size` (Grid with `responsive`). Without an eligible
 * query container the queries never match, and the item degrades to `span`.
 */

// 1. Fallback placement, below every breakpoint.
const base1 = css`
  grid-column: span 1;
`;
const base2 = css`
  grid-column: span 2;
`;
const base3 = css`
  grid-column: span 3;
`;
const base4 = css`
  grid-column: span 4;
`;
const base5 = css`
  grid-column: span 5;
`;
const base6 = css`
  grid-column: span 6;
`;
const base7 = css`
  grid-column: span 7;
`;
const base8 = css`
  grid-column: span 8;
`;
const base9 = css`
  grid-column: span 9;
`;
const base10 = css`
  grid-column: span 10;
`;
const base11 = css`
  grid-column: span 11;
`;
const base12 = css`
  grid-column: span 12;
`;

// 2. Container-query overrides, declared sm → md → lg so later breakpoints
//    win by source order when several queries match at once.
const sm1 = css`
  @container (min-width: 384px) {
    grid-column: span 1;
  }
`;
const sm2 = css`
  @container (min-width: 384px) {
    grid-column: span 2;
  }
`;
const sm3 = css`
  @container (min-width: 384px) {
    grid-column: span 3;
  }
`;
const sm4 = css`
  @container (min-width: 384px) {
    grid-column: span 4;
  }
`;
const sm5 = css`
  @container (min-width: 384px) {
    grid-column: span 5;
  }
`;
const sm6 = css`
  @container (min-width: 384px) {
    grid-column: span 6;
  }
`;
const sm7 = css`
  @container (min-width: 384px) {
    grid-column: span 7;
  }
`;
const sm8 = css`
  @container (min-width: 384px) {
    grid-column: span 8;
  }
`;
const sm9 = css`
  @container (min-width: 384px) {
    grid-column: span 9;
  }
`;
const sm10 = css`
  @container (min-width: 384px) {
    grid-column: span 10;
  }
`;
const sm11 = css`
  @container (min-width: 384px) {
    grid-column: span 11;
  }
`;
const sm12 = css`
  @container (min-width: 384px) {
    grid-column: span 12;
  }
`;

const md1 = css`
  @container (min-width: 576px) {
    grid-column: span 1;
  }
`;
const md2 = css`
  @container (min-width: 576px) {
    grid-column: span 2;
  }
`;
const md3 = css`
  @container (min-width: 576px) {
    grid-column: span 3;
  }
`;
const md4 = css`
  @container (min-width: 576px) {
    grid-column: span 4;
  }
`;
const md5 = css`
  @container (min-width: 576px) {
    grid-column: span 5;
  }
`;
const md6 = css`
  @container (min-width: 576px) {
    grid-column: span 6;
  }
`;
const md7 = css`
  @container (min-width: 576px) {
    grid-column: span 7;
  }
`;
const md8 = css`
  @container (min-width: 576px) {
    grid-column: span 8;
  }
`;
const md9 = css`
  @container (min-width: 576px) {
    grid-column: span 9;
  }
`;
const md10 = css`
  @container (min-width: 576px) {
    grid-column: span 10;
  }
`;
const md11 = css`
  @container (min-width: 576px) {
    grid-column: span 11;
  }
`;
const md12 = css`
  @container (min-width: 576px) {
    grid-column: span 12;
  }
`;

const lg1 = css`
  @container (min-width: 768px) {
    grid-column: span 1;
  }
`;
const lg2 = css`
  @container (min-width: 768px) {
    grid-column: span 2;
  }
`;
const lg3 = css`
  @container (min-width: 768px) {
    grid-column: span 3;
  }
`;
const lg4 = css`
  @container (min-width: 768px) {
    grid-column: span 4;
  }
`;
const lg5 = css`
  @container (min-width: 768px) {
    grid-column: span 5;
  }
`;
const lg6 = css`
  @container (min-width: 768px) {
    grid-column: span 6;
  }
`;
const lg7 = css`
  @container (min-width: 768px) {
    grid-column: span 7;
  }
`;
const lg8 = css`
  @container (min-width: 768px) {
    grid-column: span 8;
  }
`;
const lg9 = css`
  @container (min-width: 768px) {
    grid-column: span 9;
  }
`;
const lg10 = css`
  @container (min-width: 768px) {
    grid-column: span 10;
  }
`;
const lg11 = css`
  @container (min-width: 768px) {
    grid-column: span 11;
  }
`;
const lg12 = css`
  @container (min-width: 768px) {
    grid-column: span 12;
  }
`;

const spanClasses = {
  1: base1,
  2: base2,
  3: base3,
  4: base4,
  5: base5,
  6: base6,
  7: base7,
  8: base8,
  9: base9,
  10: base10,
  11: base11,
  12: base12,
} as const;

const smSpans = {
  1: sm1,
  2: sm2,
  3: sm3,
  4: sm4,
  5: sm5,
  6: sm6,
  7: sm7,
  8: sm8,
  9: sm9,
  10: sm10,
  11: sm11,
  12: sm12,
} as const;

const mdSpans = {
  1: md1,
  2: md2,
  3: md3,
  4: md4,
  5: md5,
  6: md6,
  7: md7,
  8: md8,
  9: md9,
  10: md10,
  11: md11,
  12: md12,
} as const;

const lgSpans = {
  1: lg1,
  2: lg2,
  3: lg3,
  4: lg4,
  5: lg5,
  6: lg6,
  7: lg7,
  8: lg8,
  9: lg9,
  10: lg10,
  11: lg11,
  12: lg12,
} as const;

export { lgSpans, mdSpans, smSpans, spanClasses };
