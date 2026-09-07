import type { HazeStrings } from './locale';

import { createContext } from 'react';

/** String overrides keyed by component; every level is optional. */
type HazeStringsOverrides = {
  [K in keyof HazeStrings]?: Partial<HazeStrings[K]>;
};

/**
 * Providers form a chain: each carries its own `strings` plus a link to
 * the enclosing provider's value, so `useStrings` can layer
 * defaults → outermost → innermost per section key.
 */
type LocaleContextValue = {
  /** BCP 47 tag; `useStrings` resolves it to a built-in string pack. */
  locale?: string;
  strings?: HazeStringsOverrides;
  parent?: LocaleContextValue;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export { LocaleContext };
export type { HazeStringsOverrides, LocaleContextValue };
