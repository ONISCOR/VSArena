import { ComingSoon } from "@/components/layout/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Arena",
  "Coming soon: two policies, same stacking task, live.",
  "/arena",
);

/**
 * Future 1v1 pit. Live work-cell is Studio v0.6.0 at /simulation.
 *
 * @example routed at /arena
 */
export default function ArenaPage() {
  return <ComingSoon section="arena" />;
}
