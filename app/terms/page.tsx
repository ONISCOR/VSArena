import { LegalPage } from "@/components/pages/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Terms", "Termini di uso VSArena.", "/terms");

export default function Page() {
  return <LegalPage kind="terms" />;
}
