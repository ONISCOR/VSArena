import { TeamPage } from "@/components/pages/TeamPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Team", "ONISCOR builds VSArena.", "/team");

export default function Page() {
  return <TeamPage />;
}
