/** Simulator / harness provenance stamped on official results. */

import {
  ACTION_SCHEMA_VERSION,
  OBSERVATION_SCHEMA_VERSION,
  PHYSICS_HZ,
  PRODUCT_VERSION,
  RAPIER_VERSION,
  TASK_ID,
  TASK_VERSION,
} from "@/lib/eval/product";
import type { EvalCounters } from "@/lib/eval/taxonomy";
import { episodeTiming } from "@/lib/eval/timing";
import type { ObservationMode } from "@/lib/harness/protocol";
import { ACTION_TIMEOUT_MS, HARNESS_TICK_HZ } from "@/simulation/constants";
import { VLA_ACTION_TIMEOUT_MS, VLA_POLICY_HZ } from "@/lib/vision/raster";

export interface EvalProvenance {
  product: string;
  rapier: string;
  physics_hz: number;
  git_sha: string;
  node: string;
  task_id: string;
  task_version: string;
  observation_schema_version: string;
  action_schema_version: string;
  observation_mode: ObservationMode;
  latency_budget_ms: number;
  policy_hz: number;
  sampler_seed: number;
  eval_window?: string;
  started_at_ms?: number;
  ended_at_ms?: number;
  duration_ms?: number;
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

export function gitSha(env: NodeJS.ProcessEnv = process.env): string {
  const raw =
    env.RENDER_GIT_COMMIT?.trim() ||
    env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    env.GIT_COMMIT?.trim() ||
    "";
  return raw.slice(0, 40) || "unknown";
}

export function latencyBudgetMs(mode: ObservationMode): number {
  return mode === "vla" ? VLA_ACTION_TIMEOUT_MS : ACTION_TIMEOUT_MS;
}

export function policyHz(mode: ObservationMode): number {
  return mode === "vla" ? VLA_POLICY_HZ : HARNESS_TICK_HZ;
}

export function buildProvenance(input: {
  mode: ObservationMode;
  scene: EvalProvenance["scene"];
  counters: EvalCounters;
  samplerSeed: number;
  evalWindow?: string;
  startedAtMs?: number;
  endedAtMs?: number;
  env?: NodeJS.ProcessEnv;
}): EvalProvenance {
  const env = input.env ?? process.env;
  return {
    product: PRODUCT_VERSION,
    rapier: RAPIER_VERSION,
    physics_hz: PHYSICS_HZ,
    git_sha: gitSha(env),
    node: process.version,
    task_id: TASK_ID,
    task_version: TASK_VERSION,
    observation_schema_version: OBSERVATION_SCHEMA_VERSION,
    action_schema_version: ACTION_SCHEMA_VERSION,
    observation_mode: input.mode,
    latency_budget_ms: latencyBudgetMs(input.mode),
    policy_hz: policyHz(input.mode),
    sampler_seed: input.samplerSeed >>> 0,
    ...(input.evalWindow ? { eval_window: input.evalWindow } : {}),
    ...episodeTiming(input.startedAtMs, input.endedAtMs),
    scene: input.scene,
    counters: { ...input.counters },
  };
}
