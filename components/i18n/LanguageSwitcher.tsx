"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { LOCALES, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * EN / IT toggle. Writes vsarena-locale for a year.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, m } = useI18n();

  return (
    <div
      role="group"
      aria-label={m.nav.language}
      className="flex items-center rounded-full border border-white/10 p-0.5"
    >
      {LOCALES.map((code: Locale) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "rounded-full px-2 py-1 text-[11px] font-medium uppercase tracking-wide",
            locale === code ? "bg-white/10 text-white" : "text-arena-muted hover:text-white",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
