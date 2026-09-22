/**
 * Locale resolution for this spoke.
 *
 * STOPGAP — reverts commit 9ff2b97 (Wave 1 Task 9, D18), which replaced this
 * file's implementation with `import { resolveLocale } from
 * "@journeyoflife-org/i18n"`. That export is not published: it lives in
 * jol-hub as the untracked `packages/i18n/src/localized-text.ts`, the
 * package's `src/index.ts` never re-exports it, and changeset
 * `i18n-resolve-locale.md` (minor) is still pending. The installed
 * `@journeyoflife-org/i18n@1.0.0` therefore has no `resolveLocale`, and this
 * spoke did not type-check.
 *
 * TODO(i18n@1.1.0): once the hub publishes that changeset, delete the local
 * copy below and re-import from `@journeyoflife-org/i18n` to restore INV-1.
 *
 * Mirrors `jol-site-basilica/src/lib/resolve-locale.ts` so both spokes stay
 * behaviourally identical until then.
 *
 * Deliberately lt/en/ru only. The pending hub changeset also widens
 * `SupportedLocale` with `pl`; adopting Polish here is a separate decision,
 * since this spoke's fixture carries no `pl` values.
 *
 * Fallback policy (Phase 3 spec S3.2 Step 4): `lt` is the mandatory source
 * language, and a locale silently falling back to another is a BLOCKING
 * FAILURE — so an unverified `lt` source surfaces a visible placeholder.
 */

export type SupportedLocale = 'lt' | 'en' | 'ru';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['lt', 'en', 'ru'];
export const DEFAULT_LOCALE: SupportedLocale = 'lt';

/**
 * Marker used by content editors for translations awaiting verification.
 * Its presence in the `lt` source suppresses silent fallback.
 */
export const TODO_MARKER = '[TODO: verify';

/**
 * A localized text field. `lt` is mandatory — it is DEFAULT_LOCALE and the
 * source language every other locale is verified against.
 */
export interface LocalizedText {
  lt: string;
  en?: string;
  ru?: string;
}

/** Resolve an inline localized field to a plain string for `locale`. */
export function resolveLocale(text: LocalizedText, locale: SupportedLocale): string {
  // An exact match wins verbatim — including when it carries TODO_MARKER,
  // which is then the editor's own published content, not a substitution.
  const exact = text[locale];
  if (exact !== undefined) return exact;

  if (locale === DEFAULT_LOCALE) return text.lt;

  if (text.lt.includes(TODO_MARKER)) {
    return `[${locale.toUpperCase()} translation pending] ${text.lt}`;
  }

  return text.lt;
}
