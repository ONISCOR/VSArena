export const BADGE_IDS = ["first_live", "streak_3", "beat_house", "stacker"] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export const HOUSE_SLUG = "baseline-ik";
export const STREAK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const STREAK_MIN_MATCHES = 3;
export const NEWCOMER_MATCHES = 3;
export const NEWCOMER_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export interface BadgeStats {
  slug: string;
  matches: number;
  weekMatches: number;
  elo: number;
  houseElo: number;
  stacked: boolean;
}

/**
 * Harness-only badges. Studio demos never increment these stats.
 */
export function computeBadges(stats: BadgeStats): BadgeId[] {
  const out: BadgeId[] = [];
  if (stats.matches > 0) out.push("first_live");
  if (stats.weekMatches >= STREAK_MIN_MATCHES) out.push("streak_3");
  if (stats.slug !== HOUSE_SLUG && stats.matches > 0 && stats.elo > stats.houseElo) out.push("beat_house");
  if (stats.stacked) out.push("stacker");
  return out;
}

export type BoardFilter = "all" | "week" | "live" | "new";

export interface FilterableAgent {
  slug?: string;
  status: "seed" | "live";
  matches: number;
  weekMatches: number;
  createdAt: string | null;
}

/**
 * Subset the board. Rank stays the global ELO rank.
 */
export function filterBoard<T extends FilterableAgent>(rows: T[], filter: BoardFilter, now = Date.now()): T[] {
  if (filter === "all") return rows;
  if (filter === "week") return rows.filter((row) => row.weekMatches > 0);
  if (filter === "live") return rows.filter((row) => row.status === "live");
  return rows.filter((row) => {
    if (row.slug === HOUSE_SLUG) return false;
    return row.matches < NEWCOMER_MATCHES || isNewcomer(row.createdAt, now);
  });
}

function isNewcomer(createdAt: string | null, now: number): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return false;
  return now - t <= NEWCOMER_AGE_MS;
}
