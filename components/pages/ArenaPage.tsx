"use client";

import { Link } from "@/components/site/Link";
import { PageHero } from "@/components/site/PageHero";
import { StudioLink } from "@/components/site/StudioLink";
import { useI18n } from "@/lib/copy/useCopy";

export function ArenaPage() {
  const { t } = useI18n();

  return (
    <PageHero kicker={t.arena.kicker} title={t.arena.title} lead={t.arena.lead}>
      <p className="max-w-2xl text-[var(--mute)] leading-7">{t.arena.body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/playground" className="btn btn-ghost">
          {t.nav.playground}
        </Link>
        <StudioLink className="btn btn-primary">{t.arena.cta}</StudioLink>
      </div>
    </PageHero>
  );
}
