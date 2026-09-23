import { HomePage } from "@/components/home/HomePage";
import { listLeaderboard } from "@/lib/matches/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await listLeaderboard();
  return (
    <HomePage
      rows={rows.map((row) => ({
        rank: row.rank,
        agent: row.name,
        note: row.tagline ?? row.description,
        affiliation: null,
        elo: row.elo,
        matches: row.matches,
      }))}
    />
  );
}
