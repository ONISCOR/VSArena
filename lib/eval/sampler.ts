/** Official sampler seed: one ISO-week window, same layouts for every agent. */

import { seedFromId } from "@/lib/eval/scenes";

export interface EvalWindowSeed {
  seed: number;
  window: string;
}

/**
 * Canonical id for a leaderboard submission (agent display name).
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
 * UTC ISO week id, e.g. "2026-W37". Thursday-based, week padded to two digits.
 */
export function evalWindowId(at: Date = new Date()): string {
  const date = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Previous ISO week. Highlights may reveal that window; the current one stays hidden.
 */
export function previousEvalWindowId(at: Date = new Date()): string {
  const shifted = new Date(at.getTime() - 7 * 24 * 60 * 60 * 1000);
  return evalWindowId(shifted);
}

/**
 * True when a stored highlight window is already retired (safe to stream).
 */
export function isRetiredEvalWindow(window: string, at: Date = new Date()): boolean {
  return window < evalWindowId(at);
}

/**
 * Fixed uint32 seed for this eval week. Same week → same official layouts for every agent.
 */
export function officialSamplerSeed(at: Date = new Date()): EvalWindowSeed {
  const window = evalWindowId(at);
  return { seed: seedFromId(`eval:${window}`), window };
}

/**
 * Legacy per-name seed. Not used for official ELO (name was choosable).
 */
export function samplerSeedFromAgent(name: string): number {
  return seedFromId(`submit:${canonicalSubmissionId(name)}`);
}

/**
 * Format a sampler seed the way the board used to show it (hex).
 */
export function formatSamplerSeed(seed: number): string {
  return (seed >>> 0).toString(16).padStart(8, "0");
}
