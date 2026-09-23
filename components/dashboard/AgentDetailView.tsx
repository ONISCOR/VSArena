"use client";

import { useMemo, useState } from "react";
import { Link } from "@/components/site/Link";
import { Reveal } from "@/components/ui/Reveal";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { AgentMark } from "@/components/gamification/AgentMark";
import { fill } from "@/lib/i18n/messages";
import { formatControlPair } from "@/lib/eval/control";
import type { BadgeId } from "@/lib/gamification/badges";
import type { ArenaAgent, StoredMatch } from "@/lib/matches/memory";

/**
 * Agent identity + official match history. V1 chrome; harness data only.
 */
export function AgentDetailView({
  agent,
  history,
  rank,
}: {
  agent: ArenaAgent;
  history: StoredMatch[];
  rank?: number;
}) {
  const { m, locale } = useI18n();
  const b = m.board;
  const [copied, setCopied] = useState(false);
  const dateLocale = locale === "it" ? "it-IT" : "en-GB";
  const rows = useMemo(
    () => [...history].sort((a, c) => c.stored_at.localeCompare(a.stored_at)),
    [history],
  );

  const badgeCopy: Record<BadgeId, { name: string; hint: string }> = {
    first_live: { name: b.badges.first_live, hint: b.badges.first_liveHint },
    streak_3: { name: b.badges.streak_3, hint: b.badges.streak_3Hint },
    beat_house: { name: b.badges.beat_house, hint: b.badges.beat_houseHint },
    stacker: { name: b.badges.stacker, hint: b.badges.stackerHint },
  };

  function matchStatus(status: string): string {
    if (status === "completed") return b.matchCompleted;
    if (status === "pending") return b.matchPending;
    if (status === "running") return b.matchRunning;
    if (status === "failed") return b.matchFailed;
    return status;
  }

  async function share() {
    const url = window.location.href;
    const text = fill(b.agentMeta, { elo: agent.elo, n: agent.matches });
    try {
      if (navigator.share) {
        await navigator.share({ title: `${agent.name} · VSArena`, text, url });
        return;
      }
    } catch {
      /* clipboard */
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const chips: Array<{ key: string; label: string; live?: boolean; hint?: string }> = [
    {
      key: "status",
      label: agent.status === "live" ? b.statusLive : b.statusSeed,
      live: agent.status === "live",
    },
    { key: "signed", label: agent.signed ? b.signedYes : b.signedNo },
    { key: "track", label: b.trackVla },
    ...agent.badges.map((id) => ({
      key: id,
      label: badgeCopy[id].name,
      hint: badgeCopy[id].hint,
      live: id === "stacker" || id === "beat_house",
    })),
  ];

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-20 pt-28 md:px-8 lg:pt-16">
      <Reveal>
        <Link href="/leaderboard" className="text-sm text-[var(--mute)] transition-colors hover:text-[var(--ink)]">
          {b.back}
        </Link>

        <header className="mt-8 flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <AgentMark
              avatar={agent.avatarId}
              accent={agent.accent}
              size="lg"
              className="h-[4.5rem] w-[4.5rem] rounded-2xl bg-[var(--lift)] sm:h-20 sm:w-20"
            />
            <div className="min-w-0">
              <p className="kicker">
                {b.agentKicker}
                {rank ? (
                  <span className="mono normal-case tracking-[0.12em] text-[var(--faint)]">
                    {` · ${String(rank).padStart(2, "0")}`}
                  </span>
                ) : null}
              </p>
              <h1 className="display mt-3 text-[clamp(2.2rem,5.5vw,4.2rem)]">{agent.name}</h1>
              {agent.tagline ? (
                <p className="mt-3 max-w-xl text-base leading-7 text-[var(--mute)]">{agent.tagline}</p>
              ) : null}
              {agent.description && agent.description !== agent.tagline ? (
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--mute)]">{agent.description}</p>
              ) : null}
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <span
                      title={chip.hint}
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${
                      chip.live
                        ? "border-[var(--cyan)]/40 bg-[var(--cyan)]/12 text-[var(--cyan)]"
                        : "border-[var(--line)] bg-[var(--lift)] text-[var(--mute)]"
                    }`}
                    >
                      {chip.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button type="button" className="btn btn-ghost !py-2 text-[13px]" onClick={() => void share()}>
            {copied ? b.shared : b.share}
          </button>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <dl className="mt-10 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat label={b.colElo} value={String(agent.elo)} />
          <Stat label={b.colMatches} value={String(agent.matches)} />
          <Stat label={b.samplerSeed} value={agent.samplerSeedLabel} hint={b.seedHint} mono />
          <Stat
            label={b.colControl}
            value={formatControlPair(agent.controlFailRate, agent.scoredFailRate) ?? b.controlEmpty}
            hint={b.controlHint}
          />
        </dl>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl tracking-tight">{b.history}</h2>
            <p className="text-sm text-[var(--mute)]">
              {rows.length} {b.colMatches.toLowerCase()}
            </p>
          </div>

          <div className="panel mt-5 overflow-x-auto rounded-[24px]">
            {rows.length === 0 ? (
              <p className="px-5 py-10 text-sm text-[var(--mute)]">{b.historyEmpty}</p>
            ) : (
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-4 py-3 font-normal">{b.colWhen}</th>
                    <th className="px-4 py-3 font-normal">{b.colStatus}</th>
                    <th className="px-4 py-3 font-normal">{b.colComplete}</th>
                    <th className="px-4 py-3 font-normal">{b.colControlScore}</th>
                    <th className="px-4 py-3 font-normal">{b.colSigned}</th>
                    <th className="px-4 py-3 font-normal">{b.colSpatial}</th>
                    <th className="px-4 py-3 font-normal">{b.colDelta}</th>
                    <th className="px-4 py-3 font-normal">{b.openRun}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((match) => (
                    <tr
                      key={match.match_id}
                      className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--lift)]"
                    >
                      <td className="mono px-4 py-4 text-[var(--mute)]">{formatWhen(match.stored_at, dateLocale)}</td>
                      <td className="px-4 py-4">{matchStatus(match.status)}</td>
                      <td className="px-4 py-4">
                        <ScoreBar value={match.scores.task_completion_score} />
                      </td>
                      <td className="px-4 py-4 tabular-nums text-[var(--mute)]">
                        {match.control
                          ? `${Math.round(match.control.task_completion_score * 100)}%`
                          : b.controlEmpty}
                      </td>
                      <td className="px-4 py-4 text-[var(--mute)]">
                        {match.signature ? b.signedYes : b.signedNo}
                      </td>
                      <td className="px-4 py-4">
                        <ScoreBar value={match.scores.spatial_accuracy} />
                      </td>
                      <td
                        className={`px-4 py-4 tabular-nums ${
                          match.elo_delta > 0
                            ? "text-[var(--cyan)]"
                            : match.elo_delta < 0
                              ? "text-[var(--amber)]"
                              : "text-[var(--mute)]"
                        }`}
                      >
                        {match.elo_delta > 0 ? "+" : ""}
                        {match.elo_delta}
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/runs/${match.match_id}`} className="text-[var(--cyan)] hover:underline">
                          {b.openRun}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </Reveal>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--lift-2)] px-5 py-5" title={hint}>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{label}</dt>
      <dd className={`mt-3 text-[2rem] leading-none tracking-tight ${mono ? "mono text-[1.35rem]" : "tabular-nums"}`}>
        {value}
      </dd>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-8 tabular-nums">{pct}%</span>
      <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-[var(--line)]">
        <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--cyan)]" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

function formatWhen(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
