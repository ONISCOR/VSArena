"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { LabBar } from "@/components/layout/LabBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * Marketing chrome is the V1 sidebar. Studio / live keep a thin exit bar over Rapier.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { m } = useI18n();
  if (path.startsWith("/test-simulazione-avanzata")) return <>{children}</>;
  const lab = path.startsWith("/simulation") || path.startsWith("/live");

  if (lab) {
    return (
      <>
        <LabBar />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </>
    );
  }

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-[var(--on-ink)]"
      >
        {m.chrome.skip}
      </a>
      <SiteHeader />
      <div className="site-shell flex min-h-0 flex-1 flex-col">
        <div id="content" className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </div>
    </>
  );
}
