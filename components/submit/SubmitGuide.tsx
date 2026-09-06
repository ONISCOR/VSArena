"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import type { AccountContext } from "@/lib/account/load";
import { QUICKSTART_ACT, QUICKSTART_BEGINNER, QUICKSTART_BEGINNER_SEEK } from "@/lib/docs";
import { fill } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

export type SubmitAudience = "beginner" | "researcher";

const STORAGE_KEY = "vsarena-submit-guide";

interface SubmitGuideProps {
  ctx: AccountContext;
  initialAudience?: SubmitAudience;
}

/**
 * Submit onboarding: beginner walkthrough or researcher protocol path.
 *
 * @example <SubmitGuide ctx={{ kind: "anon" }} />
 */
export function SubmitGuide({ ctx, initialAudience = "beginner" }: SubmitGuideProps) {
  const { m } = useI18n();
  const [audience, setAudience] = useState<SubmitAudience>(initialAudience);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("guide");
    if (fromUrl === "beginner" || fromUrl === "researcher") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "beginner" || saved === "researcher") setAudience(saved);
  }, []);

  function select(next: SubmitAudience) {
    setAudience(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    const url = new URL(window.location.href);
    url.searchParams.set("guide", next);
    window.history.replaceState({}, "", url);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 md:py-20">
      <p className="text-sm font-medium text-arena-cyan">{m.submit.kicker}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{m.submit.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-arena-muted">{m.submit.lead}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <AudienceCard
          active={audience === "beginner"}
          title={m.submit.beginnerTab}
          hint={m.submit.beginnerHint}
          onClick={() => select("beginner")}
        />
        <AudienceCard
          active={audience === "researcher"}
          title={m.submit.researcherTab}
          hint={m.submit.researcherHint}
          onClick={() => select("researcher")}
        />
      </div>

      {audience === "beginner" ? <BeginnerBody ctx={ctx} /> : <ResearcherBody ctx={ctx} />}
    </div>
  );
}

function AudienceCard({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "panel p-5 text-left transition-colors",
        active ? "border-arena-cyan/50 bg-white/[0.04]" : "hover:border-white/20",
      )}
    >
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-arena-muted">{hint}</p>
    </button>
  );
}

function BeginnerBody({ ctx }: { ctx: AccountContext }) {
  const { m } = useI18n();

  return (
    <div className="mt-12 space-y-12">
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-white">{m.submit.beginnerWhatTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-arena-muted">{m.submit.beginnerWhat}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-white">{m.submit.beginnerStepsTitle}</h2>
        <ol className="mt-6 space-y-8">
          <li>
            <p className="text-sm font-medium text-arena-orange">01 · {m.submit.beginner1Title}</p>
            <p className="mt-2 text-sm leading-6 text-arena-muted">{m.submit.beginner1Body}</p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/simulation">{m.submit.beginner1Cta}</Link>
            </Button>
          </li>
          <li>
            <p className="text-sm font-medium text-arena-orange">02 · {m.submit.beginner2Title}</p>
            <p className="mt-2 text-sm leading-6 text-arena-muted">{m.submit.beginner2Body}</p>
            <div className="mt-4">
              <AuthAndKey ctx={ctx} showKeyHeading={false} />
            </div>
          </li>
          <li>
            <p className="text-sm font-medium text-arena-orange">03 · {m.submit.beginner3Title}</p>
            <p className="mt-2 mb-4 text-sm leading-6 text-arena-muted">{m.submit.beginner3Body}</p>
            <p className="mb-2 text-xs font-medium text-white">{m.submit.beginnerHold}</p>
            <CodeBlock label="python" code={QUICKSTART_BEGINNER} />
            <p className="mb-2 mt-6 text-xs font-medium text-white">{m.submit.beginnerSeek}</p>
            <CodeBlock label="python" code={QUICKSTART_BEGINNER_SEEK} />
          </li>
          <li>
            <p className="text-sm font-medium text-arena-orange">04 · {m.submit.beginner4Title}</p>
            <p className="mt-2 text-sm leading-6 text-arena-muted">{m.submit.beginner4Body}</p>
          </li>
        </ol>
      </section>

      <section className="panel p-6">
        <h2 className="text-lg font-semibold text-white">{m.submit.beginnerLiveTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-arena-muted">{m.submit.beginnerLive}</p>
      </section>

      <section className="panel p-6">
        <h2 className="text-lg font-semibold text-white">{m.submit.beginnerFailTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-arena-muted">
          <li>{m.submit.beginnerFail1}</li>
          <li>{m.submit.beginnerFail2}</li>
          <li>{m.submit.beginnerFail3}</li>
        </ul>
      </section>
    </div>
  );
}

function ResearcherBody({ ctx }: { ctx: AccountContext }) {
  const { m } = useI18n();
  const steps = [
    { n: "01", title: m.submit.researcher1Title, body: m.submit.researcher1Body },
    { n: "02", title: m.submit.researcher2Title, body: m.submit.researcher2Body },
    { n: "03", title: m.submit.researcher3Title, body: m.submit.researcher3Body },
  ];

  return (
    <div className="mt-12">
      <p className="max-w-2xl text-sm leading-6 text-arena-muted">{m.submit.researcherLead}</p>
      <ol className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.n} className="panel p-5">
            <p className="text-sm font-medium text-arena-orange">{step.n}</p>
            <h2 className="mt-2 text-base font-semibold text-white">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-arena-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-white">{m.submit.signInH2}</h2>
        <div className="mt-4">
          <AuthAndKey ctx={ctx} showKeyHeading />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-white">{m.submit.actH2}</h2>
        <p className="mt-3 mb-4 text-sm leading-6 text-arena-muted">
          {m.submit.actBody}{" "}
          <Link href="/docs#protocol" className="text-arena-cyan hover:text-white">
            {m.submit.actDocs}
          </Link>
          .
        </p>
        <CodeBlock label="python" code={QUICKSTART_ACT} />
      </section>

      <section className="panel mt-12 p-6">
        <h2 className="text-lg font-semibold text-white">{m.submit.failTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-arena-muted">
          <li>{m.submit.failTimeout}</li>
          <li>{m.submit.failDry}</li>
          <li>{m.submit.failLive}</li>
          <li>{m.submit.failBrowser}</li>
        </ul>
      </section>
    </div>
  );
}

function AuthAndKey({ ctx, showKeyHeading }: { ctx: AccountContext; showKeyHeading: boolean }) {
  const { m } = useI18n();

  return (
    <div className="space-y-8">
      {ctx.kind === "unconfigured" ? (
        <p className="text-sm leading-6 text-arena-muted">{m.submit.unconfigured}</p>
      ) : ctx.kind === "anon" ? (
        <div>
          <p className="text-sm leading-6 text-arena-muted">{m.submit.anon}</p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/auth/login?next=/submit">{m.submit.signInGithub}</Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm leading-6 text-arena-muted">{fill(m.submit.signedIn, { name: ctx.username })}</p>
      )}

      <div>
        {showKeyHeading ? (
          <h3 className="mb-3 text-xl font-semibold tracking-tight text-white">{m.submit.keyH2}</h3>
        ) : null}
        {ctx.kind === "ready" ? (
          <AccountPanel
            username={ctx.username}
            apiKey={ctx.apiKey}
            agents={ctx.agents}
            embedded
          />
        ) : (
          <p className="text-sm leading-6 text-arena-muted">
            {m.submit.keyLocked}{" "}
            <Link href="/account" className="text-arena-cyan hover:text-white">
              {m.footer.account}
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
