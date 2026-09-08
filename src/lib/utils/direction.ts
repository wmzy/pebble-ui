/**
 * Direction (RTL) resolution for keyboard semantics and floating-panel
 * geometry. Two sources, one rule:
 *
 *  - Layout truth is the DOM. CSS logical properties resolve against the
 *    rendered `direction`, which comes from the nearest `[dir]` ancestor
 *    (or the UA default, ltr). Anything that must agree with what the
 *    user sees — arrow-key mirroring, JS placement math — therefore reads
 *    {@link getDirection} at event/measure time, never from React state.
 *  - Declared intent is the LocaleProvider chain: an explicit `direction`
 *    prop, else derived from the locale. {@link useDirection} surfaces it
 *    (falling back to the document direction) for components that need a
 *    direction during render rather than at interaction time.
 */
import { useContext } from 'react';

import { LocaleContext } from '../components/LocaleProvider/LocaleContext';

/** Writing direction of a subtree. */
export type Direction = 'ltr' | 'rtl';

/**
 * BCP 47 primary language subtags whose dominant script is right-to-left.
 * Matched against the subtag before the first `-`/`_` (case-insensitive),
 * so `ar`, `ar-SA`, `fa_IR`, `he-IL` … all resolve; extensions such as
 * `ar-SA-u-nu-latn` (Latin digits, still RTL layout) do not change it.
 */
const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'ckb', // Central Kurdish (Sorani)
  'dv', // Divehi
  'fa', // Persian
  'he', // Hebrew (also the legacy tag `iw`)
  'iw', // Hebrew, pre-BCP-47
  'ku', // Kurdish (Arabic script; Latin-script Kurdish stays ltr — pass an explicit direction then)
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
]);

/** Direction implied by a BCP 47 tag; `undefined` when no tag is given. */
export function localeDirection(locale: string | undefined): Direction | undefined {
  if (!locale) return undefined;
  const language = locale.split(/[-_]/)[0]!.toLowerCase();
  return RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
}

/**
 * Rendered direction of an element: the nearest ancestor carrying a
 * `dir` attribute, `'ltr'` when none does. `dir="auto"` resolves by
 * element content, so it defers to the computed style (and to `'ltr'`
 * where that is unavailable, e.g. restricted environments).
 */
export function getDirection(el: Element | null): Direction {
  const carrier = el?.closest('[dir]');
  if (!carrier) return 'ltr';
  const attr = carrier.getAttribute('dir')?.toLowerCase();
  if (attr === 'rtl' || attr === 'ltr') return attr;
  // dir="auto" (and any other value): the resolved direction lives in
  // the computed style.
  if (typeof getComputedStyle === 'function') {
    return getComputedStyle(carrier).direction === 'rtl' ? 'rtl' : 'ltr';
  }
  return 'ltr';
}

/**
 * Declared direction for the current tree: the LocaleProvider chain's
 * explicit `direction` prop or locale-derived direction, falling back to
 * the document's rendered direction when no provider is mounted.
 *
 * Prefer {@link getDirection} on the concrete element whenever the value
 * must match the painted layout — a provider's declared direction says
 * what the app intends, the `[dir]` subtree says what CSS actually
 * resolved.
 */
export function useDirection(): Direction {
  const context = useContext(LocaleContext);
  return (
    context?.direction ??
    (typeof document === 'undefined'
      ? 'ltr'
      : getDirection(document.documentElement))
  );
}
