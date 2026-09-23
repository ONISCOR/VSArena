"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountPanel } from "@/components/account/AccountPanel";
import { LocaleSwitch, ThemeSwitch } from "@/components/layout/ChromeSwitches";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { CodeBlock } from "@/components/ui/code-block";
import type { AccountContext } from "@/lib/account/load";
import { startGithubSignIn } from "@/lib/auth/startGithub";
import { QUICKSTART_BEGINNER_SEEK, QUICKSTART_LIVE_RUN } from "@/lib/docs";
import { fill } from "@/lib/i18n/messages";
import { legalEmail, legalGithub } from "@/lib/legal/meta";
import { harnessWsBase } from "@/lib/live/harnessWs";
import type { StoredMatch } from "@/lib/matches/memory";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "access" | "agents" | "runs" | "privacy" | "prefs";

const TABS: SettingsTab[] = ["profile", "access", "agents", "runs", "privacy", "prefs"];

interface AccountViewProps {
  ctx: AccountContext;
  tab?: string | null;
}

/**
 * Post-login settings: profile, access, agents, official runs, privacy, prefs.
 */
export function AccountView({ ctx, tab: tabProp }: AccountViewProps) {
  const { m, locale } = useI18n();
  const tab = parseTab(tabProp ?? null);
  const dateLocale = locale === "it" ? "it-IT" : "en-GB";

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-20 pt-28 md:px-8 lg:pt-16">
      <header className="max-w-2xl">
        <p className="kicker">{m.account.settingsKicker}</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,6vw,4.6rem)]">{m.account.settingsTitle}</h1>
        <p className="mt-5 text-lg leading-8 text-[var(--mute)]">{m.account.settingsLead}</p>
      </header>

      {ctx.kind === "unconfigured" ? (
        <section className="mt-10 max-w-xl rounded-[22px] border border-[var(--line)] bg-[var(--lift-2)] px-5 py-5">
          <p className="text-sm leading-6 text-[var(--mute)]">{m.account.unconfiguredBody}</p>
        </section>
      ) : null}

      {ctx.kind === "anon" ? (
        <section className="mt-10 max-w-xl rounded-[22px] border border-[var(--line)] bg-[var(--lift-2)] px-5 py-6">
          <p className="text-sm leading-6 text-[var(--mute)]">{m.account.anonBody}</p>
          <button type="button" className="btn btn-primary mt-5" onClick={() => void startGithubSignIn("/account")}>
            {m.account.signInGithub}
          </button>
          <p className="mt-4 text-sm text-[var(--faint)]">
            <Link href="/privacy" className="hover:text-[var(--ink)]">
              {m.account.privacyPolicy}
            </Link>
            <span className="mx-2">·</span>
            <Link href="/submit" className="hover:text-[var(--ink)]">
              {m.account.submitLink}
            </Link>
          </p>
        </section>
      ) : null}

      {ctx.kind === "ready" ? (
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:flex-col" aria-label={m.account.settingsTitle}>
            {TABS.map((id) => (
              <Link
                key={id}
                href={`/account?tab=${id}`}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm",
                  tab === id
                    ? "bg-[var(--ink)] text-[var(--on-ink)]"
                    : "border border-[var(--line)] bg-[var(--lift)] text-[var(--mute)] hover:text-[var(--ink)]",
                )}
              >
                {tabLabel(m.account, id)}
              </Link>
            ))}
          </nav>

          <div className="min-w-0">
            {tab === "profile" ? <ProfilePane ctx={ctx} dateLocale={dateLocale} /> : null}
            {tab === "access" ? <AccessPane ctx={ctx} /> : null}
            {tab === "agents" ? <AgentsPane ctx={ctx} /> : null}
            {tab === "runs" ? <RunsPane runs={ctx.runs} dateLocale={dateLocale} /> : null}
            {tab === "privacy" ? <PrivacyPane /> : null}
            {tab === "prefs" ? <PrefsPane /> : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ProfilePane({
  ctx,
  dateLocale,
}: {
  ctx: Extract<AccountContext, { kind: "ready" }>;
  dateLocale: string;
}) {
  const { m } = useI18n();
  const since = ctx.createdAt ? formatDay(ctx.createdAt, dateLocale) : "—";
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-[var(--lift)] px-5 py-6">
      <p className="kicker">{m.account.tabProfile}</p>
      <h2 className="mt-3 text-2xl tracking-tight">{ctx.username}</h2>
      <a
        href={ctx.githubUrl ?? `https://github.com/${ctx.handle}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block font-mono text-sm text-[var(--mute)] hover:text-[var(--ink)]"
      >
        {fill(m.account.handleOn, { handle: ctx.handle })}
      </a>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <Meta label={m.account.provider} value={m.account.providerGithub} />
        <Meta label={m.account.memberSince} value={since} />
        <Meta label={m.account.emailLabel} value={ctx.email ?? m.account.emailHidden} />
        <Meta label={m.account.tabAgents} value={String(ctx.agents.length)} />
      </dl>
    </section>
  );
}

function AccessPane({ ctx }: { ctx: Extract<AccountContext, { kind: "ready" }> }) {
  const { m } = useI18n();
  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--lift)] px-5 py-6">
        <h2 className="text-xl tracking-tight">{m.account.passwordTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--mute)]">{m.account.passwordBody}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="https://github.com/settings/security"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost !py-2 text-[13px]"
          >
            {m.account.passwordGithub}
          </a>
          <form action="/auth/logout" method="post">
            <button type="submit" className="btn btn-ghost !py-2 text-[13px]">
              {m.nav.signOut}
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-[var(--faint)]">{m.account.signOutHint}</p>
      </section>
      <AccountPanel username={ctx.username} apiKey={ctx.apiKey} agents={ctx.agents} mode="key" />
    </div>
  );
}

function AgentsPane({ ctx }: { ctx: Extract<AccountContext, { kind: "ready" }> }) {
  const { m } = useI18n();
  const harness = harnessWsBase();
  const [rail, setRail] = useState<"live" | "practice">("live");

  return (
    <div className="space-y-5">
      <AccountPanel username={ctx.username} apiKey={ctx.apiKey} agents={ctx.agents} mode="agents" />
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--lift)] px-5 py-6">
        <p className="kicker">{m.account.liveKicker}</p>
        <h2 className="mt-3 text-xl tracking-tight">{m.account.liveTitle}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRail("live")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              rail === "live"
                ? "bg-[var(--ink)] text-[var(--on-ink)]"
                : "border border-[var(--line)] text-[var(--mute)]",
            )}
          >
            {m.account.tabLive}
          </button>
          <button
            type="button"
            onClick={() => setRail("practice")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              rail === "practice"
                ? "bg-[var(--ink)] text-[var(--on-ink)]"
                : "border border-[var(--line)] text-[var(--mute)]",
            )}
          >
            {m.account.tabPractice}
          </button>
        </div>
        {rail === "live" ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm leading-6 text-[var(--mute)]">{m.account.liveLead}</p>
            <CodeBlock label="python" code={QUICKSTART_LIVE_RUN} />
            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">{m.account.liveEnv}</p>
            <CodeBlock wrap label="env" code={`VSARENA_HARNESS_URL=${harness}`} />
            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">{m.account.liveLocal}</p>
            <CodeBlock label="bash" code={m.account.liveLocalCmd} />
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/simulation?view=live" className="btn btn-primary">
                {m.account.liveOfficial}
              </Link>
              <Link href="/docs" className="btn btn-ghost">
                {m.account.docsLink}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-sm leading-6 text-[var(--mute)]">{m.account.practiceBody}</p>
            <CodeBlock label="python" code={QUICKSTART_BEGINNER_SEEK} />
            <Link href="/simulation" className="btn btn-ghost">
              {m.account.practiceStudio}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function RunsPane({ runs, dateLocale }: { runs: StoredMatch[]; dateLocale: string }) {
  const { m } = useI18n();
  const rows = useMemo(
    () => [...runs].sort((a, b) => b.stored_at.localeCompare(a.stored_at)),
    [runs],
  );

  return (
    <section>
      <h2 className="text-2xl tracking-tight">{m.account.runsTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--mute)]">{m.account.runsLead}</p>
      <div className="mt-5 overflow-x-auto rounded-[24px] border border-[var(--line)] bg-[var(--lift)]">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--mute)]">{m.account.runsEmpty}</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">
              <tr className="border-b border-[var(--line)]">
                <th className="px-4 py-3 font-normal">{m.board.colWhen}</th>
                <th className="px-4 py-3 font-normal">{m.account.runsAgent}</th>
                <th className="px-4 py-3 font-normal">{m.board.colStatus}</th>
                <th className="px-4 py-3 font-normal">{m.board.colComplete}</th>
                <th className="px-4 py-3 font-normal">{m.board.colDelta}</th>
                <th className="px-4 py-3 font-normal">{m.board.openRun}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((match) => (
                <tr key={match.match_id} className="border-b border-[var(--line)] last:border-0">
                  <td className="mono px-4 py-4 text-[var(--mute)]">{formatWhen(match.stored_at, dateLocale)}</td>
                  <td className="px-4 py-4">
                    <Link href={`/leaderboard/${match.agent_slug}`} className="hover:underline">
                      {match.agent}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    {match.status === "completed" ? m.board.matchCompleted : m.board.matchFailed}
                  </td>
                  <td className="px-4 py-4 tabular-nums">
                    {Math.round(match.scores.task_completion_score * 100)}%
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
                      {m.board.openRun}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function PrivacyPane() {
  const { m } = useI18n();
  const email = legalEmail() ?? "arankair.dev@gmail.com";
  return (
    <section className="space-y-4">
      <div className="rounded-[24px] border border-[var(--line)] bg-[var(--lift)] px-5 py-6">
        <h2 className="text-2xl tracking-tight">{m.account.privacyTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--mute)]">{m.account.privacyLead}</p>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--mute)]">
          <li>{m.account.privacyPublic}</li>
          <li>{m.account.privacyPrivate}</li>
          <li>{m.account.privacyPrefs}</li>
          <li>{fill(m.account.privacyDelete, { email })}</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/privacy" className="btn btn-ghost !py-2 text-[13px]">
            {m.account.privacyPolicy}
          </Link>
          <Link href="/terms" className="btn btn-ghost !py-2 text-[13px]">
            {m.account.termsLink}
          </Link>
          <Link href="/cookies" className="btn btn-ghost !py-2 text-[13px]">
            {m.account.cookiesLink}
          </Link>
          <a href={legalGithub()} target="_blank" rel="noreferrer" className="btn btn-ghost !py-2 text-[13px]">
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function PrefsPane() {
  const { m } = useI18n();
  return (
    <section className="rounded-[24px] border border-[var(--line)] bg-[var(--lift)] px-5 py-6">
      <h2 className="text-2xl tracking-tight">{m.account.prefsTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--mute)]">{m.account.prefsLead}</p>
      <dl className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <dt className="text-sm text-[var(--mute)]">{m.account.prefsLocale}</dt>
          <dd>
            <LocaleSwitch />
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <dt className="text-sm text-[var(--mute)]">{m.account.prefsTheme}</dt>
          <dd>
            <ThemeSwitch />
          </dd>
        </div>
      </dl>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{label}</dt>
      <dd className="mt-1 text-sm text-[var(--ink)]">{value}</dd>
    </div>
  );
}

function tabLabel(
  account: {
    tabProfile: string;
    tabAccess: string;
    tabAgents: string;
    tabRuns: string;
    tabPrivacy: string;
    tabPrefs: string;
  },
  id: SettingsTab,
) {
  if (id === "profile") return account.tabProfile;
  if (id === "access") return account.tabAccess;
  if (id === "agents") return account.tabAgents;
  if (id === "runs") return account.tabRuns;
  if (id === "privacy") return account.tabPrivacy;
  return account.tabPrefs;
}

function parseTab(value: string | null): SettingsTab {
  return TABS.includes(value as SettingsTab) ? (value as SettingsTab) : "profile";
}

function formatDay(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
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
