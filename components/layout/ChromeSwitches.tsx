"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { useTheme, type Theme } from "@/lib/theme";

function PillSwitch({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ id: string; label: ReactNode; name: string }>;
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex items-center rounded-full border border-[var(--line)] bg-[var(--lift)] p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-label={option.name}
          onClick={() => onChange(option.id)}
          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] leading-none ${
            value === option.id ? "bg-[var(--bg)] text-[var(--ink)]" : "text-[var(--ink)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function LocaleSwitch() {
  const { m, locale, setLocale } = useI18n();
  return (
    <PillSwitch
      ariaLabel={m.nav.language}
      value={locale}
      onChange={(id) => setLocale(id as "en" | "it")}
      options={[
        { id: "en", label: "EN", name: "English" },
        { id: "it", label: "IT", name: "Italiano" },
      ]}
    />
  );
}

export function ThemeSwitch() {
  const { m } = useI18n();
  const { theme, setTheme } = useTheme();
  return (
    <PillSwitch
      ariaLabel={m.nav.theme}
      value={theme}
      onChange={(id) => setTheme(id as Theme)}
      options={[
        { id: "dark", label: <MoonIcon />, name: m.nav.themeDark },
        { id: "light", label: <SunIcon />, name: m.nav.themeLight },
      ]}
    />
  );
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="pointer-events-none">
      <path
        d="M10.2 7.35A4.4 4.4 0 0 1 4.65 1.8 4.5 4.5 0 1 0 10.2 7.35Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="pointer-events-none">
      <circle cx="6" cy="6" r="2.15" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M6 1.2v1.1M6 9.7v1.1M1.2 6h1.1M9.7 6h1.1M2.55 2.55l.78.78M8.67 8.67l.78.78M9.45 2.55l-.78.78M3.33 8.67l-.78.78"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
