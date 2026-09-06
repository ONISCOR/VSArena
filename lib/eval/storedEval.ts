/** Read/write the eval blob parked inside joint_torque_telemetry jsonb. */

import type { ControlArm } from "@/lib/eval/control";
import { MANIFEST_ALG, type RunManifest } from "@/lib/eval/manifest";
import type { EvalProvenance } from "@/lib/eval/provenance";
import type { FailureRecord } from "@/lib/eval/taxonomy";

export interface OfficialEvalBlob {
  failure: FailureRecord;
  provenance: EvalProvenance;
  sampler_seed: number;
  control: ControlArm | null;
  signature: string;
  alg: typeof MANIFEST_ALG;
}

export interface TorqueTelemetry {
  peak: number;
  avg: number;
  eval?: OfficialEvalBlob;
}

/**
 * Pack scores + integrity fields into the existing jsonb column.
 *
 * @example packOfficialTelemetry({ peak: 1, avg: 0.2, ... })
 */
export function packOfficialTelemetry(input: {
  peak: number;
  avg: number;
  failure: FailureRecord;
  provenance: EvalProvenance;
  samplerSeed: number;
  control: ControlArm | null;
  signature: string;
}): TorqueTelemetry {
  return {
    peak: input.peak,
    avg: input.avg,
    eval: {
      failure: input.failure,
      provenance: input.provenance,
      sampler_seed: input.samplerSeed,
      control: input.control,
      signature: input.signature,
      alg: MANIFEST_ALG,
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asFailure(value: unknown): FailureRecord | null {
  const row = asRecord(value);
  if (!row) return null;
  if (typeof row.code !== "string" || typeof row.domain !== "string") return null;
  if (typeof row.message !== "string" || typeof row.recoverable !== "boolean") return null;
  return {
    code: row.code as FailureRecord["code"],
    domain: row.domain as FailureRecord["domain"],
    message: row.message,
    recoverable: row.recoverable,
  };
}

function asControl(value: unknown): ControlArm | null {
  const row = asRecord(value);
  if (!row) return null;
  const completion = asFiniteNumber(row.task_completion_score);
  const spatial = asFiniteNumber(row.spatial_accuracy);
  const failure = asFailure(row.failure);
  const scene = asRecord(row.scene);
  if (completion === null || spatial === null || !failure || !scene) return null;
  if (row.status !== "completed" && row.status !== "failed") return null;
  return {
    arm: "control",
    status: row.status,
    task_completion_score: completion,
    spatial_accuracy: spatial,
    failure,
    scene: {
      set: "public",
      id: "public.canonical",
      seed: 0,
      hash: typeof scene.hash === "string" ? scene.hash : "",
    },
    degenerate: row.degenerate === true,
  };
}

function asProvenance(value: unknown): EvalProvenance | null {
  const row = asRecord(value);
  if (!row) return null;
  const scene = asRecord(row.scene);
  const counters = asRecord(row.counters);
  const sampler = asFiniteNumber(row.sampler_seed);
  if (!scene || !counters || sampler === null) return null;
  if (typeof row.product !== "string" || typeof row.git_sha !== "string") return null;
  return row as unknown as EvalProvenance;
}

/**
 * Pull peak/avg plus an official eval blob if present.
 *
 * @example parseTorqueTelemetry(row.joint_torque_telemetry)
 */
export function parseTorqueTelemetry(raw: unknown): TorqueTelemetry {
  const row = asRecord(raw) ?? {};
  const peak = asFiniteNumber(row.peak) ?? 0;
  const avg = asFiniteNumber(row.avg) ?? 0;
  const blob = asRecord(row.eval);
  if (!blob) return { peak, avg };
  const failure = asFailure(blob.failure);
  const provenance = asProvenance(blob.provenance);
  const sampler = asFiniteNumber(blob.sampler_seed);
  const signature = typeof blob.signature === "string" ? blob.signature : "";
  if (!failure || !provenance || sampler === null || !signature) {
    return { peak, avg };
  }
  return {
    peak,
    avg,
    eval: {
      failure,
      provenance,
      sampler_seed: sampler,
      control: asControl(blob.control),
      signature,
      alg: MANIFEST_ALG,
    },
  };
}

/**
 * Rebuild the signed manifest from a stored match row.
 *
 * @example manifestFromStored({ matchId, agent, status, scores, eval: blob })
 */
export function manifestFromStored(input: {
  matchId: string;
  agent: string;
  status: "completed" | "failed";
  scores: { spatial_accuracy: number; task_completion_score: number; peak: number; avg: number };
  eval: OfficialEvalBlob;
}): RunManifest {
  return {
    v: 1,
    match_id: input.matchId,
    agent: input.agent,
    status: input.status,
    scores: {
      spatial_accuracy: input.scores.spatial_accuracy,
      task_completion_score: input.scores.task_completion_score,
      joint_torque_telemetry: { peak: input.scores.peak, avg: input.scores.avg },
    },
    sampler_seed: input.eval.sampler_seed,
    failure: input.eval.failure,
    provenance: input.eval.provenance,
    control: input.eval.control,
  };
}
