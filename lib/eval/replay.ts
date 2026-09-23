/** Sparse privileged pose trail for official matches (`vsarena-replay-v1`). */

import { REPLAY_FORMAT } from "@/lib/eval/product";
import type { EvalProvenance } from "@/lib/eval/provenance";
import type { FailureRecord } from "@/lib/eval/taxonomy";
import { episodeTiming } from "@/lib/eval/timing";
import type { ResultMessage } from "@/lib/harness/protocol";
import type { JointState, SimulationSnapshot } from "@/simulation/types";

export interface ReplaySample {
  tick: number;
  joints: JointState;
  blocks: Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number, number];
  }>;
  grasped_block_id: string | null;
}

export interface ReplayArtifact {
  format: typeof REPLAY_FORMAT;
  match_id: string;
  agent: string;
  provenance: EvalProvenance;
  failure: FailureRecord;
  scores: ResultMessage["scores"];
  status: ResultMessage["status"];
  samples: ReplaySample[];
  started_at_ms?: number;
  ended_at_ms?: number;
  duration_ms?: number;
}

/** Compact trail inside `joint_torque_telemetry.eval` (unsigned). */
export interface StoredReplayTrail {
  format: typeof REPLAY_FORMAT;
  samples: ReplaySample[];
  started_at_ms?: number;
  ended_at_ms?: number;
  duration_ms?: number;
}

const MAX_SAMPLES = 48;

export function recordSparseSample(
  samples: ReplaySample[],
  snapshot: SimulationSnapshot,
  options: { max: number; stride: number },
): void {
  if (samples.length >= options.max) return;
  if (snapshot.tick !== 0 && snapshot.tick % options.stride !== 0 && samples.length > 0) return;
  samples.push(snapshotToReplaySample(snapshot));
}

export function maybeRecordReplaySample(
  samples: ReplaySample[],
  snapshot: SimulationSnapshot,
  mode: "vla" | "state",
): void {
  recordSparseSample(samples, snapshot, {
    max: MAX_SAMPLES,
    stride: mode === "vla" ? 8 : 40,
  });
}

export function snapshotToReplaySample(snapshot: SimulationSnapshot): ReplaySample {
  return {
    tick: snapshot.tick,
    joints: { ...snapshot.joints },
    blocks: snapshot.blocks.map((b) => ({
      id: b.id,
      position: [...b.position] as [number, number, number],
      rotation: [...b.rotation] as [number, number, number, number],
    })),
    grasped_block_id: snapshot.graspedBlockId,
  };
}

export function buildReplayArtifact(input: {
  matchId: string;
  agent: string;
  provenance: EvalProvenance;
  failure: FailureRecord;
  scores: ResultMessage["scores"];
  status: ResultMessage["status"];
  samples: ReplaySample[];
  startedAtMs?: number;
  endedAtMs?: number;
}): ReplayArtifact {
  return {
    format: REPLAY_FORMAT,
    match_id: input.matchId,
    agent: input.agent,
    provenance: input.provenance,
    failure: input.failure,
    scores: input.scores,
    status: input.status,
    samples: input.samples,
    ...episodeTiming(input.startedAtMs, input.endedAtMs),
  };
}

export function toStoredReplayTrail(artifact: ReplayArtifact): StoredReplayTrail {
  return {
    format: artifact.format,
    samples: artifact.samples,
    ...(artifact.started_at_ms !== undefined ? { started_at_ms: artifact.started_at_ms } : {}),
    ...(artifact.ended_at_ms !== undefined ? { ended_at_ms: artifact.ended_at_ms } : {}),
    ...(artifact.duration_ms !== undefined ? { duration_ms: artifact.duration_ms } : {}),
  };
}

export function hydrateReplayArtifact(
  trail: StoredReplayTrail,
  meta: {
    matchId: string;
    agent: string;
    provenance: EvalProvenance;
    failure: FailureRecord;
    scores: ResultMessage["scores"];
    status: ResultMessage["status"];
  },
): ReplayArtifact {
  return {
    format: trail.format,
    match_id: meta.matchId,
    agent: meta.agent,
    provenance: meta.provenance,
    failure: meta.failure,
    scores: meta.scores,
    status: meta.status,
    samples: trail.samples,
    ...(trail.started_at_ms !== undefined ? { started_at_ms: trail.started_at_ms } : {}),
    ...(trail.ended_at_ms !== undefined ? { ended_at_ms: trail.ended_at_ms } : {}),
    ...(trail.duration_ms !== undefined ? { duration_ms: trail.duration_ms } : {}),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asFinite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asJoints(value: unknown): JointState | null {
  const row = asRecord(value);
  if (!row) return null;
  const baseYaw = asFinite(row.baseYaw);
  const shoulderPitch = asFinite(row.shoulderPitch);
  const elbowPitch = asFinite(row.elbowPitch);
  const wristPitch = asFinite(row.wristPitch);
  const gripper = asFinite(row.gripper);
  if (
    baseYaw === null ||
    shoulderPitch === null ||
    elbowPitch === null ||
    wristPitch === null ||
    gripper === null
  ) {
    return null;
  }
  return { baseYaw, shoulderPitch, elbowPitch, wristPitch, gripper };
}

function asSample(value: unknown): ReplaySample | null {
  const row = asRecord(value);
  if (!row) return null;
  const tick = asFinite(row.tick);
  const joints = asJoints(row.joints);
  if (tick === null || !joints || !Array.isArray(row.blocks)) return null;
  const blocks: ReplaySample["blocks"] = [];
  for (const block of row.blocks) {
    const b = asRecord(block);
    if (!b || typeof b.id !== "string") return null;
    const pos = b.position;
    const rot = b.rotation;
    if (!Array.isArray(pos) || pos.length !== 3 || !pos.every((n) => typeof n === "number" && Number.isFinite(n))) {
      return null;
    }
    if (!Array.isArray(rot) || rot.length !== 4 || !rot.every((n) => typeof n === "number" && Number.isFinite(n))) {
      return null;
    }
    blocks.push({
      id: b.id,
      position: [pos[0], pos[1], pos[2]],
      rotation: [rot[0], rot[1], rot[2], rot[3]],
    });
  }
  const grasped =
    row.grasped_block_id === null || typeof row.grasped_block_id === "string"
      ? (row.grasped_block_id as string | null)
      : null;
  return { tick, joints, blocks, grasped_block_id: grasped };
}

/** Accepts a trail or a full artifact; only format + samples (+ optional timing) are kept. */
export function parseStoredReplayTrail(raw: unknown): StoredReplayTrail | null {
  const row = asRecord(raw);
  if (!row || row.format !== REPLAY_FORMAT || !Array.isArray(row.samples)) return null;
  const samples: ReplaySample[] = [];
  for (const item of row.samples.slice(0, MAX_SAMPLES)) {
    const sample = asSample(item);
    if (!sample) return null;
    samples.push(sample);
  }
  const started = asFinite(row.started_at_ms);
  const ended = asFinite(row.ended_at_ms);
  const duration = asFinite(row.duration_ms);
  return {
    format: REPLAY_FORMAT,
    samples,
    ...(started !== null ? { started_at_ms: started } : {}),
    ...(ended !== null ? { ended_at_ms: ended } : {}),
    ...(duration !== null ? { duration_ms: duration } : {}),
  };
}

export function failureSampleIndex(samples: ReplaySample[]): number {
  return samples.length === 0 ? -1 : samples.length - 1;
}
