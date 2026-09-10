"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AgentBadges } from "@/components/gamification/AgentBadges";
import { AgentMark } from "@/components/gamification/AgentMark";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { formatControlPair } from "@/lib/eval/control";
import { filterBoard, type BoardFilter } from "@/lib/gamification/badges";
import type { ArenaAgent } from "@/lib/matches/memory";

type SortKey = "rank" | "name" | "elo" | "matches";

interface Row extends ArenaAgent {
  rank: number;
}

/**
 * Sortable public table. Filters subset rows; rank stays global ELO rank.
 *
 * @example <LeaderboardTable rows={rows} />
 */
export function LeaderboardTable({ rows }: { rows: Row[] }) {
  const { m } = useI18n();
  const b = m.board;
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "rank", dir: "asc" });

  const filtered = useMemo(() => filterBoard(rows, filter), [rows, filter]);

  const ordered = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "name") return dir * a.name.localeCompare(b.name);
      return dir * (a[sort.key] - b[sort.key]);
    });
    return copy;
  }, [filtered, sort]);

  function header(key: SortKey, label: string) {
    const active = sort.key === key;
    return (
      <th className="px-4 py-3">
        <button
          type="button"
          className="text-xs font-medium text-arena-muted hover:text-white"
          onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
        >
          {label}
          {active ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
        </button>
      </th>
    );
  }

  const filters: Array<{ id: BoardFilter; label: string }> = [
    { id: "all", label: b.filterAll },
    { id: "week", label: b.filterWeek },
    { id: "live", label: b.filterLive },
    { id: "new", label: b.filterNew },
  ];

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === item.id
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-arena-muted hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-left font-mono text-sm">
          <thead className="border-b border-white/[0.06] text-[10px]">
            <tr>
              {header("rank", b.colRank)}
              {header("name", b.colAgent)}
              {header("elo", b.colElo)}
              {header("matches", b.colMatches)}
              <th className="px-4 py-3 text-xs font-medium text-arena-muted" title={b.seedHint}>
                {b.colSeed}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-arena-muted" title={b.controlHint}>
                {b.colControl}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-arena-muted">{b.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {ordered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-sm text-arena-muted">
                  {b.filterEmpty}
                </td>
              </tr>
            ) : null}
            {ordered.map((row) => (
              <tr key={row.slug} className="text-arena-fg odd:bg-white/[0.015] hover:bg-white/[0.04]">
                <td className="px-4 py-3 align-middle text-arena-orange">{row.rank}</td>
                <td className="px-4 py-3 align-middle">
                  <Link href={`/leaderboard/${row.slug}`} className="flex items-center gap-3 hover:text-white">
                    <AgentMark avatar={row.avatarId} accent={row.accent} size="sm" />
                    <span>
                      <span className="block text-arena-cyan">{row.name}</span>
                      {row.tagline ? <span className="block text-[11px] text-arena-muted">{row.tagline}</span> : null}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 align-middle text-arena-cyan">{row.elo}</td>
                <td className="px-4 py-3 align-middle text-arena-muted">{row.matches}</td>
                <td className="px-4 py-3 align-middle whitespace-nowrap font-mono text-xs text-arena-muted" title={b.seedHint}>
                  {row.samplerSeedLabel}
                </td>
                <td className="px-4 py-3 align-middle text-xs text-arena-muted" title={b.controlHint}>
                  {formatControlPair(row.controlFailRate, row.scoredFailRate) ?? b.controlEmpty}
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={row.status === "live" ? "cyan" : "muted"}>
                      {row.status === "live" ? b.statusLive : b.statusSeed}
                    </Badge>
                    <Badge variant={row.signed ? "cyan" : "muted"}>{row.signed ? b.signedYes : b.signedNo}</Badge>
                    <AgentBadges ids={row.badges} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
