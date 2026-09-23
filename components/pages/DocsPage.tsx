"use client";

import { CodeBlock } from "@/components/site/CodeBlock";
import { A } from "@/components/site/Link";
import { PageHero } from "@/components/site/PageHero";
import { relatedGroups, vsarenaBibtex } from "@/lib/citations";
import { useI18n } from "@/lib/copy/useCopy";
import {
  PROTOCOL_HELLO,
  QUICKSTART_ACT,
  QUICKSTART_BEGINNER_SEEK,
  QUICKSTART_INSTALL,
  QUICKSTART_LIVE_RUN,
} from "@/lib/docs";
import { site } from "@/lib/site";

export function DocsPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHero kicker={t.docs.kicker} title={t.docs.title} lead={t.docs.lead}>
        <div className="flex flex-wrap gap-3">
          <A href="/submit" className="btn btn-primary">
            {t.docs.quickSubmitCta} →
          </A>
          <A href={site.paper} className="btn btn-ghost">
            {t.docs.researchCta} →
          </A>
          <A href={site.github} className="btn btn-ghost">
            GitHub
          </A>
        </div>
      </PageHero>
      <section className="mx-auto grid max-w-[1100px] gap-12 px-5 pb-24 md:grid-cols-[220px_1fr] md:px-8">
        <aside className="md:sticky md:top-28 md:self-start">
          <nav className="grid gap-2">
            {t.docs.toc.map((item) => (
              <A key={item.href} href={item.href} className="text-sm text-[var(--mute)] hover:text-[var(--ink)]">
                {item.label}
              </A>
            ))}
          </nav>
        </aside>
        <div className="space-y-16">
          <section id="what">
            <h2 className="display text-4xl">{t.docs.whatTitle}</h2>
            <p className="mt-4 leading-8 text-[var(--mute)]">{t.docs.whatBody}</p>
          </section>
          <section id="research">
            <h2 className="display text-4xl">{t.docs.researchTitle}</h2>
            <p className="mt-4 leading-8 text-[var(--mute)]">{t.docs.researchBody}</p>
            <A href={site.paper} className="btn btn-ghost mt-6">
              huggingface.co/spaces/AranKair/vsarena-paper →
            </A>
            <h3 className="mt-10 text-lg">{t.docs.citeTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--mute)]">{t.docs.citeBody}</p>
            <div className="mt-5">
              <CodeBlock code={vsarenaBibtex} label="bibtex" />
            </div>
          </section>
          <section id="quickstart">
            <h2 className="display text-4xl">{t.docs.quickTitle}</h2>
            <p className="mt-4 text-[var(--mute)]">{t.docs.quickLead}</p>
            <div className="mt-5 space-y-4">
              <CodeBlock code={QUICKSTART_INSTALL} label="bash" />
              <CodeBlock code={QUICKSTART_ACT} />
              <CodeBlock code={QUICKSTART_BEGINNER_SEEK} />
              <CodeBlock code={QUICKSTART_LIVE_RUN} label="python · live" />
            </div>
            <A href="/submit" className="btn btn-ghost mt-6">
              {t.docs.quickSubmitCta} →
            </A>
          </section>
          <section id="tracks">
            <h2 className="display text-4xl">{t.docs.tracksTitle}</h2>
            <p className="mt-4 leading-8 text-[var(--mute)]">{t.docs.tracksBody}</p>
            <div className="panel mt-6 overflow-x-auto rounded-2xl">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-4 py-3 font-normal">{t.docs.colTrack}</th>
                    <th className="px-4 py-3 font-normal">{t.docs.colSees}</th>
                    <th className="px-4 py-3 font-normal">{t.docs.colRate}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--line)]">
                    <td className="px-4 py-3">vla</td>
                    <td className="px-4 py-3 text-[var(--mute)]">{t.docs.vlaSees}</td>
                    <td className="px-4 py-3">5 Hz / 2 s</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">state</td>
                    <td className="px-4 py-3 text-[var(--mute)]">{t.docs.stateSees}</td>
                    <td className="px-4 py-3">20 Hz / 150 ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section id="elo">
            <h2 className="display text-4xl">{t.docs.eloTitle}</h2>
            <p className="mt-4 leading-8 text-[var(--mute)]">{t.docs.eloBody}</p>
          </section>
          <section id="protocol">
            <h2 className="display text-4xl">{t.docs.protocolTitle}</h2>
            <p className="mt-4 leading-8 text-[var(--mute)]">{t.docs.protocolBody}</p>
            <div className="mt-5">
              <CodeBlock code={PROTOCOL_HELLO} label="json" />
            </div>
          </section>
          <section id="demos">
            <h2 className="display text-4xl">{t.docs.demosTitle}</h2>
            <p className="mt-4 leading-8 text-[var(--mute)]">{t.docs.demosBody}</p>
          </section>
          <section id="fails">
            <h2 className="display text-4xl">{t.docs.failsTitle}</h2>
            <ul className="mt-5 space-y-3">
              {t.docs.fails.map((item) => (
                <li key={item} className="rounded-2xl border border-[var(--line)] px-4 py-4 text-sm leading-6 text-[var(--mute)]">
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section id="related">
            <h2 className="display text-4xl">{t.docs.relatedTitle}</h2>
            <p className="mt-4 leading-8 text-[var(--mute)]">{t.docs.relatedBody}</p>
            <div className="mt-10 space-y-10">
              {relatedGroups.map((group) => (
                <div key={group.id}>
                  <h3 className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]">
                    {t.docs.relatedGroups[group.id]}
                  </h3>
                  <ol className="mt-4 space-y-4">
                    {group.items.map((item) => (
                      <li key={item.title} className="text-sm leading-6">
                        <span className="text-[var(--mute)]">
                          {item.authors.endsWith(".") ? item.authors : `${item.authors}.`}{" "}
                        </span>
                        {item.href ? (
                          <A href={item.href} className="text-[var(--ink)] underline-offset-4 hover:underline">
                            {item.title}
                          </A>
                        ) : (
                          <span className="text-[var(--ink)]">{item.title}</span>
                        )}
                        <span className="text-[var(--faint)]">. {item.venue}.</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
