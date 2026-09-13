import type { ReactNode } from 'react';

import type { HazeConfig } from './ConfigContext';

import { useContext, useMemo } from 'react';

import { ConfigContext, mergeConfig } from './ConfigContext';

type ConfigProviderProps = {
  /**
   * Component defaults, keyed by exported component name (see
   * `HazeConfig`). Nested providers layer: the inner provider's keys win
   * per component section (shallow merge), keys it leaves unset keep the
   * outer value. Explicit props on a component always beat config values.
   */
  defaults?: HazeConfig;
  children: ReactNode;
};

/**
 * Supplies library-wide component defaults to the subtree — the
 * AntD-v6-ConfigProvider idea, scoped to defaults only. Theming stays on
 * the token classes (`lightTheme` / brand themes) and copy on
 * `LocaleProvider`; the two providers are independent contexts and may
 * be mounted in either order, nested in one another, or used alone.
 *
 * Renders no DOM and touches no browser API — safe under SSR (string
 * render and hydration alike). A client-boundary module (React context):
 * the lib build stamps `'use client'` on it.
 */
export default function ConfigProvider({
  defaults,
  children,
}: ConfigProviderProps) {
  const parent = useContext(ConfigContext);
  const value = useMemo(
    () => mergeConfig(parent, defaults),
    [parent, defaults]
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export type { ConfigProviderProps };
