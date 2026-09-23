"use client";

import { Link } from "@/components/site/Link";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { useI18n } from "@/lib/copy/useCopy";
import { site } from "@/lib/site";

export function AboutPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHero kicker={t.about.kicker} title={t.about.title} lead={t.about.lead}>
        <div className="flex flex-wrap gap-3">
          <a href={site.github} className="btn btn-primary">
            GitHub →
          </a>
          <Link href="/docs" className="btn btn-ghost">
            {t.nav.docs}
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto grid max-w-[1100px] gap-12 px-5 pb-24 md:grid-cols-[200px_1fr] md:px-8">
        <aside className="md:sticky md:top-28 md:self-start">
          <nav className="grid gap-2">
            {t.about.toc.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-[var(--mute)] hover:text-[var(--ink)]">
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div>
          <Reveal>
            <section id="origin" className="scroll-mt-28">
              <p className="kicker">{t.about.originKicker}</p>
              <h2 className="display mt-4 text-4xl">{t.about.originTitle}</h2>
              <p className="mt-5 max-w-2xl leading-8 text-[var(--mute)]">{t.about.originBody}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--faint)]">{t.about.originNote}</p>
            </section>
          </Reveal>

          <section id="cell" className="mt-20 scroll-mt-28">
            <p className="kicker">{t.about.cellKicker}</p>
            <h2 className="display mt-4 text-4xl">{t.about.cellTitle}</h2>
            <p className="mt-5 max-w-2xl leading-8 text-[var(--mute)]">{t.about.cellLead}</p>
            <dl className="panel mt-8 divide-y divide-[var(--line)] rounded-[24px] px-6">
              {t.about.cell.map((row) => (
                <div key={row.label} className="grid gap-2 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
                  <dt className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{row.label}</dt>
                  <dd className="text-sm leading-6 text-[var(--ink)]">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="surfaces" className="mt-20 scroll-mt-28">
            <p className="kicker">{t.about.surfacesKicker}</p>
            <h2 className="display mt-4 max-w-3xl text-4xl">{t.about.surfacesTitle}</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {t.about.surfaces.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="panel block rounded-[24px] p-6 transition hover:border-[var(--ink)]/20"
                >
                  <h3 className="text-xl tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{item.body}</p>
                </Link>
              ))}
            </div>
          </section>

          <section id="run" className="mt-20 scroll-mt-28">
            <p className="kicker">{t.about.runKicker}</p>
            <h2 className="display mt-4 text-4xl">{t.about.runTitle}</h2>
            <p className="mt-5 max-w-2xl leading-8 text-[var(--mute)]">{t.about.runBody}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {t.about.run.map((item) => (
                <article key={item.title} className="rounded-[24px] border border-[var(--line)] p-5">
                  <h3 className="text-[15px]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--mute)]">{item.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--faint)]">{t.about.runNote}</p>
          </section>

          <section id="score" className="mt-20 scroll-mt-28">
            <p className="kicker">{t.about.scoreKicker}</p>
            <h2 className="display mt-4 max-w-3xl text-4xl">{t.about.scoreTitle}</h2>
            <p className="mt-5 max-w-2xl leading-8 text-[var(--mute)]">{t.about.scoreBody}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {t.about.score.map((item) => (
                <article key={item.title} className="panel rounded-[24px] p-6">
                  <h3 className="text-lg tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{item.body}</p>
                </article>
              ))}
            </div>
            <Link href="/leaderboard" className="btn btn-ghost mt-8">
              {t.nav.leaderboard} →
            </Link>
          </section>

          <section id="who" className="mt-20 scroll-mt-28">
            <p className="kicker">{t.about.whoKicker}</p>
            <h2 className="display mt-4 text-4xl">{t.about.whoTitle}</h2>
            <p className="mt-5 max-w-2xl leading-8 text-[var(--mute)]">{t.about.whoBody}</p>
            <dl className="panel mt-8 max-w-2xl divide-y divide-[var(--line)] rounded-[24px] px-6">
              <div className="grid gap-2 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
                <dt className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{t.about.whoContact}</dt>
                <dd className="text-sm">
                  <a className="text-[var(--ink)] underline-offset-4 hover:underline" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                </dd>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
                <dt className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{t.about.whoRepo}</dt>
                <dd className="text-sm">
                  <a className="text-[var(--ink)] underline-offset-4 hover:underline" href={site.github}>
                    GitHub
                  </a>
                </dd>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
                <dt className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{t.about.whoPreview}</dt>
                <dd className="mono text-sm text-[var(--ink)]">{site.version}</dd>
              </div>
            </dl>
            <article className="panel mt-8 max-w-2xl rounded-[24px] p-6">
              <h3 className="text-lg">{t.about.notTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{t.about.notBody}</p>
            </article>
          </section>

          <section id="rules" className="mt-20 scroll-mt-28">
            <h2 className="display text-4xl">{t.about.rulesTitle}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {t.about.rules.map((rule) => (
                <article key={rule.title} className="rounded-[24px] border border-[var(--line)] p-6">
                  <h3 className="text-lg">{rule.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{rule.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
