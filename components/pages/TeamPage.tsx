"use client";

import { Link } from "@/components/site/Link";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { useI18n } from "@/lib/copy/useCopy";
import { site } from "@/lib/site";

export function TeamPage() {
  const { t } = useI18n();

  const facts = [
    { label: t.team.contact, href: `mailto:${site.email}`, value: site.email },
    { label: t.team.repo, href: site.github, value: "GitHub" },
    { label: t.team.paper, href: site.paper, value: "AranKair / vsarena-paper" },
    { label: t.team.preview, value: site.version },
    { label: t.team.license, value: t.team.licenseValue },
    { label: t.team.seat, value: t.team.seatValue },
  ];

  return (
    <>
      <PageHero kicker={t.team.kicker} title={t.team.title} lead={t.team.lead}>
        <div className="flex flex-wrap gap-3">
          <a href={site.github} className="btn btn-primary">
            GitHub →
          </a>
          <a href={`mailto:${site.email}`} className="btn btn-ghost">
            {site.email}
          </a>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1100px] px-5 pb-24 md:px-8">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
            <p className="kicker">{t.team.scopeKicker}</p>
            <div>
              <h2 className="display text-4xl">{t.team.scopeTitle}</h2>
              <p className="mono mt-3 text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">
                {site.lab} · {t.team.role}
              </p>
              <p className="mt-5 max-w-2xl leading-8 text-[var(--mute)]">{t.team.scopeBody}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--faint)]">{t.team.scopeNote}</p>
            </div>
          </div>
        </Reveal>

        <div className="mt-20">
          <p className="kicker">{t.team.shipsKicker}</p>
          <h2 className="display mt-4 max-w-3xl text-4xl">{t.team.shipsTitle}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {t.team.ships.map((item) => (
              <article key={item.title} className="panel rounded-[24px] p-6">
                <h3 className="text-xl tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[200px_1fr]">
          <p className="kicker">{t.team.factsKicker}</p>
          <div>
            <h2 className="display text-4xl">{t.team.factsTitle}</h2>
            <dl className="panel mt-8 max-w-2xl divide-y divide-[var(--line)] rounded-[24px] px-6">
              {facts.map((row) => (
                <div key={row.label} className="grid gap-2 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
                  <dt className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">{row.label}</dt>
                  <dd className="text-sm leading-6 text-[var(--ink)]">
                    {row.href ? (
                      <a className="underline-offset-4 hover:underline" href={row.href}>
                        {row.value}
                      </a>
                    ) : (
                      <span className={row.label === t.team.preview ? "mono" : undefined}>{row.value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-20">
          <p className="kicker">{t.team.joinKicker}</p>
          <h2 className="display mt-4 max-w-3xl text-4xl">{t.team.joinTitle}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {t.team.join.map((item) => (
              <article key={item.title} className="rounded-[24px] border border-[var(--line)] p-6">
                <h3 className="text-lg tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{item.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/submit" className="btn btn-ghost">
              {t.footer.submit} →
            </Link>
            <Link href="/jobs" className="btn btn-ghost">
              {t.footer.jobs} →
            </Link>
          </div>
        </div>

        <article className="panel mt-20 max-w-2xl rounded-[24px] p-6">
          <h3 className="text-lg">{t.team.notTitle}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{t.team.notBody}</p>
        </article>
      </section>
    </>
  );
}
