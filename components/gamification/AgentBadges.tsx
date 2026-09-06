"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/LocaleProvider";
import type { BadgeId } from "@/lib/gamification/badges";

const VARIANT: Record<BadgeId, "cyan" | "orange" | "muted"> = {
  first_live: "cyan",
  streak_3: "orange",
  beat_house: "cyan",
  stacker: "orange",
};

/**
 * Harness-earned badges. Hidden when the agent has none.
 *
 * @example <AgentBadges ids={agent.badges} />
 */
export function AgentBadges({ ids }: { ids: BadgeId[] }) {
  const { m } = useI18n();
  if (ids.length === 0) return null;
  const labels: Record<BadgeId, { name: string; hint: string }> = {
    first_live: { name: m.board.badges.first_live, hint: m.board.badges.first_liveHint },
    streak_3: { name: m.board.badges.streak_3, hint: m.board.badges.streak_3Hint },
    beat_house: { name: m.board.badges.beat_house, hint: m.board.badges.beat_houseHint },
    stacker: { name: m.board.badges.stacker, hint: m.board.badges.stackerHint },
  };
  return (
    <ul className="inline-flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <li key={id}>
          <Badge variant={VARIANT[id]} title={labels[id].hint} className="font-mono">
            {labels[id].name}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
