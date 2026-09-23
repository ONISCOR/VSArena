import type { Metadata } from "next";
import { listLeaderboard } from "@/lib/matches/store";
import { LeaderboardView } from "@/components/dashboard/LeaderboardView";
import { pageMetadata } from "@/lib/seo";
import { dict } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * Localized OG title for the public board.
 */
export async function generateMetadata(): Promise<Metadata> {
  const b = dict(getRequestLocale()).board;
  return pageMetadata(b.metaTitle, b.metaDesc, "/leaderboard");
}

export default async function LeaderboardPage() {
  const rows = await listLeaderboard();
  return <LeaderboardView rows={rows} />;
}
