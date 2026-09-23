import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "@/lib/i18n/locale";

/**
 * Locale for this request. Cookie wins over Accept-Language.
 */
export function getRequestLocale(): Locale {
  return resolveLocale(cookies().get(LOCALE_COOKIE)?.value, headers().get("accept-language") ?? undefined);
}
