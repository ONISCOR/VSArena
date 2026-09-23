"use client";

import { Link } from "@/components/site/Link";
import { Reveal } from "@/components/ui/Reveal";
import { RunReplayPlayer } from "@/components/runs/RunReplayPlayer";
import { useI18n } from "@/components/i18n/LocaleProvider";
import type { StoredMatch } from "@/lib/matches/memory";

export function RunDetailView({ match }: { match: StoredMatch }) {
  const { m, locale } = useI18n();
  const r = m.runDetail;
  const dateLocale = locale === "it" ? "it-IT" : "en-GB";
  const provenance = match.provenance;
  const samples = match.replay?.samples ?? [];
  const durationMs = provenance?.duration_ms ?? match.replay?.duration_ms;
  const success = match.status === "completed" && match.scores.task_completion_score >= 1;

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-20 pt-28 md:px-8 lg:pt-16">
      <Reveal>
        <Link
          href={`/leaderboard/${match.agent_slug}`}
          className="text-sm text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
        >
          {r.back}
        </Link>
        <header className="mt-8">
          <p className="kicker">{r.kicker}</p>
          <h1 className="display mt-3 text-[clamp(2rem,4.5vw,3.4rem)]">{match.agent}</h1>
          <p className="mono mt-3 text-sm text-[var(--mute)]">{match.match_id}</p>
        </header>
      </Reveal>

      <Reveal delay={60}>
        <dl className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label={r.outcome} value={success ? r.success : r.failure} />
          <Stat label={r.completion} value={`${Math.round(match.scores.task_completion_score * 100)}%`} />
          <Stat label={r.spatial} value={`${Math.round(match.scores.spatial_accuracy * 100)}%`} />
          <Stat label={r.duration} value={durationMs != null ? formatDuration(durationMs) : "—"} />
        </dl>
      </Reveal>

      <Reveal delay={100}>
        <section className="panel mt-10 space-y-4 rounded-[24px] px-5 py-6">
          <h2 className="text-xl tracking-tight">{r.metadata}</h2>
          <MetaRow
            label={r.task}
            value={`${provenance?.task_id ?? "block_stacking"} · ${provenance?.task_version ?? "—"}`}
          />
          <MetaRow label={r.when} value={formatWhen(match.stored_at, dateLocale)} />
          <MetaRow
            label={r.termination}
            value={match.failure ? `${match.failure.code} — ${match.failure.message}` : match.status}
          />
          <MetaRow label={r.invalidActions} value={String(provenance?.counters?.invalid_actions ?? 0)} />
          <MetaRow label={r.seed} value={String(provenance?.sampler_seed ?? "—")} />
          <MetaRow
            label={r.scene}
            value={
              provenance?.scene
                ? `${provenance.scene.set}/${provenance.scene.id} · ${provenance.scene.hash}`
                : "—"
            }
          />
          <MetaRow
            label={r.build}
            value={
              provenance
                ? `product ${provenance.product} · rapier ${provenance.rapier} · ${provenance.git_sha.slice(0, 8)}`
                : "—"
            }
          />
          <MetaRow
            label={r.schemas}
            value={
              provenance
                ? `${provenance.observation_schema_version ?? "—"} / ${provenance.action_schema_version ?? "—"}`
                : "—"
            }
          />
          <MetaRow label={r.signed} value={match.signature ? r.signedYes : r.signedNo} />
          <MetaRow label={r.eloDelta} value={`${match.elo_delta > 0 ? "+" : ""}${match.elo_delta}`} />
        </section>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-12">
          <h2 className="text-2xl tracking-tight">{r.replay}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--mute)]">{r.replayLead}</p>
          <div className="mt-5">
            <RunReplayPlayer
              samples={samples}
              labels={{
                play: r.play,
                pause: r.pause,
                stepBack: r.stepBack,
                stepForward: r.stepForward,
                jumpFailure: r.jumpFailure,
                tick: r.tick,
                empty: r.replayEmpty,
                grasp: r.grasp,
              }}
            />
          </div>
        </section>
      </Reveal>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--lift)] px-4 py-4">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{label}</dt>
      <dd className="mt-2 text-lg tracking-tight">{value}</dd>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--line)] py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-[12px] uppercase tracking-[0.12em] text-[var(--faint)]">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-[var(--ink)] sm:text-right">{value}</dd>
    </div>
  );
}

function formatWhen(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}
