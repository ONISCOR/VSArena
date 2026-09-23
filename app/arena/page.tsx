import { ArenaPage } from "@/components/pages/ArenaPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Arena",
  "Two policies on the same stacking task. Not built yet.",
  "/arena",
);

export default function Page() {
  return <ArenaPage />;
}
