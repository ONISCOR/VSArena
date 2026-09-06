"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Global chrome. Studio (incl. expanded live) is full-height; other pages keep a footer.
 *
 * @example <SiteChrome>{children}</SiteChrome>
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const lab = path.startsWith("/test-simulazione-avanzata");
  if (lab) return <>{children}</>;
  const immersive = path.startsWith("/simulation");

  return (
    <>
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {immersive ? null : <SiteFooter />}
    </>
  );
}
