import { SimplePage } from "@/components/pages/SimplePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Contribute", "Patches and agents, not a jobs board.", "/jobs");

export default function Page() {
  return <SimplePage kind="jobs" />;
}
