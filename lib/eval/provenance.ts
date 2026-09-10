/** Simulator / harness provenance stamped on official results. */

import { PRODUCT_VERSION, RAPIER_VERSION } from "@/lib/eval/product";
import type { EvalCounters } from "@/lib/eval/taxonomy";
import type { ObservationMode } from "@/lib/harness/protocol";
import { ACTION_TIMEOUT_MS, HARNESS_TICK_HZ } from "@/simulation/constants";
import { VLA_ACTION_TIMEOUT_MS, VLA_POLICY_HZ } from "@/lib/vision/raster";
import { PHYSICS_HZ } from "@/lib/eval/product";

export interface EvalProvenance {
  product: string;
  rapier: string;
  physics_hz: number;
  git_sha: string;
  node: string;
  observation_mode: ObservationMode;
  latency_budget_ms: number;
  policy_hz: number;
  /** Eval-window sampler seed. Same ISO week → same seed for every agent. */
  sampler_seed: number;
  /** UTC ISO week, e.g. "2026-W37". */
  eval_window?: string;
  scene: {
    set: string;
    id: string;
    seed: number;
    hash: string;
    private_override: boolean;
    arm: "scored" | "control";
  };
  counters: EvalCounters;
}

/**
 * Git SHA from Render / Vercel / explicit env.
 *
 * @example gitSha()
 */
export function gitSha(env: NodeJS.ProcessEnv = process.env): string {
  const raw =
    env.RENDER_GIT_COMMIT?.trim() ||
    env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    env.GIT_COMMIT?.trim() ||
    "";
  return raw.slice(0, 40) || "unknown";
}

/**
 * Latency budget for the observation track.
 *
 * @example latencyBudgetMs("vla") // 2000
 */
export function latencyBudgetMs(mode: ObservationMode): number {
  return mode === "vla" ? VLA_ACTION_TIMEOUT_MS : ACTION_TIMEOUT_MS;
}

export function policyHz(mode: ObservationMode): number {
  return mode === "vla" ? VLA_POLICY_HZ : HARNESS_TICK_HZ;
}

/**
 * Build the stamp attached to `result.provenance`.
 *
 * @example buildProvenance({ mode: "vla", scene, counters })
 */
export function buildProvenance(input: {
  mode: ObservationMode;
  scene: EvalProvenance["scene"];
  counters: EvalCounters;
  samplerSeed: number;
  evalWindow?: string;
  env?: NodeJS.ProcessEnv;
}): EvalProvenance {
  const env = input.env ?? process.env;
  return {
    product: PRODUCT_VERSION,
    rapier: RAPIER_VERSION,
    physics_hz: PHYSICS_HZ,
    git_sha: gitSha(env),
    node: process.version,
    observation_mode: input.mode,
    latency_budget_ms: latencyBudgetMs(input.mode),
    policy_hz: policyHz(input.mode),
    sampler_seed: input.samplerSeed >>> 0,
    ...(input.evalWindow ? { eval_window: input.evalWindow } : {}),
    scene: input.scene,
    counters: { ...input.counters },
  };
}
