"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountPanel } from "@/components/account/AccountPanel";
import { ArenaBackdrop } from "@/components/brand/ArenaBackdrop";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import type { AccountContext } from "@/lib/account/load";
import { QUICKSTART_LIVE_RUN, QUICKSTART_PRACTICE } from "@/lib/docs";
import { fill } from "@/lib/i18n/messages";
import { harnessWsBase } from "@/lib/live/harnessWs";
import { cn } from "@/lib/utils";

interface AccountViewProps {
  ctx: AccountContext;
}

/**
 * Account desk: key, agent name, public card, and the live harness path.
 *
 * @example <AccountView ctx={{ kind: "anon" }} />
 */
export function AccountView({ ctx }: AccountViewProps) {
  const { m } = useI18n();
  const harness = harnessWsBase();
  const [rail, setRail] = useState<"live" | "practice">("live");

  return (
    <main className="relative isolate flex-1">
      <ArenaBackdrop />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-arena-cyan">{m.account.kicker}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{m.account.title}</h1>
          <p className="mt-4 text-lg leading-8 text-arena-muted">{m.account.lead}</p>
          <p className="mt-3 text-sm leading-6 text-arena-muted">
            <Link href="/submit" className="text-arena-cyan hover:text-white">
              {m.account.submitLink}
            </Link>
            <span className="mx-2 text-white/20">·</span>
            <Link href="/docs" className="text-arena-cyan hover:text-white">
              {m.account.docsLink}
            </Link>
            {ctx.kind === "ready" ? (
              <>
                <span className="mx-2 text-white/20 lg:hidden">·</span>
                <a href="#desk-live" className="text-arena-cyan hover:text-white lg:hidden">
                  {m.account.jumpLive}
                </a>
              </>
            ) : null}
          </p>
        </header>

        {ctx.kind === "unconfigured" ? (
          <section className="panel mt-10 max-w-xl p-6">
            <p className="text-sm leading-6 text-arena-muted">{m.account.unconfiguredBody}</p>
          </section>
        ) : null}

        {ctx.kind === "anon" ? (
          <section className="panel mt-10 max-w-xl p-6">
            <p className="text-sm leading-6 text-arena-muted">{m.account.anonBody}</p>
            <Button asChild size="lg" className="mt-5">
              <Link href="/auth/login?next=/account">{m.account.signInGithub}</Link>
            </Button>
          </section>
        ) : null}

        {ctx.kind === "ready" ? (
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="order-2 min-w-0 space-y-6 lg:order-1">
              <div className="inline-flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-sm font-medium text-white">{fill(m.account.signedAs, { name: ctx.username })}</p>
                <a
                  href={ctx.githubUrl ?? `https://github.com/${ctx.handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 font-mono text-xs text-arena-muted hover:text-arena-cyan"
                >
                  {fill(m.account.handleOn, { handle: ctx.handle })}
                </a>
              </div>
              <AccountPanel
                username={ctx.username}
                apiKey={ctx.apiKey}
                agents={ctx.agents}
              />
            </div>

            <aside id="desk-live" className="order-1 scroll-mt-24 lg:sticky lg:top-24 lg:order-2">
              <section className="panel p-6">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-arena-cyan">{m.account.liveKicker}</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{m.account.liveTitle}</h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRail("live")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm",
                      rail === "live" ? "bg-white text-zinc-950" : "border border-white/15 text-arena-muted hover:text-white",
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
                        ? "bg-white text-zinc-950"
                        : "border border-white/15 text-arena-muted hover:text-white",
                    )}
                  >
                    {m.account.tabPractice}
                  </button>
                </div>

                {rail === "live" ? (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm leading-6 text-arena-muted">{m.account.liveLead}</p>
                    <CodeBlock label="python" code={QUICKSTART_LIVE_RUN} />
                    <p className="text-[11px] uppercase tracking-[0.12em] text-arena-muted">{m.account.liveEnv}</p>
                    <CodeBlock wrap label="env" code={`VSARENA_HARNESS_URL=${harness}`} />
                    <p className="text-[11px] uppercase tracking-[0.12em] text-arena-muted">{m.account.liveLocal}</p>
                    <CodeBlock label="bash" code={m.account.liveLocalCmd} />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button asChild size="sm">
                        <Link href="/simulation?view=live">{m.account.liveOfficial}</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/docs">{m.account.docsLink}</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm leading-6 text-arena-muted">{m.account.practiceBody}</p>
                    <CodeBlock label="python" code={QUICKSTART_PRACTICE} />
                    <Button asChild size="sm" variant="outline">
                      <Link href="/simulation">{m.account.practiceStudio}</Link>
                    </Button>
                  </div>
                )}
              </section>
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}
