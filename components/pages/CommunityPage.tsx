"use client";

import { Link } from "@/components/site/Link";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { useI18n } from "@/lib/copy/useCopy";
import type { DiscordPreview } from "@/lib/discord";
import { fill } from "@/lib/i18n/messages";
import { site } from "@/lib/site";

/**
 * Community hub: official Discord preview plus GitHub issues.
 */
export function CommunityPage({ preview }: { preview: DiscordPreview }) {
  const { t } = useI18n();
  const issues = `${site.github}/issues`;

  return (
    <>
      <PageHero kicker={t.community.kicker} title={t.community.title} lead={t.community.lead}>
        <div className="flex flex-wrap gap-3">
          <a href={preview.inviteUrl} className="btn btn-primary" rel="noreferrer" target="_blank">
            {t.community.discordCta}
          </a>
          <a href={issues} className="btn btn-ghost" rel="noreferrer" target="_blank">
            {t.community.githubCta}
          </a>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1100px] px-5 pb-28 md:px-8">
        <Reveal>
          <a
            href={preview.inviteUrl}
            target="_blank"
            rel="noreferrer"
            className="panel block overflow-hidden rounded-[28px] transition hover:border-[var(--ink)]/25"
          >
            <div className="grid lg:grid-cols-[1fr_minmax(280px,42%)]">
              <div className="p-7 md:p-9">
                <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--faint)]">
                  {t.community.discordOfficial}
                </p>
                <div className="mt-5 flex items-center gap-4">
                  {preview.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.iconUrl}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-2xl border border-[var(--line)] object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5865F2] text-white">
                      <DiscordMark />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-2xl tracking-tight text-[var(--ink)]">{preview.name}</h2>
                    <p className="mt-1 text-sm text-[var(--mute)]">{preview.inviteUrl.replace(/^https:\/\//, "")}</p>
                  </div>
                </div>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--mute)]">{preview.description}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--ink)]">
                  {preview.onlineCount != null ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#23a559]" />
                      {fill(t.community.discordOnline, { n: preview.onlineCount })}
                    </span>
                  ) : null}
                  {preview.memberCount != null ? (
                    <span className="inline-flex items-center gap-2 text-[var(--mute)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--faint)]" />
                      {fill(t.community.discordMembers, { n: preview.memberCount })}
                    </span>
                  ) : null}
                </div>
                <span className="btn btn-primary mt-8 pointer-events-none">{t.community.discordJoin}</span>
              </div>
              <DiscordWindow
                preview={preview}
                joinLabel={t.community.discordJoin}
                onlineLabel={
                  preview.onlineCount != null
                    ? fill(t.community.discordOnline, { n: preview.onlineCount })
                    : t.community.discordOfficial
                }
              />
            </div>
          </a>
        </Reveal>

        <Reveal className="mt-6">
          <article className="panel rounded-[24px] p-7 md:p-8">
            <h2 className="text-xl tracking-tight">{t.community.githubTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--mute)]">{t.community.githubBody}</p>
            <Link href="/docs" className="mt-5 inline-block text-sm text-[var(--ink)] underline-offset-4 hover:underline">
              {t.nav.docs}
            </Link>
          </article>
        </Reveal>
      </section>
    </>
  );
}

function DiscordWindow({
  preview,
  joinLabel,
  onlineLabel,
}: {
  preview: DiscordPreview;
  joinLabel: string;
  onlineLabel: string;
}) {
  return (
    <div className="relative min-h-[260px] bg-[#1e1f22] text-[13px] text-[#dbdee1] lg:min-h-full">
      <div className="flex h-full min-h-[260px]">
        <div className="flex w-[58px] flex-col items-center gap-3 border-r border-black/40 py-3">
          {preview.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.iconUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-2xl object-cover" />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5865F2]">
              <DiscordMark />
            </span>
          )}
          <span className="h-8 w-10 rounded-2xl bg-[#313338]" />
        </div>
        <div className="flex w-[42%] min-w-[8.5rem] flex-col border-r border-black/30 bg-[#2b2d31] px-3 py-3">
          <p className="truncate text-[13px] font-semibold text-white">{preview.name}</p>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">Text</p>
          <p className="mt-2 rounded-md bg-[#404249] px-2 py-1.5 text-[#f2f3f5]">#{preview.channel}</p>
        </div>
        <div className="flex flex-1 flex-col bg-[#313338] px-4 py-3">
          <p className="border-b border-white/5 pb-2 font-semibold text-white">#{preview.channel}</p>
          <p className="mt-4 text-[12px] leading-5 text-[#b5bac1]">{joinLabel}</p>
          <p className="mt-auto pb-1 text-[11px] text-[#23a559]">{onlineLabel}</p>
        </div>
      </div>
    </div>
  );
}

function DiscordMark() {
  return (
    <svg width="22" height="16" viewBox="0 0 71 55" fill="currentColor" aria-hidden>
      <path d="M60.1 4.9A58.5 58.5 0 0 0 45.4.2a.22.22 0 0 0-.23.11 40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.4 37.4 0 0 0 25.3.3a.23.23 0 0 0-.23-.11 58.4 58.4 0 0 0-14.7 4.7.21.21 0 0 0-.1.08C1.5 18.7-.94 32.1.29 45.3a.23.23 0 0 0 .09.16 59.2 59.2 0 0 0 17.8 9. .23.23 0 0 0 .25-.08 42.3 42.3 0 0 0 3.65-5.94.22.22 0 0 0-.12-.31 39 39 0 0 1-5.57-2.65.22.22 0 0 1-.02-.37c.37-.28.75-.57 1.11-.86a.22.22 0 0 1 .23-.03c11.7 5.35 24.35 5.35 35.9 0a.22.22 0 0 1 .23.02c.36.3.74.59 1.12.87a.22.22 0 0 1-.02.37 36.8 36.8 0 0 1-5.57 2.64.22.22 0 0 0-.12.32 47.6 47.6 0 0 0 3.64 5.93.23.23 0 0 0 .25.08 59 59 0 0 0 17.87-9 .22.22 0 0 0 .09-.16c1.48-15.32-2.48-28.56-10.5-40.32a.18.18 0 0 0-.09-.08ZM23.7 37.3c-3.52 0-6.43-3.24-6.43-7.22s2.85-7.22 6.43-7.22c3.6 0 6.49 3.27 6.43 7.22 0 3.98-2.85 7.22-6.43 7.22Zm23.67 0c-3.52 0-6.43-3.24-6.43-7.22s2.85-7.22 6.43-7.22c3.6 0 6.49 3.27 6.43 7.22 0 3.98-2.83 7.22-6.43 7.22Z" />
    </svg>
  );
}
