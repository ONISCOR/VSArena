"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { CubeMark } from "@/components/brand/CubeMark";
import { LocaleSwitch, ThemeSwitch } from "@/components/layout/ChromeSwitches";
import { useCopy } from "@/lib/copy/useCopy";
import { site } from "@/lib/site";

/** Thin exit bar for Studio / live. Physics canvas stays below. */
export function LabBar() {
  const { t } = useCopy();
  const pathname = usePathname();
  const onStudio = pathname.startsWith("/simulation") || pathname.startsWith("/live");

  return (
    <header className="relative z-40 shrink-0 border-b border-[var(--line)] bg-[var(--chrome)]/92 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-3 sm:gap-4 sm:px-4">
        <Link
          href="/"
          aria-label={t.lab.leave}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-[12px] text-[var(--ink)] transition-colors hover:bg-[var(--lift)] hover:text-[var(--ink)]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M8.5 3.5 5 7l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">{t.lab.leave}</span>
        </Link>
        <span className="hidden h-5 w-px shrink-0 bg-[var(--line)] sm:block" />
        <Link href="/simulation" className="flex min-w-0 items-center gap-2.5">
          <span className="relative inline-flex shrink-0 items-center justify-center">
            <CubeMark className="h-9 w-9" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_8px_var(--cyan)]" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[14px] font-medium tracking-tight">VSArena</span>
            <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink)] sm:block">
              {t.lab.studio} · {site.version}
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center rounded-full border border-[var(--line)] bg-[var(--lift)] p-0.5 md:absolute md:left-1/2 md:flex md:-translate-x-1/2"
          aria-label={t.lab.studio}
        >
          <Link
            href="/simulation"
            aria-current={onStudio ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-[13px] ${
              onStudio
                ? "bg-[var(--bg)] text-[var(--ink)]"
                : "text-[var(--ink)] hover:text-[var(--ink)]"
            }`}
          >
            {t.lab.studio}
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full px-3 py-1.5 text-[13px] text-[var(--ink)] hover:text-[var(--ink)]"
          >
            {t.nav.leaderboard}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitch />
          <ThemeSwitch />
          <AuthButton className="btn btn-ghost hidden sm:inline-flex" />
        </div>
      </div>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--cyan)]/35 to-transparent" />
    </header>
  );
}
