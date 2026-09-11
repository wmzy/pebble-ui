import type { HazeStrings } from './locale';
import type { HazeStringsOverrides, LocaleContextValue } from './LocaleContext';

import { useContext } from 'react';

import { enUS } from './locale';
import { jaJP } from './ja-jp';
import { zhCN } from './zh-cn';

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
 * Picks the built-in pack for a BCP 47 tag: Chinese variants ('zh',
 * 'zh-CN', 'zh_TW', …) resolve to `zhCN`, Japanese variants ('ja',
 * 'ja-JP', 'ja_JP', …) to `jaJP`, anything else — or no locale at
 * all — falls back to English.
 */
function resolveBuiltinStrings(locale: string | undefined): HazeStrings {
  if (locale) {
    const tag = locale.toLowerCase();
    if (tag === 'zh' || tag.startsWith('zh-') || tag.startsWith('zh_')) {
      return zhCN;
    }
    if (tag === 'ja' || tag.startsWith('ja-') || tag.startsWith('ja_')) {
      return jaJP;
    }
  }
  return enUS;
}

/**
 * Resolved copy for one component: the section of the built-in pack
 * selected by the provider chain's effective `locale`, layered with
 * every enclosing provider's override, key by key, so the innermost
 * provider wins conflicts and silent keys keep outer (or pack)
 * values. Falls back to the English defaults when no provider is
 * mounted.
 */
export function useStrings<K extends keyof HazeStrings>(
  componentKey: K
): Readonly<HazeStrings[K]> {
  const context = useContext(LocaleContext);
  const overrides = collectLayers(context)
    .map((layer) => layer[componentKey])
    .filter(
      (section): section is Partial<HazeStrings[K]> => section !== undefined
    );

  return overrides.reduce<Readonly<HazeStrings[K]>>(
    (resolved, section) => ({ ...resolved, ...section }),
    resolveBuiltinStrings(context?.locale)[componentKey]
  );
}
