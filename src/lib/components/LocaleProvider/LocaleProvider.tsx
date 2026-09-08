import type { ReactNode } from 'react';

import type { HazeStringsOverrides } from './LocaleContext';

import { useContext, useMemo } from 'react';

import { localeDirection } from '../../utils/direction';

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
  /**
   * Declared writing direction of the subtree. Takes precedence over
   * everything the chain would otherwise derive: an explicit value on
   * an outer provider survives inner providers that only narrow the
   * locale. When nobody declares one, the direction is derived from
   * the resolved locale (Arabic, Hebrew, Persian, … → 'rtl'). The
   * provider never writes a `dir` attribute — setting the document's
   * direction is the app's job; this value only informs library
   * logic that cannot read the DOM (`useDirection`).
   */
  direction?: 'ltr' | 'rtl';
  strings?: HazeStringsOverrides;
  children: ReactNode;
};

export default function LocaleProvider({
  locale,
  direction,
  strings,
  children,
}: LocaleProviderProps) {
  const parent = useContext(LocaleContext);

  // Unset fields inherit from the enclosing provider; an explicit
  // direction anywhere up the chain beats locale derivation, so the
  // app-level declaration cannot be narrowed away by a nested
  // provider that only picks a string pack.
  const resolvedLocale = locale ?? parent?.locale;
  const value = useMemo(
    () => ({
      locale: resolvedLocale,
      direction:
        direction ?? parent?.direction ?? localeDirection(resolvedLocale),
      strings,
      parent,
    }),
    [resolvedLocale, direction, parent, strings]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export type { LocaleProviderProps };
