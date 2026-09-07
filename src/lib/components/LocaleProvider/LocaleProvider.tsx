import type { ReactNode } from 'react';

import type { HazeStringsOverrides } from './LocaleContext';

import { useContext, useMemo } from 'react';

import { LocaleContext } from './LocaleContext';

type LocaleProviderProps = {
  /**
   * BCP 47 language tag selecting the built-in string pack: Chinese
   * variants ('zh', 'zh-CN', 'zh_TW', …) serve the bundled zh-CN
   * copy, any other value falls back to English. Unset inherits the
   * tag from the enclosing provider; `strings` still layers on top
   * of the selected pack.
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
