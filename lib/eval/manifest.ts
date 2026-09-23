/** HMAC-SHA256 over the official run manifest. Legacy row verify only — new receipts are digest + Ed25519. */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { ControlArm } from "@/lib/eval/control";
import type { EvalProvenance } from "@/lib/eval/provenance";
import type { FailureRecord } from "@/lib/eval/taxonomy";

export const HMAC_ALG = "hmac-sha256";
export const MANIFEST_ALG = HMAC_ALG;
export const MANIFEST_VERSION = 1;

export interface RunManifest {
  v: typeof MANIFEST_VERSION;
  match_id: string;
  agent: string;
  status: "completed" | "failed";
  scores: {
    spatial_accuracy: number;
    task_completion_score: number;
    joint_torque_telemetry: { peak: number; avg: number };
  };
  sampler_seed: number;
  failure: FailureRecord;
  provenance: EvalProvenance;
  control: ControlArm | null;
}

/**
 * Signing secret. Dedicated key if set, otherwise the ingest secret.
 */
export function resultsSigningSecret(env: NodeJS.ProcessEnv = process.env): string {
  const dedicated = (env.VSARENA_RESULTS_SIGNING_KEY ?? "").trim();
  if (dedicated.length >= 16) return dedicated;
  return (env.HARNESS_INGEST_SECRET ?? "").trim();
}

/**
 * Stable JSON for signatures. Sorted keys, drop undefined, arrays keep order.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const item = obj[key];
    if (item === undefined) continue;
    out[key] = sortValue(item);
  }
  return out;
}

/**
 * Build the signed payload. elo_delta and replay are excluded on purpose.
 */
export function buildRunManifest(input: Omit<RunManifest, "v">): RunManifest {
  return {
    v: MANIFEST_VERSION,
    match_id: input.match_id,
    agent: input.agent,
    status: input.status,
    scores: {
      spatial_accuracy: input.scores.spatial_accuracy,
      task_completion_score: input.scores.task_completion_score,
      joint_torque_telemetry: {
        peak: input.scores.joint_torque_telemetry.peak,
        avg: input.scores.joint_torque_telemetry.avg,
      },
    },
    sampler_seed: input.sampler_seed,
    failure: input.failure,
    provenance: input.provenance,
    control: input.control,
  };
}

/**
 * Hex HMAC-SHA256 of the canonical manifest.
 */
export function signRunManifest(manifest: RunManifest, secret: string): string {
  return createHmac("sha256", secret).update(stableStringify(manifest), "utf8").digest("hex");
}

/**
 * Constant-time signature check.
 */
export function verifyRunManifest(manifest: RunManifest, signature: string, secret: string): boolean {
  if (secret.length < 16) return false;
  const got = (signature ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(got)) return false;
  const expected = signRunManifest(manifest, secret);
  const a = Buffer.from(got, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
