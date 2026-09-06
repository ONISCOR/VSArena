"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { LeaderboardTable } from "@/components/dashboard/LeaderboardTable";
import { PageFrame } from "@/components/layout/PageFrame";
import type { ArenaAgent } from "@/lib/matches/memory";

/**
 * Localized public ELO table.
 *
 * @example <LeaderboardView rows={rows} />
 */
export function LeaderboardView({ rows }: { rows: Array<ArenaAgent & { rank: number }> }) {
  const { m } = useI18n();
  const b = m.board;

  return (
    <PageFrame kicker={b.kicker} title={b.title}>
      <p className="-mt-2 max-w-2xl text-lg leading-8 text-arena-muted">{b.lead}</p>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <Link className="font-medium text-arena-cyan hover:text-white" href="/submit">
          {b.leadLink}
        </Link>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/80">
          {b.leadAfter}
        </span>
      </p>
      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-arena-muted">{b.integrityNote}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <LegendCard title={b.legendSeed} body={b.legendSeedBody} />
          <LegendCard title={b.legendControl} body={b.legendControlBody} />
          <LegendCard title={b.legendSigned} body={b.legendSignedBody} />
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="panel mt-6 px-5 py-8 text-sm text-arena-muted">{b.empty}</p>
      ) : (
        <LeaderboardTable rows={rows} />
      )}
    </PageFrame>
  );
}

function LegendCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel px-4 py-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1.5 text-sm leading-6 text-arena-muted">{body}</p>
    </div>
  );
}
