export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";
export const localeCookieName = "NEXT_LOCALE";

export function isSupportedLocale(locale: string | undefined): locale is Locale {
  return locales.includes(locale as Locale);
}
