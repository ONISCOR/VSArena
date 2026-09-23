import { clamp } from "@/simulation/math";

/** House rating for the block-stacking task (single-agent matches). */
export const TASK_RATING = 1200;

/**
 * K-factor for small public samples: volatile early, then tighter.
 */
export function kFactor(matchesPlayed: number): number {
  if (matchesPlayed < 8) return 40;
  if (matchesPlayed < 24) return 24;
  return 16;
}

/**
 * Expected score in [0, 1] for `rating` vs `opponent`.
 */
export function expectedScore(rating: number, opponent: number = TASK_RATING): number {
  return 1 / (1 + 10 ** ((opponent - rating) / 400));
}

/**
 * Integer ELO delta. `outcome` must be a binary stack result in {0, 1}
 * (full tower = 1, anything else = 0). Partial completion does not move rating.
 */
export function eloDelta(rating: number, outcome: number, matchesPlayed: number, opponent: number = TASK_RATING): number {
  const score = clamp(outcome, 0, 1) >= 1 ? 1 : 0;
  const k = kFactor(matchesPlayed);
  return Math.round(k * (score - expectedScore(rating, opponent)));
}

/**
 * Binary ELO outcome from an official match row.
 */
export function eloOutcome(status: string, taskCompletionScore: number): 0 | 1 {
  if (status === "failed") return 0;
  return taskCompletionScore >= 1 ? 1 : 0;
}
