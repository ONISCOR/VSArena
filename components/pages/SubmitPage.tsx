"use client";

import Link from "next/link";
import { useState } from "react";
import { CodeBlock } from "@/components/site/CodeBlock";
import { PageHero } from "@/components/site/PageHero";
import { AccountLink, StudioLink } from "@/components/site/StudioLink";
import {
  QUICKSTART_BEGINNER,
  QUICKSTART_BEGINNER_SEEK,
  QUICKSTART_LIVE_CLI,
  QUICKSTART_LIVE_RUN,
} from "@/lib/docs";
import { useI18n } from "@/lib/copy/useCopy";

export function SubmitPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"beginner" | "researcher">("beginner");
  const s = t.submit;
  const steps = mode === "beginner" ? s.beginnerSteps : s.researcherSteps;
  const stepsTitle = mode === "beginner" ? s.beginnerStepsTitle : s.researcherStepsTitle;

  return (
    <>
      <PageHero kicker={s.kicker} title={s.title} lead={s.lead}>
        <div className="inline-flex rounded-full border border-[var(--line)] p-1">
          <button
            type="button"
            onClick={() => setMode("beginner")}
            className={`rounded-full px-4 py-2 text-sm ${mode === "beginner" ? "bg-[var(--ink)] text-black" : "text-[var(--mute)]"}`}
          >
            {s.beginner}
          </button>
          <button
            type="button"
            onClick={() => setMode("researcher")}
            className={`rounded-full px-4 py-2 text-sm ${mode === "researcher" ? "bg-[var(--ink)] text-black" : "text-[var(--mute)]"}`}
          >
            {s.researcher}
          </button>
        </div>
        <p className="mt-3 text-sm text-[var(--faint)]">
          {mode === "beginner" ? s.beginnerNote : s.researcherNote}
        </p>
      </PageHero>

      <section className="mx-auto max-w-[1100px] space-y-16 px-5 pb-24 md:px-8">
        <div>
          <h2 className="display text-4xl">{s.whatTitle}</h2>
          <p className="mt-4 max-w-2xl leading-8 text-[var(--mute)]">{s.whatBody}</p>
          {mode === "researcher" ? (
            <p className="mt-4 max-w-2xl leading-8 text-[var(--mute)]">{s.researcherLead}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <StudioLink className="btn btn-primary">{s.openStudio}</StudioLink>
            <AccountLink className="btn btn-ghost">{s.openAccount}</AccountLink>
            <Link href="/docs#protocol" className="btn btn-ghost">
              {s.openDocs}
            </Link>
            <Link href="/leaderboard" className="btn btn-ghost">
              {s.openBoard}
            </Link>
          </div>
        </div>

        <div>
          <h2 className="display text-4xl">{stepsTitle}</h2>
          <ol className="mt-8 space-y-6">
            {steps.map((step) => (
              <li key={step.n} className="grid gap-3 border-t border-[var(--line)] pt-6 md:grid-cols-[80px_1fr]">
                <span className="display text-3xl text-white/20">{step.n}</span>
                <div>
                  <h3 className="text-xl">{step.title}</h3>
                  <p className="mt-2 max-w-2xl text-[var(--mute)] leading-7">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {mode === "beginner" ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm uppercase tracking-[0.14em] text-[var(--faint)]">
                  {s.beginnerHoldTitle}
                </h3>
                <CodeBlock code={QUICKSTART_BEGINNER} />
              </div>
              <div>
                <h3 className="mb-3 text-sm uppercase tracking-[0.14em] text-[var(--faint)]">
                  {s.beginnerSeekTitle}
                </h3>
                <CodeBlock code={QUICKSTART_BEGINNER_SEEK} />
              </div>
            </div>
            <div>
              <h2 className="display text-4xl">{s.beginnerLiveTitle}</h2>
              <p className="mt-4 max-w-2xl leading-8 text-[var(--mute)]">{s.beginnerLiveBody}</p>
            </div>
            <div>
              <h2 className="display text-4xl">{s.beginnerFailTitle}</h2>
              <ul className="mt-6 max-w-2xl space-y-3 text-[var(--mute)] leading-7">
                {s.beginnerFails.map((item) => (
                  <li key={item} className="border-t border-[var(--line)] pt-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="display text-4xl">{s.researcherLiveTitle}</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <CodeBlock code={QUICKSTART_LIVE_RUN} label="python · live" />
                <CodeBlock code={QUICKSTART_LIVE_CLI} label="bash · cli" />
              </div>
            </div>
            <div>
              <h2 className="display text-4xl">{s.researcherEnvTitle}</h2>
              <p className="mt-4 max-w-2xl leading-8 text-[var(--mute)]">{s.researcherEnvBody}</p>
            </div>
            <div>
              <h2 className="display text-4xl">{s.researcherFailTitle}</h2>
              <ul className="mt-6 max-w-2xl space-y-3 text-[var(--mute)] leading-7">
                {s.researcherFails.map((item) => (
                  <li key={item} className="border-t border-[var(--line)] pt-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div>
          <h2 className="display text-4xl">{s.boardTitle}</h2>
          <p className="mt-4 max-w-2xl leading-8 text-[var(--mute)]">{s.boardBody}</p>
          <div className="mt-8">
            <StudioLink className="btn btn-primary">{s.openStudio}</StudioLink>
          </div>
        </div>
      </section>
    </>
  );
}
