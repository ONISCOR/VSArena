"use client";

import { useI18n as useLocale } from "@/components/i18n/LocaleProvider";
import { dictionary, type Messages } from "@/lib/copy/dictionary";

/** V1 site copy, keyed by the existing locale cookie. */
export function useCopy(): { t: Messages; locale: "en" | "it" } {
  const { locale } = useLocale();
  return { t: dictionary[locale], locale };
}

export function useI18n() {
  return useCopy();
}
