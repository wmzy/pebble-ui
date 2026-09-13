import type { HazeConfig } from './ConfigContext';

import { useContext } from 'react';

import { ConfigContext } from './ConfigContext';

/**
 * The shared "no defaults" section — stable identity, so a provider-less
 * render never allocates and consumers keep referential equality.
 */
const EMPTY_SECTION = Object.freeze({}) as Readonly<Record<string, never>>;

/**
 * Reads one component's resolved defaults from the enclosing
 * `ConfigProvider` chain. Returns a frozen empty object when no provider
 * is mounted; callers fall through to their built-in defaults, so wiring
 * a component never changes its provider-less behavior.
 *
 * ## Wiring a new component (the internal pattern)
 *
 * 1. Declare a section in `HazeConfig` (`ConfigContext.ts`) named after
 *    the exported component:
 *
 *    ```ts
 *    MyComponent?: { size?: 'sm' | 'md' | 'lg' };
 *    ```
 *
 * 2. In the component, drop the destructuring default for each wired
 *    prop and resolve three tiers — explicit prop, config, built-in:
 *
 *    ```ts
 *    const config = useConfigDefaults('MyComponent');
 *    const size = sizeProp ?? config.size ?? 'md';
 *    ```
 *
 *    The built-in stays last so a missing provider renders exactly what
 *    the component rendered before the wiring (byte-identical).
 */
export function useConfigDefaults<K extends keyof HazeConfig>(
  component: K
): Readonly<NonNullable<HazeConfig[K]>> {
  const config = useContext(ConfigContext);
  return config?.[component] ?? EMPTY_SECTION;
}
