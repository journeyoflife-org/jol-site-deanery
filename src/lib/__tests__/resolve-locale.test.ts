import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, resolveLocale, TODO_MARKER } from '../resolve-locale';

/**
 * Covers the fallback policy from Phase 3 spec S3.2 Step 4: `lt` is the
 * mandatory source language and a locale must never degrade silently.
 *
 * Imported by relative path on purpose — vitest does not read tsconfig `paths`
 * without extra configuration, and this spoke has no vitest config yet.
 */
describe('resolveLocale', () => {
  it('returns the exact locale value', () => {
    expect(resolveLocale({ lt: 'lt', en: 'en', ru: 'ru' }, 'en')).toBe('en');
  });

  it('returns the default locale value', () => {
    expect(resolveLocale({ lt: 'Labas' }, DEFAULT_LOCALE)).toBe('Labas');
  });

  it('returns an exact match verbatim even when it carries the TODO marker', () => {
    // The marker is then the editor's own published content, not a
    // substitution — so it must not be rewritten.
    const text = { lt: 'Labas', ru: `Hello ${TODO_MARKER} with diocese]` };
    expect(resolveLocale(text, 'ru')).toBe(text.ru);
  });

  it('falls back to lt when the locale is absent and lt is verified', () => {
    expect(resolveLocale({ lt: 'Labas' }, 'en')).toBe('Labas');
  });

  it('surfaces a visible placeholder when lt is still unverified', () => {
    const text = { lt: `Labas ${TODO_MARKER} with diocese]` };
    expect(resolveLocale(text, 'en')).toBe('[EN translation pending] Labas [TODO: verify with diocese]');
  });

  it('never returns an empty string for a present lt source', () => {
    for (const locale of ['lt', 'en', 'ru'] as const) {
      expect(resolveLocale({ lt: 'Labas' }, locale)).not.toBe('');
    }
  });
});
