/** Read/write the eval blob parked inside joint_torque_telemetry jsonb. */

import type { ControlArm } from "@/lib/eval/control";
import { HMAC_ALG, MANIFEST_VERSION, type RunManifest } from "@/lib/eval/manifest";
import { DIGEST_ALG, RECEIPT_ALG, type ReceiptAlg } from "@/lib/eval/receipt";
import type { EvalProvenance } from "@/lib/eval/provenance";
import { parseStoredReplayTrail, type StoredReplayTrail } from "@/lib/eval/replay";
import type { FailureRecord } from "@/lib/eval/taxonomy";

export interface OfficialEvalBlob {
  failure: FailureRecord;
  provenance: EvalProvenance;
  sampler_seed: number;
  control: ControlArm | null;
  replay?: StoredReplayTrail;
  digest?: string;
  digest_alg?: typeof DIGEST_ALG;
  signature: string;
  alg: ReceiptAlg;
}

export interface TorqueTelemetry {
  peak: number;
  avg: number;
  eval?: OfficialEvalBlob;
}

export function packOfficialTelemetry(input: {
  peak: number;
  avg: number;
  failure: FailureRecord;
  provenance: EvalProvenance;
  samplerSeed: number;
  control: ControlArm | null;
  replay?: StoredReplayTrail | null;
  digest?: string;
  signature: string;
  alg?: ReceiptAlg;
}): TorqueTelemetry {
  const alg = input.alg ?? (input.digest ? RECEIPT_ALG : HMAC_ALG);
  return {
    peak: input.peak,
    avg: input.avg,
    eval: {
      failure: input.failure,
      provenance: input.provenance,
      sampler_seed: input.samplerSeed,
      control: input.control,
      ...(input.replay ? { replay: input.replay } : {}),
      ...(input.digest
        ? { digest: input.digest, digest_alg: DIGEST_ALG }
        : {}),
      signature: input.signature,
      alg,
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
  const physics = asFiniteNumber(row.physics_hz);
  const latency = asFiniteNumber(row.latency_budget_ms);
  const hz = asFiniteNumber(row.policy_hz);
  if (!scene || !counters || sampler === null || physics === null || latency === null || hz === null) {
    return null;
  }
  if (typeof row.product !== "string" || typeof row.git_sha !== "string") return null;
  if (typeof row.rapier !== "string" || typeof row.node !== "string") return null;
  if (row.observation_mode !== "vla" && row.observation_mode !== "state") return null;
  if (typeof scene.set !== "string" || typeof scene.id !== "string") return null;
  const sceneSeed = asFiniteNumber(scene.seed);
  if (sceneSeed === null || typeof scene.hash !== "string") return null;
  if (scene.arm !== "scored" && scene.arm !== "control") return null;
  const invalid = asFiniteNumber(counters.invalid_actions);
  const timeouts = asFiniteNumber(counters.consecutive_timeouts);
  const actionTimeouts = asFiniteNumber(counters.action_timeouts);
  if (invalid === null || timeouts === null || actionTimeouts === null) return null;

  const started = asFiniteNumber(row.started_at_ms);
  const ended = asFiniteNumber(row.ended_at_ms);
  const duration = asFiniteNumber(row.duration_ms);

  return {
    product: row.product,
    rapier: row.rapier,
    physics_hz: physics,
    git_sha: row.git_sha,
    node: row.node,
    task_id: typeof row.task_id === "string" ? row.task_id : "block_stacking",
    task_version: typeof row.task_version === "string" ? row.task_version : "block_stacking.v1",
    observation_schema_version:
      typeof row.observation_schema_version === "string" ? row.observation_schema_version : "obs.v1",
    action_schema_version:
      typeof row.action_schema_version === "string" ? row.action_schema_version : "action.v1",
    observation_mode: row.observation_mode,
    latency_budget_ms: latency,
    policy_hz: hz,
    sampler_seed: sampler,
    ...(typeof row.eval_window === "string" ? { eval_window: row.eval_window } : {}),
    ...(started !== null ? { started_at_ms: started } : {}),
    ...(ended !== null ? { ended_at_ms: ended } : {}),
    ...(duration !== null ? { duration_ms: duration } : {}),
    scene: {
      set: scene.set,
      id: scene.id,
      seed: sceneSeed,
      hash: scene.hash,
      private_override: scene.private_override === true,
      arm: scene.arm,
    },
    counters: {
      action_timeouts: actionTimeouts,
      invalid_actions: invalid,
      consecutive_timeouts: timeouts,
    },
  };
}

function asAlg(value: unknown, digest: string | undefined): ReceiptAlg {
  if (value === RECEIPT_ALG || value === HMAC_ALG) return value;
  return digest ? RECEIPT_ALG : HMAC_ALG;
}

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
  const digest = typeof blob.digest === "string" ? blob.digest : undefined;
  if (!failure || !provenance || sampler === null || !signature) {
    return { peak, avg };
  }
  const alg = asAlg(blob.alg, digest);
  const replay = parseStoredReplayTrail(blob.replay);
  return {
    peak,
    avg,
    eval: {
      failure,
      provenance,
      sampler_seed: sampler,
      control: asControl(blob.control),
      ...(replay ? { replay } : {}),
      digest,
      digest_alg: digest ? DIGEST_ALG : undefined,
      signature,
      alg,
    },
  };
}

export function manifestFromStored(input: {
  matchId: string;
  agent: string;
  status: "completed" | "failed";
  scores: { spatial_accuracy: number; task_completion_score: number; peak: number; avg: number };
  eval: OfficialEvalBlob;
}): RunManifest {
  return {
    v: MANIFEST_VERSION,
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
