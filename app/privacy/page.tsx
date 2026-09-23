import { LegalPage } from "@/components/pages/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Privacy", "Informativa privacy VSArena.", "/privacy");

export default function Page() {
  return <LegalPage kind="privacy" />;
}
