/** Cookie + Accept-Language. Default English unless the browser asks for Italian. */

export const LOCALES = ["en", "it"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "vsarena-locale";

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Coerce any string to a supported locale.
 */
export function parseLocale(value: string | undefined | null): Locale | null {
  if (!value) return null;
  const base = value.trim().toLowerCase().slice(0, 2);
  if (base === "en" || base === "it") return base;
  return null;
}

/**
 * Locale from cookie, then Accept-Language, then English.
 */
export function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | undefined): Locale {
  return parseLocale(cookieValue) ?? parseLocale(acceptLanguage) ?? DEFAULT_LOCALE;
}
