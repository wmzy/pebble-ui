import type { HazeStrings } from '@/lib';

import { createStrings, defaultStrings } from '@/lib';

/**
 * Français — a derived pack. `createStrings` carries every section and
 * key we do not reword over from the English base, so the override
 * stays exactly as long as the copy it actually changes. `{count}`
 * placeholders survive translation and are expanded at runtime.
 *
 * Mount with `locale="fr-FR"`: no built-in pack matches the tag, so
 * the English base is selected and this pack layers on top of it —
 * here as a complete `HazeStrings`, which the `strings` prop accepts
 * (a full pack satisfies the partial override shape).
 */
export const frPack: HazeStrings = createStrings(defaultStrings, {
  chatInput: {
    placeholder: 'Écrire un message…',
    send: 'Envoyer',
  },
  empty: {
    description: 'Aucune donnée',
  },
  tagInput: {
    placeholder: 'Ajouter un tag',
  },
});

/**
 * العربية — the same keys in Arabic. Mounted with `locale="ar-EG"`,
 * the direction is derived as rtl from the tag (the `ar` primary
 * subtag), so no explicit `direction` prop is needed; setting the
 * document's `dir` remains the app's job, the provider never writes
 * it (see the RTL notes in the recipe).
 */
export const arPack: HazeStrings = createStrings(defaultStrings, {
  chatInput: {
    placeholder: 'اكتب رسالة…',
    send: 'إرسال',
  },
  empty: {
    description: 'لا توجد بيانات',
  },
  tagInput: {
    placeholder: 'أضف وسمًا',
    tagCount: '{count} وسوم',
    tagCountSingular: 'وسم واحد',
  },
});
