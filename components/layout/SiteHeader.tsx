"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { CubeMark } from "@/components/brand/CubeMark";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { useCopy } from "@/lib/copy/useCopy";
import { LocaleSwitch, ThemeSwitch } from "@/components/layout/ChromeSwitches";
import { MAIN_NAV, SITE_NAME, site } from "@/lib/site";

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    "aria-hidden": true,
    className: "pointer-events-none",
  } as const;

  if (name === "playground") {
    return (
      <svg {...common}>
        <rect x="2.4" y="9.2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="5.5" y="5.6" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="8.6" y="2.1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (name === "arena") {
    return (
      <svg {...common}>
        <path
          d="M6.2 3.6 2.8 8l3.4 4.4M9.8 3.6 13.2 8l-3.4 4.4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "leaderboard") {
    return (
      <svg {...common}>
        <path
          d="M3.2 12.4V8.1h2.4v4.3M6.8 12.4V4.2h2.4v8.2M10.4 12.4V6.6h2.4v5.8"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "docs") {
    return (
      <svg {...common}>
        <path d="M4.2 2.6h5.1L12 5.4v8h-7.8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9.2 2.7v2.8H12M6.1 8.2h4M6.1 10.6h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 6.1v3.4M8 11.15h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function NavLinks({
  onNavigate,
  variant = "side",
}: {
  onNavigate?: () => void;
  variant?: "side" | "mobile";
}) {
  const { m } = useI18n();
  const { t } = useCopy();
  const pathname = usePathname();

  return (
    <>
      {MAIN_NAV.map((item) => {
        const on = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const soon = "soon" in item && item.soon;
        const label = t.nav[item.key as keyof typeof t.nav] ?? m.nav[item.key as keyof typeof m.nav];
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={on ? "page" : undefined}
            className={`site-rail-item${on ? " is-on" : ""}${soon ? " is-soon" : ""}${
              variant === "mobile" ? " text-[15px]" : " text-[13px]"
            }`}
          >
            <span className="site-rail-ico">
              <NavIcon name={item.key} />
            </span>
            <span className="min-w-0 font-medium tracking-tight">{label}</span>
            {soon ? <span className="site-rail-soon">{t.nav.soon}</span> : null}
          </Link>
        );
      })}
    </>
  );
}

function SidebarTools({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useCopy();
  const legal = [
    { href: "/privacy", label: t.footer.privacy },
    { href: "/terms", label: t.footer.terms },
    { href: "/cookies", label: t.footer.cookies },
  ];

  return (
    <div className="shrink-0 space-y-3 border-t border-[var(--line)] px-1 pt-4">
      <div className="flex items-center justify-between gap-2">
        <LocaleSwitch />
        <ThemeSwitch />
      </div>
      <AuthButton className="btn btn-primary w-full" />
      <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1" aria-label={t.footer.legal}>
        {legal.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="text-[11px] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="pointer-events-none">
      <path
        d="M8.5 3.5 5 7l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Collapsible product rail. Studio lives at /simulation, not in this list. */
export function SiteHeader() {
  const { m } = useI18n();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("vsarena-sidebar-v1");
    const next = stored !== "0";
    setSideOpen(next);
    document.documentElement.dataset.nav = next ? "open" : "closed";
  }, []);

  const toggleSide = () => {
    setSideOpen((current) => {
      const next = !current;
      localStorage.setItem("vsarena-sidebar-v1", next ? "1" : "0");
      document.documentElement.dataset.nav = next ? "open" : "closed";
      return next;
    });
  };

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 80 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <aside
        className={`site-rail fixed inset-y-0 left-0 z-50 hidden w-[var(--site-sidebar)] flex-col border-r border-[var(--line)] px-3 py-5 backdrop-blur-xl transition-transform duration-300 ease-out lg:flex ${
          sideOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-1">
          <Link href="/" className="flex min-w-0 items-center gap-1.5" aria-label={m.chrome.home}>
            <span className="site-rail-mark shrink-0">
              <CubeMark className="h-10 w-10" />
            </span>
            <span className="min-w-0 leading-none">
              <span className="block text-[17px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
                {SITE_NAME}
              </span>
              <span className="mono mt-1.5 block text-[10px] uppercase tracking-[0.18em] text-[var(--faint)]">
                {site.version}
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--mute)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
            aria-label={m.nav.hideNav}
            onClick={toggleSide}
          >
            <ChevronLeft />
          </button>
        </div>
        <nav className="mt-7 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" aria-label={m.chrome.primary}>
          <NavLinks />
        </nav>
        <SidebarTools />
      </aside>

      {!sideOpen ? (
        <button
          type="button"
          className="fixed left-4 top-5 z-50 hidden h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--chrome)] text-[var(--ink)] backdrop-blur-xl lg:inline-flex"
          aria-label={m.nav.showNav}
          onClick={toggleSide}
        >
          <CubeMark className="h-8 w-8" />
        </button>
      ) : null}

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-300 lg:hidden ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="border-b border-[var(--line)] bg-[var(--chrome)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5">
            <Link href="/" className="flex items-center gap-1.5 pl-1" aria-label={m.chrome.home}>
              <span className="site-rail-mark shrink-0">
                <CubeMark className="h-9 w-9" />
              </span>
              <span className="text-[16px] font-semibold tracking-[-0.02em]">{SITE_NAME}</span>
            </Link>

            <div className="flex items-center gap-2">
              <AuthButton className="btn btn-primary" />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--lift)]"
                aria-expanded={open}
                aria-label={m.chrome.menu}
                onClick={() => setOpen((v) => !v)}
              >
                <span className="sr-only">{m.chrome.menu}</span>
                <span className="flex w-4 flex-col gap-1">
                  <span className="h-px w-full bg-[var(--ink)]" />
                  <span className="h-px w-full bg-[var(--ink)]" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {open ? (
          <div className="mx-5 mb-4 rounded-3xl border border-[var(--line)] bg-[var(--bg-2)] p-5 backdrop-blur-xl">
            <nav className="grid gap-1.5">
              <NavLinks onNavigate={() => setOpen(false)} variant="mobile" />
            </nav>
            <div className="mt-4">
              <SidebarTools onNavigate={() => setOpen(false)} />
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
