"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { AgentBadges } from "@/components/gamification/AgentBadges";
import { AgentMark } from "@/components/gamification/AgentMark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/i18n/messages";
import { formatControlPair } from "@/lib/eval/control";
import type { ArenaAgent, StoredMatch } from "@/lib/matches/memory";

/**
 * Localized agent detail + match history + shareable identity.
 *
 * @example <AgentDetailView agent={agent} history={history} />
 */
export function AgentDetailView({ agent, history }: { agent: ArenaAgent; history: StoredMatch[] }) {
  const { m } = useI18n();
  const b = m.board;
  const statusLabel = agent.status === "live" ? b.statusLive : b.statusSeed;
  const [copied, setCopied] = useState(false);

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
      /* fall through to clipboard */
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-16">
      <Link href="/leaderboard" className="text-sm text-arena-muted hover:text-white">
        {b.back}
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <AgentMark avatar={agent.avatarId} accent={agent.accent} size="lg" />
          <div>
            <p className="text-sm font-medium text-arena-cyan">{b.agentKicker}</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight text-white">{agent.name}</h1>
            {agent.tagline ? <p className="mt-2 max-w-xl text-sm text-arena-muted">{agent.tagline}</p> : null}
            {agent.description && agent.description !== agent.tagline ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-arena-muted">{agent.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={agent.status === "live" ? "cyan" : "muted"}>{statusLabel}</Badge>
              <Badge variant={agent.signed ? "cyan" : "muted"}>{agent.signed ? b.signedYes : b.signedNo}</Badge>
              <Badge variant="muted">{b.trackVla}</Badge>
              <AgentBadges ids={agent.badges} />
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => void share()}>
          {copied ? b.shared : b.share}
        </Button>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="panel px-5 py-4">
          <dt className="text-sm text-arena-muted">{b.colElo}</dt>
          <dd className="mt-1 text-3xl font-semibold text-white">{agent.elo}</dd>
        </div>
        <div className="panel px-5 py-4">
          <dt className="text-sm text-arena-muted">{b.colMatches}</dt>
          <dd className="mt-1 text-3xl font-semibold text-white">{agent.matches}</dd>
        </div>
        <div className="panel px-5 py-4">
          <dt className="text-sm text-arena-muted" title={b.seedHint}>
            {b.samplerSeed}
          </dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-white">{agent.samplerSeedLabel}</dd>
        </div>
        <div className="panel px-5 py-4">
          <dt className="text-sm text-arena-muted" title={b.controlHint}>
            {b.colControl}
          </dt>
          <dd className="mt-1 whitespace-nowrap text-xl font-semibold text-white">
            {formatControlPair(agent.controlFailRate, agent.scoredFailRate) ?? b.controlEmpty}
          </dd>
        </div>
      </dl>
      <h2 className="mt-12 text-sm font-medium text-arena-muted">{b.history}</h2>
      <div className="panel mt-3 overflow-x-auto">
        {history.length === 0 ? (
          <p className="px-5 py-8 text-sm text-arena-muted">{b.historyEmpty}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-arena-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{b.colWhen}</th>
                <th className="px-4 py-3 font-medium">{b.colStatus}</th>
                <th className="px-4 py-3 font-medium">{b.colComplete}</th>
                <th className="px-4 py-3 font-medium">{b.colControlScore}</th>
                <th className="px-4 py-3 font-medium">{b.colSigned}</th>
                <th className="px-4 py-3 font-medium">{b.colSpatial}</th>
                <th className="px-4 py-3 font-medium">{b.colDelta}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((match) => (
                <tr key={match.match_id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-arena-muted">{match.stored_at.slice(11, 19)}</td>
                  <td className="px-4 py-3">{matchStatus(match.status)}</td>
                  <td className="px-4 py-3">{match.scores.task_completion_score.toFixed(3)}</td>
                  <td className="px-4 py-3">
                    {match.control ? match.control.task_completion_score.toFixed(3) : b.controlEmpty}
                  </td>
                  <td className="px-4 py-3">{match.signature ? b.signedYes : b.signedNo}</td>
                  <td className="px-4 py-3">{match.scores.spatial_accuracy.toFixed(3)}</td>
                  <td className={`px-4 py-3 ${match.elo_delta >= 0 ? "text-arena-cyan" : "text-arena-orange"}`}>
                    {match.elo_delta >= 0 ? "+" : ""}
                    {match.elo_delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
