import type { ReactNode } from 'react';

import type { HazeStringsOverrides } from './LocaleContext';

import { useContext, useMemo } from 'react';

import { LocaleContext } from './LocaleContext';

type LocaleProviderProps = {
  /**
   * BCP 47 language tag. Currently stored and inherited only — no
   * library string is formatted through Intl yet.
   */
  locale?: string;
  strings?: HazeStringsOverrides;
  children: ReactNode;
};

export default function LocaleProvider({
  locale,
  strings,
  children,
}: LocaleProviderProps) {
  const parent = useContext(LocaleContext);

  // Unset fields inherit from the enclosing provider.
  const value = useMemo(
    () => ({ locale: locale ?? parent?.locale, strings, parent }),
    [locale, strings, parent]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export type { LocaleProviderProps };
