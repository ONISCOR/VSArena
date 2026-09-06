"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangelogCard } from "@/components/brand/ChangelogCard";
import { ArenaDock } from "@/components/dashboard/ArenaDock";
import { ArenaStatus } from "@/components/dashboard/ArenaStatus";
import { ClipExportModal } from "@/components/dashboard/ClipExportModal";
import { DecisionLog } from "@/components/dashboard/DecisionLog";
import { LeftRail } from "@/components/dashboard/LeftRail";
import { StudioTaskSpoilers } from "@/components/dashboard/StudioTaskSpoilers";
import { useI18n } from "@/components/i18n/LocaleProvider";
import type { SimTabId } from "@/lib/site";

const ArenaApp = dynamic(() => import("@/components/simulation/ArenaApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#07080b]">
      <p className="text-sm text-arena-muted">Loading physics…</p>
    </div>
  ),
});

const LiveViewer = dynamic(
  () => import("@/components/live/LiveViewer").then((m) => m.LiveViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-[#12151c]">
        <p className="text-sm text-arena-muted">Opening live…</p>
      </div>
    ),
  },
);

const LivePip = dynamic(() => import("@/components/live/LivePip").then((m) => m.LivePip), {
  ssr: false,
});

/**
 * Full-bleed studio; `?view=live` expands the official harness spectator.
 *
 * @example <SimulationDashboard />
 */
export function SimulationDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-[#07080b]">
          <p className="text-sm text-arena-muted">Loading studio…</p>
        </div>
      }
    >
      <SimulationDashboardInner />
    </Suspense>
  );
}

function SimulationDashboardInner() {
  const { m } = useI18n();
  const [tab, setTab] = useState<SimTabId>("vision");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const live = searchParams.get("view") === "live";

  const openLive = useCallback(() => {
    router.push(`${pathname}?view=live`, { scroll: false });
  }, [pathname, router]);

  const closeLive = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  if (live) {
    return <LiveViewer onCollapse={closeLive} />;
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-[#07080b] max-md:h-[calc(100dvh-6.75rem)]">
      <ClipExportModal />
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <ArenaApp />
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3 md:p-4">
          <div className="flex min-h-0 flex-1 gap-3">
            <div className="pointer-events-auto hidden min-h-0 w-[16.5rem] shrink-0 flex-col gap-2 overflow-y-auto lg:flex">
              <ArenaStatus />
              <StudioTaskSpoilers />
              <LeftRail tab={tab} />
            </div>
            <div className="pointer-events-auto flex min-h-0 min-w-0 flex-1 flex-col gap-2 lg:hidden">
              <ArenaStatus />
            </div>
            <div className="hidden min-h-0 min-w-0 flex-1 lg:block" />
            <div className="pointer-events-auto hidden min-h-0 w-[16.5rem] shrink-0 flex-col gap-2 overflow-y-auto md:flex">
              <DecisionLog />
              <ChangelogCard compact className="w-full" />
              <div className="mt-auto self-end">
                <LivePip label={m.studio.liveExpand} onExpand={openLive} />
              </div>
            </div>
          </div>
          <div className="pointer-events-auto mt-3 shrink-0">
            <ArenaDock tab={tab} onTab={setTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
