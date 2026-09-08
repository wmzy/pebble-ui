import type { Direction } from '../../utils/direction';
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
  /**
   * Declared writing direction: an explicit `direction` prop on some
   * provider in the chain, else derived from the resolved locale.
   * `undefined` only when no provider is mounted. Note this is declared
   * intent — layout truth stays the DOM's `[dir]` resolution (see
   * `utils/direction.ts`).
   */
  direction?: Direction;
  strings?: HazeStringsOverrides;
  parent?: LocaleContextValue;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export { LocaleContext };
export type { HazeStringsOverrides, LocaleContextValue };
