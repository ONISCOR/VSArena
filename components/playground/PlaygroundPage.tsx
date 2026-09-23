"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/site/Link";
import { PageHero } from "@/components/site/PageHero";
import { StudioLink } from "@/components/site/StudioLink";
import { useI18n } from "@/lib/copy/useCopy";
import { isPlayTrick, matchPlayCommand, type PlayCommand } from "@/lib/playground";
import { useHudStore } from "@/lib/store";

const ArenaApp = dynamic(() => import("@/components/simulation/ArenaApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[var(--bg)]">
      <p className="text-sm text-[var(--ink)]">Loading physics…</p>
    </div>
  ),
});

export function PlaygroundPage() {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [prompt, setPrompt] = useState("");
  const [unknown, setUnknown] = useState(false);

  const ready = useHudStore((s) => s.ready);
  const tick = useHudStore((s) => s.tick);
  const matchStatus = useHudStore((s) => s.matchStatus);
  const matchResult = useHudStore((s) => s.matchResult);
  const startIk = useHudStore((s) => s.requestBaselineMatch);
  const startSeek = useHudStore((s) => s.requestColorSeekMatch);
  const startTrick = useHudStore((s) => s.requestPlayTrick);
  const abort = useHudStore((s) => s.abortMatch);
  const resetTable = useHudStore((s) => s.requestTableReset);
  const setCameraView = useHudStore((s) => s.setCameraView);

  useEffect(() => {
    setCameraView("play");
    return () => {
      abort();
      resetTable();
      setCameraView("orbit");
    };
  }, [abort, resetTable, setCameraView]);

  const running = matchStatus === "running";
  const status = useMemo(() => {
    if (!ready) return t.playground.boot;
    if (unknown) return t.playground.unknown;
    if (running) return t.playground.playing;
    return t.playground.idle;
  }, [ready, unknown, running, t.playground]);

  const apply = (cmd: PlayCommand) => {
    if (typeof document !== "undefined") {
      document.getElementById("pg-stage")?.scrollIntoView({ block: "nearest" });
    }
    if (cmd === "reset") {
      abort();
      resetTable();
      return;
    }
    if (isPlayTrick(cmd)) startTrick(cmd);
    else if (cmd === "ik") startIk();
    else startSeek();
  };

  const showLocalScore =
    Boolean(matchResult) && !running && !matchResult?.match_id.startsWith("play-");

  const run = (text: string) => {
    const next = matchPlayCommand(text);
    setPrompt(text.trim());
    if (!next) {
      setUnknown(true);
      return;
    }
    setUnknown(false);
    apply(next);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(draft);
  };

  const onReset = () => {
    setDraft("");
    setPrompt("");
    setUnknown(false);
    abort();
    resetTable();
  };

  return (
    <>
      <PageHero kicker={t.playground.kicker} title={t.playground.title} lead={t.playground.lead}>
        <p className="max-w-xl text-sm leading-6 text-[var(--faint)]">{t.playground.note}</p>
      </PageHero>

      <section className="mx-auto grid max-w-[1100px] items-start gap-6 px-5 pb-16 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <article className="panel self-start overflow-hidden rounded-[28px]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3">
            <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">{status}</p>
            <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--mute)]">
              {t.playground.badge}
            </span>
          </div>
          <div id="pg-stage" className="relative aspect-[5/4] w-full bg-[var(--bg)]">
            <ArenaApp />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 to-transparent px-4 py-3">
              <p className="mono text-[10px] text-white/80">
                Rapier 60 Hz · {t.lab.tick} {tick}
              </p>
              <p className="hidden text-[10px] text-white/70 sm:block">{t.lab.keys}</p>
            </div>
          </div>
          {prompt ? (
            <p className="border-t border-[var(--line)] px-5 py-3 text-sm text-[var(--mute)]">“{prompt}”</p>
          ) : null}
          {showLocalScore && matchResult ? (
            <p className="border-t border-[var(--line)] px-5 py-2 font-mono text-[11px] text-[var(--ink)]">
              {t.playground.localScore} {matchResult.scores.spatial_accuracy.toFixed(2)} ·{" "}
              {matchResult.scores.task_completion_score.toFixed(2)}
            </p>
          ) : null}
        </article>

        <div className="flex flex-col gap-6">
          <form className="panel rounded-[28px] p-5" onSubmit={onSubmit}>
            <label htmlFor="pg-prompt" className="text-[15px] tracking-tight">
              {t.playground.promptLabel}
            </label>
            <textarea
              id="pg-prompt"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.playground.placeholder}
              rows={3}
              className="mt-3 w-full resize-none rounded-2xl border border-[var(--line)] bg-black/30 px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--cyan)]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary" disabled={!ready}>
                {t.playground.run}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onReset}>
                {t.playground.reset}
              </button>
            </div>
          </form>

          <div>
            <p className="kicker">{t.playground.challengesKicker}</p>
            <h2 className="display mt-3 text-3xl">{t.playground.challengesTitle}</h2>
            <ul className="mt-5 grid gap-3">
              {t.playground.challenges.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="panel w-full rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5"
                    onClick={() => {
                      setDraft(item.prompt);
                      run(item.prompt);
                    }}
                  >
                    <p className="text-[15px]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--mute)]">{item.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 pb-28 md:px-8">
        <div className="panel rounded-[28px] p-6 md:p-8">
          <h2 className="display text-3xl">{t.playground.labTitle}</h2>
          <p className="mt-3 max-w-xl text-[var(--mute)] leading-7">{t.playground.labBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <StudioLink className="btn btn-primary">{t.playground.labCta}</StudioLink>
            <Link href="/submit" className="btn btn-ghost">
              {t.home.ctaSubmit}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
