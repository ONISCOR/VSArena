"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { CodeBlock } from "@/components/ui/code-block";
import {
  PROTOCOL_ACTION,
  PROTOCOL_HELLO,
  PROTOCOL_RESULT,
  PROTOCOL_STATE,
  QUICKSTART_ACT,
  QUICKSTART_INSTALL,
  QUICKSTART_LIVE,
  QUICKSTART_REPLAY,
} from "@/lib/docs";

const NAV = [
  { id: "overview", key: "navOverview" },
  { id: "quickstart", key: "navQuickstart" },
  { id: "tracks", key: "navTracks" },
  { id: "elo", key: "navElo" },
  { id: "protocol", key: "navProtocol" },
  { id: "demos", key: "navDemos" },
  { id: "fail", key: "navFail" },
] as const;

/**
 * Product docs, localized. Code samples stay English.
 *
 * @example <DocsContent />
 */
export function DocsContent() {
  const { m } = useI18n();
  const d = m.docs;

  return (
    <main className="flex-1">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 md:grid-cols-[200px_minmax(0,1fr)] md:py-20">
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="text-sm font-medium text-arena-cyan">{d.kicker}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:hidden">{d.title}</h1>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-2 md:mt-6 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-arena-muted hover:bg-white/5 hover:text-white md:rounded-lg"
              >
                {d[item.key]}
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0">
          <p className="hidden text-sm font-medium text-arena-cyan md:block">{d.kicker}</p>
          <h1 className="hidden text-4xl font-semibold tracking-tight text-white md:mt-2 md:block md:text-5xl">
            {d.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-arena-muted">{d.lead}</p>

          <Section id="overview" title={d.navOverview}>
            <p>{d.overviewP1}</p>
            <p className="mt-4">
              {d.overviewStart}{" "}
              <Link href="/simulation" className="text-arena-cyan hover:text-white">
                {m.nav.studio}
              </Link>
              {d.overviewThen}{" "}
              <Link href="/submit" className="text-arena-cyan hover:text-white">
                {d.overviewSubmit}
              </Link>
              . {d.overviewFiles}
            </p>
          </Section>

          <Section id="quickstart" title={d.navQuickstart}>
            <p className="mb-4">{d.quickPy}</p>
            <CodeBlock label="bash" code={QUICKSTART_INSTALL} />
            <p className="mb-4 mt-8">{d.quickAct}</p>
            <CodeBlock label="python" code={QUICKSTART_ACT} />
            <p className="mb-4 mt-8">{d.quickSeek}</p>
            <CodeBlock label="python" code={QUICKSTART_LIVE} />
            <ol className="mt-8 list-decimal space-y-2 pl-5 text-sm leading-6 text-arena-muted">
              <li>
                {d.quickLi1a}{" "}
                <Link href="/submit" className="text-arena-cyan hover:text-white">
                  {m.footer.submit}
                </Link>{" "}
                {d.quickLi1b}{" "}
                <Link href="/account" className="text-arena-cyan hover:text-white">
                  {m.footer.account}
                </Link>
                {d.quickLi1c}
              </li>
              <li>{d.quickLi2}</li>
              <li>
                <code className="text-white">{d.quickLi3}</code>
              </li>
            </ol>
          </Section>

          <Section id="tracks" title={d.navTracks}>
            <p>{d.tracksP1}</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-arena-muted">
                    <th className="py-2 pr-4 font-medium">{d.thTrack}</th>
                    <th className="py-2 pr-4 font-medium">{d.thWho}</th>
                    <th className="py-2 pr-4 font-medium">{d.thSees}</th>
                    <th className="py-2 font-medium">{d.thRate}</th>
                  </tr>
                </thead>
                <tbody className="text-arena-muted">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4 text-white">vla</td>
                    <td className="py-3 pr-4">{d.vlaWho}</td>
                    <td className="py-3 pr-4">{d.vlaSees}</td>
                    <td className="py-3">5 Hz / 2 s</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-white">state</td>
                    <td className="py-3 pr-4">{d.stateWho}</td>
                    <td className="py-3 pr-4">{d.stateSees}</td>
                    <td className="py-3">20 Hz / 150 ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">{d.tracksNote}</p>
          </Section>

          <Section id="elo" title={d.navElo}>
            <p>{d.eloP1}</p>
            <p className="mt-4">{d.eloP2}</p>
          </Section>

          <Section id="protocol" title={d.navProtocol}>
            <p className="mb-4">{d.protoLead}</p>
            <p className="mb-2 text-sm text-white">{d.protoHello}</p>
            <CodeBlock label="json" code={PROTOCOL_HELLO} />
            <p className="mb-2 mt-6 text-sm text-white">{d.protoState}</p>
            <CodeBlock label="json" code={PROTOCOL_STATE} />
            <p className="mt-4 text-sm leading-6 text-arena-muted">{d.protoStateNote}</p>
            <p className="mb-2 mt-6 text-sm text-white">{d.protoAction}</p>
            <CodeBlock label="json" code={PROTOCOL_ACTION} />
            <p className="mt-4 text-sm leading-6 text-arena-muted">{d.protoActionNote}</p>
            <p className="mb-2 mt-6 text-sm text-white">{d.protoResult}</p>
            <CodeBlock label="json" code={PROTOCOL_RESULT} />
          </Section>

          <Section id="demos" title={d.navDemos}>
            <p>{d.demosP1}</p>
            <div className="mt-4">
              <CodeBlock label="python" code={QUICKSTART_REPLAY} />
            </div>
          </Section>

          <Section id="fail" title={d.navFail}>
            <ul className="list-disc space-y-3 pl-5">
              <li>{d.failTimeout}</li>
              <li>{d.failElo}</li>
              <li>{d.failHello}</li>
              <li>{d.failCubes}</li>
              <li>{d.failIntegrity}</li>
            </ul>
          </Section>
        </article>
      </div>
    </main>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-16 scroll-mt-24 border-t border-white/[0.06] pt-10">
      <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-arena-muted">{children}</div>
    </section>
  );
}
