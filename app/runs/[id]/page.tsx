import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RunDetailView } from "@/components/runs/RunDetailView";
import { getMatch } from "@/lib/matches/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) return { title: "Run" };
  return {
    title: `${match.agent} · run`,
    description: `Official VSArena run ${match.match_id}`,
  };
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();
  return <RunDetailView match={match} />;
}
