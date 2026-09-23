"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { fill } from "@/lib/i18n/messages";
import { GITHUB_ORG } from "@/lib/content";

interface LandingTrustProps {
  agentCount: number;
}

/**
 * Honest launch strip. Counts come from the public board, not marketing copy.
 */
export function LandingTrust({ agentCount }: LandingTrustProps) {
  const { m } = useI18n();
  const agents =
    agentCount === 1 ? m.landing.trustAgentsOne : fill(m.landing.trustAgentsMany, { n: agentCount });

  return (
    <div className="border-t border-white/[0.06]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-5 text-sm text-arena-muted">
        <span>{m.landing.trustOpen}</span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <Link href="/leaderboard" className="hover:text-white">
          {agents}
        </Link>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>{m.landing.trustPhysics}</span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <a href={GITHUB_ORG} className="hover:text-white" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </div>
  );
}
