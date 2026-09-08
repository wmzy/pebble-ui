import type { HazeStrings } from './locale';

/**
 * Recursive partial of a strings pack: every level is optional down to
 * the leaf messages, so an override names exactly the copy it rewords.
 * For the pack topology (section → message) this is structurally the
 * provider's `HazeStringsOverrides`; the recursive form keeps it valid
 * if a section ever grows nested groups.
 */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Deep-merges a partial override onto a base string pack, returning a
 * complete `HazeStrings`. Consumers can derive a customized pack —
 * "zh-CN with our terminology", "English with brand copy" — without
 * forking the entire literal set: sections and keys the override does
 * not name keep the base copy verbatim.
 *
 * Neither input is mutated and every section of the result is a fresh
 * object, so the returned pack is safe to mutate or layer further.
 * Built on the provider chain instead, a bare partial passed as
 * `strings` achieves the same layering per component; `createStrings`
 * is for when you need the resolved pack as a value (sharing it
 * across providers, persisting it, or translating it wholesale).
 */
function createStrings(
  base: HazeStrings,
  overrides: DeepPartial<HazeStrings>
): HazeStrings {
  // Sections accumulate through the union-valued record: a write through
  // the union key type cannot target HazeStrings directly (it would have
  // to satisfy every section shape at once).
  const merged = {} as Record<
    keyof HazeStrings,
    HazeStrings[keyof HazeStrings]
  >;
  for (const section of Object.keys(base) as (keyof HazeStrings)[]) {
    merged[section] = mergeSection(base[section], overrides[section]);
  }
  return merged as HazeStrings;
}

/** One section's deep merge: override keys win, the rest keep the base copy. */
function mergeSection<T extends Record<string, string>>(
  baseSection: T,
  overrideSection: DeepPartial<T> | undefined
): T {
  return { ...baseSection, ...overrideSection };
}

export { createStrings };
export type { DeepPartial };
