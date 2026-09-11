/**
 * Brand preset theme classes — five complete standalone themes that swap the
 * default blue primary for violet / teal / cyan / orange / rose.
 *
 * Each preset carries the ENTIRE token set (primitive scales + semantic
 * aliases + relative-color interaction states), so a consumer uses it as a
 * REPLACEMENT for lightTheme/darkTheme — `className={violetTheme.light}`
 * instead of `className={lightTheme}` — and every `var(--haze-*)` reference
 * inside the subtree re-resolves, neutrals and status colors included.
 *
 * They must never be stacked on top of lightTheme/darkTheme on the same
 * element: both sides declare the same custom properties at the same
 * specificity, and the winner would be decided by stylesheet emission
 * order. Overrides of a custom property have to happen on the very element
 * that declares it (unregistered custom properties resolve var() eagerly),
 * which is exactly why these classes restate the full theme instead of
 * shipping a diff. Declaration shape and byte layout match colors.ts.
 */

import {css} from '@linaria/core';

import {brandDeclarations} from './palette';

/** A brand preset: one Linaria class per mode, mirroring lightTheme/darkTheme. */
export type BrandTheme = {light: string; dark: string};

const violetLight = css`
${brandDeclarations('violet', 'light')}
`;
const violetDark = css`
${brandDeclarations('violet', 'dark')}
`;

const tealLight = css`
${brandDeclarations('teal', 'light')}
`;
const tealDark = css`
${brandDeclarations('teal', 'dark')}
`;

const cyanLight = css`
${brandDeclarations('cyan', 'light')}
`;
const cyanDark = css`
${brandDeclarations('cyan', 'dark')}
`;

const orangeLight = css`
${brandDeclarations('orange', 'light')}
`;
const orangeDark = css`
${brandDeclarations('orange', 'dark')}
`;

const roseLight = css`
${brandDeclarations('rose', 'light')}
`;
const roseDark = css`
${brandDeclarations('rose', 'dark')}
`;

export const violetTheme: BrandTheme = {light: violetLight, dark: violetDark};
export const tealTheme: BrandTheme = {light: tealLight, dark: tealDark};
export const cyanTheme: BrandTheme = {light: cyanLight, dark: cyanDark};
export const orangeTheme: BrandTheme = {light: orangeLight, dark: orangeDark};
export const roseTheme: BrandTheme = {light: roseLight, dark: roseDark};
