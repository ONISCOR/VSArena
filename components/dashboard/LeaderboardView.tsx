"use client";

import { useMemo, useState } from "react";
import { Link } from "@/components/site/Link";
import { Reveal } from "@/components/ui/Reveal";
import { AgentMark } from "@/components/gamification/AgentMark";
import { useCopy } from "@/lib/copy/useCopy";
import { formatControlPair } from "@/lib/eval/control";
import { filterBoard, type BoardFilter } from "@/lib/gamification/badges";
import type { ArenaAgent } from "@/lib/matches/memory";

type Row = ArenaAgent & { rank: number };

/**
 * V1 board: official harness rows first, column legend after the table.
 */
export function LeaderboardView({ rows }: { rows: Row[] }) {
  const { t } = useCopy();
  const [filter, setFilter] = useState<BoardFilter>("all");
  const filtered = useMemo(() => filterBoard(rows, filter), [rows, filter]);
  const seed = rows[0]?.samplerSeedLabel;
  const live = rows.filter((row) => row.status === "live").length;

  const filters: Array<{ id: BoardFilter; label: string }> = [
    { id: "all", label: t.board.filterAll },
    { id: "week", label: t.board.filterWeek },
    { id: "live", label: t.board.filterLive },
    { id: "new", label: t.board.filterNew },
  ];

  const legend = [
    [t.board.seedTitle, t.board.seedBody],
    [t.board.splitTitle, t.board.splitBody],
    [t.board.checkTitle, t.board.checkBody],
    [t.board.affilTitle, t.board.affilBody],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-20 pt-28 md:px-8 lg:pt-16">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-8">
          <div className="min-w-0 max-w-2xl">
            <p className="kicker">
              {t.board.kicker}
              {seed ? <span className="normal-case tracking-[0.12em] text-[var(--faint)]">{` · ${seed}`}</span> : null}
            </p>
            <h1 className="display mt-5 text-[clamp(2.6rem,7vw,5.4rem)]">{t.board.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--mute)]">{t.board.lead}</p>
          </div>
          <div>
            <Link href="/submit" className="btn btn-primary">
              {t.board.cta}
            </Link>
            <p className="mt-3 max-w-[16rem] text-sm leading-6 text-[var(--faint)]">{t.board.ctaNote}</p>
          </div>
        </header>
      </Reveal>

      <Reveal delay={70}>
        <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Pulse label={t.board.colAgent} value={String(rows.length)} />
          <Pulse label={t.board.filterLive} value={String(live)} />
          <Pulse label={t.board.colSeed} value={seed ?? "—"} mono className="col-span-2 sm:col-span-1" />
        </dl>
      </Reveal>

      <Reveal delay={120}>
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    filter === item.id
                      ? "bg-[var(--ink)] text-[var(--on-ink)]"
                      : "border border-[var(--line)] bg-[var(--lift)] text-[var(--mute)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-[var(--mute)]">{t.board.count.replace("{n}", String(filtered.length))}</p>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-[24px] border border-[var(--line)] bg-[var(--lift-2)] px-5 py-10 text-sm text-[var(--mute)]">
              {t.board.filterEmpty}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-[24px] border border-[var(--line)] bg-[var(--lift)]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-4 py-3 font-normal">{t.board.colRank}</th>
                    <th className="px-4 py-3 font-normal">{t.board.colAgent}</th>
                    <th className="px-4 py-3 font-normal">{t.board.colElo}</th>
                    <th className="px-4 py-3 font-normal">{t.board.colMatches}</th>
                    <th className="px-4 py-3 font-normal" title={t.board.splitBody}>
                      {t.board.colSplit}
                    </th>
                    <th className="px-4 py-3 font-normal">{t.board.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.slug}
                      className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--lift-2)]"
                    >
                      <td
                        className={`mono px-4 py-4 ${
                          row.rank === 1
                            ? "text-[var(--cyan)]"
                            : row.rank <= 3
                              ? "text-[var(--ink)]"
                              : "text-[var(--faint)]"
                        }`}
                      >
                        {String(row.rank).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/leaderboard/${row.slug}`} className="flex items-center gap-3">
                          <AgentMark
                            avatar={row.avatarId}
                            accent={row.accent}
                            size="sm"
                            className="rounded-xl bg-[var(--lift-2)]"
                          />
                          <span className="min-w-0">
                            <span className="block truncate hover:underline">{row.name}</span>
                            {row.tagline || row.description ? (
                              <span className="mt-0.5 block truncate text-xs text-[var(--faint)]">
                                {row.tagline ?? row.description}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-[1.05rem] tabular-nums tracking-tight">{row.elo}</td>
                      <td className="px-4 py-4 text-[var(--mute)]">{row.matches}</td>
                      <td className="px-4 py-4 tabular-nums text-[var(--mute)]" title={t.board.splitBody}>
                        {formatControlPair(row.controlFailRate, row.scoredFailRate) ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          <Chip live={row.status === "live"}>
                            {row.status === "live" ? t.board.firstLive : t.board.seed}
                          </Chip>
                          {row.stacked ? <Chip live>{t.board.stacked}</Chip> : null}
                          {row.signed ? null : <Chip warn>{t.board.unchecked}</Chip>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Reveal>

      <Reveal delay={180}>
        <section className="mt-14">
          <p className="kicker">{t.board.colsTitle}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {legend.map(([title, body]) => (
              <article key={title} className="rounded-[22px] border border-[var(--line)] bg-[var(--lift)] px-5 py-4">
                <h2 className="text-[15px] tracking-tight">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--mute)]">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>
    </main>
  );
}

function Pulse({
  label,
  value,
  mono,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-[22px] border border-[var(--line)] bg-[var(--lift-2)] px-5 py-4 ${className}`}>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{label}</dt>
      <dd className={`mt-2 text-[1.85rem] leading-none tracking-tight ${mono ? "mono text-[1.25rem]" : "tabular-nums"}`}>
        {value}
      </dd>
    </div>
  );
}

function Chip({
  children,
  live,
  warn,
}: {
  children: string;
  live?: boolean;
  warn?: boolean;
}) {
  const tone = live
    ? "border-[var(--cyan)]/40 bg-[var(--cyan)]/12 text-[var(--cyan)]"
    : warn
      ? "border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)]"
      : "border-[var(--line)] bg-[var(--lift-2)] text-[var(--mute)]";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${tone}`}>
      {children}
    </span>
  );
}
