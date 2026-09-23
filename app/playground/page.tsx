import { PlaygroundPage } from "@/components/playground/PlaygroundPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Playground",
  "Public Rapier stacking cell. Same physics as Studio. Not an evaluation.",
  "/playground",
);

export default function Page() {
  return <PlaygroundPage />;
}
