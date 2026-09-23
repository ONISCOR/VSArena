import { DocsPage } from "@/components/pages/DocsPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Documentation",
  "SDK quickstart, VLA vs state tracks, how public ELO is written, and the WebSocket protocol.",
  "/docs",
);

export default function Page() {
  return <DocsPage />;
}
