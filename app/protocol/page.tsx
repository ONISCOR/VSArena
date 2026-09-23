import { ProtocolPage } from "@/components/pages/ProtocolPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Protocol", "Harness hello / state / action / result.", "/protocol");

export default function Page() {
  return <ProtocolPage />;
}
