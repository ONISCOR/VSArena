import { CommunityPage } from "@/components/pages/CommunityPage";
import { fetchDiscordPreview } from "@/lib/discord";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata = pageMetadata(
  "Community",
  "Official VSArena Discord. GitHub issues stay for bugs and patches.",
  "/community",
);

export default async function Page() {
  const preview = await fetchDiscordPreview();
  return <CommunityPage preview={preview} />;
}
