"use client";

import { Link } from "@/components/site/Link";
import { Reveal } from "@/components/ui/Reveal";
import { WorkCell } from "@/components/visual/WorkCell";
import { StudioLink } from "@/components/site/StudioLink";
import { useI18n } from "@/lib/copy/useCopy";
import { site } from "@/lib/site";

export type HomeBoardRow = {
  rank: number;
  agent: string;
  note?: string | null;
  affiliation?: string | null;
  elo: number;
  matches: number;
};

export function HomePage({ rows = [] }: { rows?: HomeBoardRow[] }) {
  const { t } = useI18n();
  const top = rows.slice(0, 5);
  const stats = t.home.stats.map((stat, i) =>
    i === 1 ? { ...stat, value: String(rows.length) } : stat,
  );

  return (
    <>
      <section className="relative pb-10 pt-28 md:pt-24 lg:pt-16">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8">
          <h1 className="display reveal mt-0 max-w-5xl text-[clamp(3.2rem,8.4vw,7.2rem)]">
            {t.home.titleA}
            <br />
            <em className="text-[var(--ink)]/75">{t.home.titleB}</em>
          </h1>
          <div className="reveal reveal-d2 mt-7 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-xl text-lg leading-8 text-[var(--mute)]">{t.home.lead}</p>
            <div className="flex flex-wrap gap-3">
              <StudioLink className="btn btn-primary">{t.home.ctaStudio}</StudioLink>
              <Link href="/playground" className="btn btn-ghost">
                {t.home.ctaPlayground}
              </Link>
              <Link href="/submit" className="btn btn-ghost">
                {t.home.ctaSubmit}
              </Link>
            </div>
          </div>
        <div className="reveal reveal-d3 mt-10">
          <WorkCell />
        </div>
      </div>
    </section>

      <section className="mx-auto max-w-[1280px] px-5 pb-20 pt-10 md:px-8">
        <div className="grid gap-3 md:grid-cols-3">
          {t.home.cards.map((card, i) => (
            <Link
              key={card.kicker}
              href={i === 0 ? "/playground" : i === 2 ? "/leaderboard" : "/simulation"}
              className="panel group rounded-[22px] p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-6 flex gap-1">
                <span className="h-2 w-5 rounded-full bg-[#3EE0EA]" />
                <span className="h-2 w-5 rounded-full bg-[#FF7A3C]" />
                <span className="h-2 w-5 rounded-full bg-[#EF2D86]" />
              </div>
              <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                {card.kicker}
              </p>
              <h2 className="mt-2 text-[17px] tracking-tight">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--mute)]">{card.body}</p>
            </Link>
          ))}
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[var(--bg-2)] px-5 py-6">
              <dt className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                {stat.label}
              </dt>
              <dd className="display mt-2 text-4xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-24 md:px-8">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="kicker">{t.home.whyKicker}</p>
              <h2 className="display mt-4 text-[clamp(2.1rem,4.5vw,3.8rem)]">{t.home.whyTitle}</h2>
            </div>
            <div className="max-w-2xl">
              <p className="text-lg leading-8 text-[var(--mute)]">{t.home.whyBody}</p>
              <p className="mt-6 text-sm leading-7 text-[var(--faint)]">{t.home.whyNote}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-8">
        <Reveal>
          <p className="kicker">{t.home.whatKicker}</p>
          <h2 className="display mt-4 text-[clamp(2.1rem,4.5vw,3.8rem)]">{t.home.whatTitle}</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {t.home.pillars.map((pillar, i) => (
            <Reveal key={pillar.n} delay={i * 90}>
              <article className="panel h-full rounded-[24px] p-6">
                <p className="display text-5xl text-white/15">{pillar.n}</p>
                <h3 className="mt-8 text-xl tracking-tight">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{pillar.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-24 md:px-8">
        <Reveal>
          <p className="kicker">{t.home.howKicker}</p>
          <h2 className="display mt-4 text-[clamp(2.1rem,4.5vw,3.8rem)]">{t.home.howTitle}</h2>
        </Reveal>
        <ol className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {t.home.steps.map((step) => (
            <li key={step.n} className="grid gap-4 py-10 md:grid-cols-[120px_200px_1fr] md:items-start">
              <span className="display text-4xl text-white/20">{step.n}</span>
              <h3 className="text-2xl tracking-tight">{step.title}</h3>
              <p className="max-w-xl text-[var(--mute)] leading-7">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-[var(--faint)]">{t.home.howNote}</p>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-8">
        <Reveal>
          <p className="kicker">{t.home.integrityKicker}</p>
          <h2 className="display mt-4 max-w-3xl text-[clamp(2.1rem,4.5vw,3.8rem)]">
            {t.home.integrityTitle}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {t.home.integrityItems.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <article className="h-full rounded-[24px] border border-[var(--line)] p-6">
                <h3 className="text-lg tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-24 md:px-8">
        <div className="panel overflow-hidden rounded-[32px] p-8 md:p-12">
          <Reveal>
            <p className="kicker">{t.home.labsKicker}</p>
            <h2 className="display mt-4 max-w-3xl text-[clamp(2.1rem,4.5vw,3.6rem)]">
              {t.home.labsTitle}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--mute)]">{t.home.labsBody}</p>
            <ul className="mt-8 grid gap-3 md:grid-cols-3">
              {t.home.labsPoints.map((point) => (
                <li key={point} className="rounded-2xl bg-white/[0.03] px-4 py-4 text-sm leading-6 text-[var(--ink)]">
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kicker">{t.home.boardKicker}</p>
            <h2 className="display mt-4 text-[clamp(2.1rem,4.5vw,3.8rem)]">{t.home.boardTitle}</h2>
          </div>
          <Link href="/leaderboard" className="btn btn-ghost">
            {t.home.boardCta}
          </Link>
        </div>
        <div className="panel mt-10 overflow-hidden rounded-[24px]">
          <div className="hidden grid-cols-[64px_1fr_minmax(120px,0.7fr)_100px_100px] gap-4 border-b border-[var(--line)] px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-[var(--faint)] md:grid">
            <span>{t.board.colRank}</span>
            <span>{t.board.colAgent}</span>
            <span>{t.board.colAffil}</span>
            <span>{t.board.colElo}</span>
            <span>{t.board.colMatches}</span>
          </div>
          {top.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--mute)]">{t.board.waiting}</p>
          ) : (
          top.map((row) => (
            <Link
              key={row.agent}
              href="/leaderboard"
              className="grid grid-cols-[48px_1fr_auto] items-center gap-4 border-b border-[var(--line)] px-5 py-4 last:border-0 hover:bg-white/[0.02] md:grid-cols-[64px_1fr_minmax(120px,0.7fr)_100px_100px]"
            >
              <span className="mono text-sm text-[var(--faint)]">{String(row.rank).padStart(2, "0")}</span>
              <span>
                <span className="block text-[15px]">{row.agent}</span>
                <span className="block text-xs text-[var(--faint)]">{row.note ?? "—"}</span>
              </span>
              <span className="hidden text-sm text-[var(--mute)] md:block">{row.affiliation ?? "—"}</span>
              <span className="text-right tabular-nums md:text-left">{row.elo}</span>
              <span className="hidden text-[var(--mute)] md:block">{row.matches}</span>
            </Link>
          ))
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-24 md:px-8">
        <Reveal>
          <p className="kicker">{t.home.teamKicker}</p>
          <h2 className="display mt-4 max-w-3xl text-[clamp(2.1rem,4.5vw,3.8rem)]">{t.home.teamTitle}</h2>
          <p className="mt-6 max-w-xl text-[var(--mute)] leading-7">{t.home.teamBody}</p>
        </Reveal>
        <Reveal delay={80}>
          <article className="panel mt-10 max-w-md rounded-[28px] p-6">
            <h3 className="text-xl">{site.lab}</h3>
            <p className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              {t.home.teamRole}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--mute)]">{t.home.teamBio}</p>
          </article>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pb-28 md:px-8">
        <div className="relative overflow-hidden rounded-[36px] border border-[var(--line)] px-8 py-16 md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(62,224,234,0.12),transparent_40%)]" />
          <p className="display relative text-[clamp(2.4rem,6vw,5rem)]">{t.home.ctaTitle}</p>
          <p className="relative mt-4 max-w-lg text-[var(--mute)]">{t.home.ctaBody}</p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link href="/playground" className="btn btn-primary">
              {t.home.ctaPlayground}
            </Link>
            <StudioLink className="btn btn-ghost">{t.home.ctaStudio}</StudioLink>
          </div>
        </div>
      </section>
    </>
  );
}
