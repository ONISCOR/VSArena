"use client";

import { Link } from "@/components/site/Link";
import { PageHero } from "@/components/site/PageHero";
import { StudioLink } from "@/components/site/StudioLink";
import { useI18n } from "@/lib/copy/useCopy";
import { site } from "@/lib/site";

export function SimplePage({ kind }: { kind: "jobs" | "community" | "events" }) {
  const { t } = useI18n();
  const copy = t[kind];

  return (
    <PageHero kicker={copy.kicker} title={copy.title} lead={copy.lead}>
      <div className="flex flex-wrap gap-3">
        {kind === "jobs" ? (
          <a href={site.github} className="btn btn-primary">
            {t.jobs.cta}
          </a>
        ) : (
          <>
            <StudioLink className="btn btn-primary">{t.nav.openStudio}</StudioLink>
            <Link href="/leaderboard" className="btn btn-ghost">
              {t.nav.leaderboard}
            </Link>
          </>
        )}
      </div>
    </PageHero>
  );
}
