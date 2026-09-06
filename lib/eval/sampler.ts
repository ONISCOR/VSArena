/** Submission-level sampler seed. Assumption: derived from the agent name, never chosen by the submitter. */

import { seedFromId } from "@/lib/eval/scenes";

/**
 * Canonical id for a leaderboard submission (agent display name).
 *
 * @example canonicalSubmissionId("Ada Stack") // "ada-stack"
 */
export function canonicalSubmissionId(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

/**
 * Fixed uint32 sampler seed for this agent name. Same name → same seed → same official layouts.
 *
 * @example samplerSeedFromAgent("Baseline-IK")
 */
export function samplerSeedFromAgent(name: string): number {
  return seedFromId(`submit:${canonicalSubmissionId(name)}`);
}

/**
 * Format a sampler seed the way the board shows it.
 *
 * @example formatSamplerSeed(255) // "000000ff"
 */
export function formatSamplerSeed(seed: number): string {
  return (seed >>> 0).toString(16).padStart(8, "0");
}
