import { SimplePage } from "@/components/pages/SimplePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Events", "No cups scheduled.", "/events");

export default function Page() {
  return <SimplePage kind="events" />;
}
