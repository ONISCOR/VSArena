"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dict, type Messages } from "@/lib/i18n/messages";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/locale";

interface LocaleContextValue {
  locale: Locale;
  m: Messages;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Client dictionary. Cookie persists the choice; html lang updates immediately.
 */
export function LocaleProvider({ locale: initial, children }: { locale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);
  const m = useMemo(() => dict(locale), [locale]);

  useEffect(() => {
    setLocaleState(initial);
  }, [initial]);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    setLocaleState(next);
  }, []);

  const value = useMemo(() => ({ locale, m, setLocale }), [locale, m, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Current UI strings.
 */
export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used under LocaleProvider");
  return ctx;
}
