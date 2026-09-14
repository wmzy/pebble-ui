/* eslint-disable react-refresh/only-export-components */
/*
 * Docs-site locale layer: a client-side language switch with no routing
 * involvement (URLs stay locale-agnostic English slugs).
 *
 * Resolution order for the initial locale:
 *   1. localStorage('haze-docs-lang') — the user's last explicit choice;
 *   2. navigator.language starting with 'zh' — browser preference;
 *   3. 'en' — the source dictionary, always complete.
 *
 * The active dictionary `t` is `en` deep-merged with the zh overrides, so
 * any key zh.ts has not translated yet renders the English fallback —
 * the dictionary is incrementally expandable by design. Switching persists
 * the choice and syncs document.documentElement.lang for assistive tech.
 *
 * Components under test (and any stray consumer outside the provider)
 * get a working English fallback instead of a throw: several suites
 * render Home / CommandPalette standalone (Home.test.tsx,
 * CommandPalette.test.tsx).
 */

import type { ReactNode } from 'react';
import type { RichText } from './en';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { en } from './en';
import { zh } from './zh';

export type SiteLocale = 'en' | 'zh';

export const LOCALE_STORAGE_KEY = 'haze-docs-lang';

export type SiteLocaleValue = {
  locale: SiteLocale;
  setLocale: (locale: SiteLocale) => void;
  /** Merged dictionary: zh overrides on top of the complete en base. */
  t: typeof en;
};

/** Locale dictionaries allowed by the provider; keep in sync with SiteLocale. */
const DICTS: Partial<Record<SiteLocale, Record<string, unknown>>> = { zh };

/** Resolve the initial locale (storage > browser language > en). */
export function resolveInitialLocale(): SiteLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') return stored;
  } catch {
    /* storage unavailable (privacy mode / SSR) */
  }
  if (
    typeof navigator !== 'undefined' &&
    navigator.language.toLowerCase().startsWith('zh')
  ) {
    return 'zh';
  }
  return 'en';
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Deep-merge an override dictionary onto the en base (maps merge, leaves replace). */
export function mergeStrings<T>(base: T, override: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseValue = out[key];
    if (isPlainObject(value) && isPlainObject(baseValue)) {
      out[key] = mergeStrings(baseValue, value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

const SiteLocaleContext = createContext<SiteLocaleValue | null>(null);

export function SiteLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>(resolveInitialLocale);

  const setLocale = useCallback((next: SiteLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — keep the in-memory switch working */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  const t = useMemo(() => {
    const dict = DICTS[locale];
    return dict ? mergeStrings(en, dict) : en;
  }, [locale]);

  const value = useMemo<SiteLocaleValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <SiteLocaleContext.Provider value={value}>
      {children}
    </SiteLocaleContext.Provider>
  );
}

/** Standalone English fallback so provider-less renders (tests) keep working. */
const fallbackValue: SiteLocaleValue = {
  locale: 'en',
  setLocale: () => undefined,
  t: en,
};

export function useSiteLocale(): SiteLocaleValue {
  return useContext(SiteLocaleContext) ?? fallbackValue;
}

/**
 * Expand `{placeholder}` tokens in a dictionary string. Unknown tokens are
 * left verbatim so a missing value is visible instead of silently dropped.
 */
export function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) => {
    const value = values[key];
    return value === undefined ? token : String(value);
  });
}

/** Render a RichText paragraph: strings pass through, code/strong get tags. */
export function Rich({
  text,
  codeClass,
}: {
  text: RichText;
  codeClass?: string;
}) {
  return (
    <>
      {text.map((seg, i) => {
        if (typeof seg === 'string') return seg;
        if ('code' in seg) {
          return (
            <code key={i} className={codeClass}>
              {seg.code}
            </code>
          );
        }
        return <strong key={i}>{seg.strong}</strong>;
      })}
    </>
  );
}
