import type { HazeStrings } from './locale';
import type { HazeStringsOverrides, LocaleContextValue } from './LocaleContext';

import { useContext } from 'react';

import { defaultStrings } from './locale';

import { LocaleContext } from './LocaleContext';

/** Ancestor-first list of every `strings` payload up the chain. */
function collectLayers(
  context: LocaleContextValue | undefined
): HazeStringsOverrides[] {
  if (!context) return [];
  const ancestors = collectLayers(context.parent);
  return context.strings ? [...ancestors, context.strings] : ancestors;
}

/**
 * Resolved copy for one component: the section of `defaultStrings`
 * layered with every enclosing provider's override, key by key, so the
 * innermost provider wins conflicts and silent keys keep outer (or
 * default) values. Falls back to the defaults when no provider is
 * mounted.
 */
export function useStrings<K extends keyof HazeStrings>(
  componentKey: K
): Readonly<HazeStrings[K]> {
  const overrides = collectLayers(useContext(LocaleContext))
    .map((layer) => layer[componentKey])
    .filter(
      (section): section is Partial<HazeStrings[K]> => section !== undefined
    );

  return overrides.reduce<Readonly<HazeStrings[K]>>(
    (resolved, section) => ({ ...resolved, ...section }),
    defaultStrings[componentKey]
  );
}
