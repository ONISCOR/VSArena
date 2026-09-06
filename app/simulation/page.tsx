import { SimulationDashboard } from "@/components/dashboard/SimulationDashboard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Studio v0.6.0",
  "Live stacking work-cell. Spectate, teleop, or expand Official live. Public ELO is harness-only.",
  "/simulation",
);

export default function SimulationPage() {
  return <SimulationDashboard />;
}
