"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/LocaleProvider";

type SoonSection = "arena" | "community" | "events";

/**
 * Locked-section screen. Studio v0.6.0 stays the live work-cell.
 *
 * @example <ComingSoon section="arena" />
 */
export function ComingSoon({ section }: { section: SoonSection }) {
  const { m } = useI18n();
  const copy = {
    arena: { kicker: m.soon.arenaKicker, title: m.soon.arenaTitle, description: m.soon.arenaBody },
    community: { kicker: m.soon.communityKicker, title: m.soon.communityTitle, description: m.soon.communityBody },
    events: { kicker: m.soon.eventsKicker, title: m.soon.eventsTitle, description: m.soon.eventsBody },
  }[section];

  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-20">
      <p className="text-sm font-medium text-arena-cyan">{copy.kicker}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{copy.title}</h1>
      <Badge variant="orange" className="mt-6">
        {m.soon.badge}
      </Badge>
      <p className="mt-5 max-w-lg text-center text-base leading-7 text-arena-muted">{copy.description}</p>
      <Button asChild className="mt-8" size="lg">
        <Link href="/simulation">{m.soon.cta}</Link>
      </Button>
    </main>
  );
}
