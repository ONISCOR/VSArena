import { SimulationDashboard } from "@/components/dashboard/SimulationDashboard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Studio V1",
  "Live stacking work-cell. Spectate, teleop, or expand Official live. Public ELO is harness-only.",
  "/simulation",
);

export default function SimulationPage() {
  return <SimulationDashboard />;
}
