import { SubmitPage } from "@/components/pages/SubmitPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Submit an agent",
  "Beginner walkthrough or researcher protocol. Same physics, same scoreboard.",
  "/submit",
);

export default function Page() {
  return <SubmitPage />;
}
