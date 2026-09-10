/** Weekly highlight reel. Assumption: only retired eval windows may be streamed. */

import { isRetiredEvalWindow, previousEvalWindowId } from "@/lib/eval/sampler";
import type { ObservationMode } from "@/lib/harness/protocol";
import type { SpectateFrameMessage, SpectateResultMessage } from "@/lib/harness/spectate";
import { snapshotToReplaySample, type ReplaySample } from "@/lib/eval/replay";
import type { SimulationSnapshot } from "@/simulation/types";

export const HIGHLIGHT_MAX_PER_WINDOW = 8;
export const HIGHLIGHT_PUBLIC_TOP = 5;
const HIGHLIGHT_MAX_SAMPLES = 240;
const HIGHLIGHT_STRIDE_VLA = 15;
const HIGHLIGHT_STRIDE_STATE = 60;

const BLOCK_COLOR: Record<string, string> = {
  block_cyan: "#00AEEF",
  block_orange: "#F7941E",
  block_magenta: "#E11D8F",
};

export interface HighlightRun {
  match_id: string;
  agent: string;
  eval_window: string;
  sampler_seed: number;
  mode: ObservationMode;
  scores: {
    spatial_accuracy: number;
    task_completion_score: number;
  };
  samples: ReplaySample[];
}

export interface HighlightFeed {
  window: string;
  runs: HighlightRun[];
}

/**
 * Keep a denser privileged trail so a retired match can be played back in full.
 *
 * @example maybeRecordHighlightSample(samples, snap, "vla")
 */
export function maybeRecordHighlightSample(
  samples: ReplaySample[],
  snapshot: SimulationSnapshot,
  mode: ObservationMode,
): void {
  if (samples.length >= HIGHLIGHT_MAX_SAMPLES) return;
  const stride = mode === "vla" ? HIGHLIGHT_STRIDE_VLA : HIGHLIGHT_STRIDE_STATE;
  if (snapshot.tick !== 0 && snapshot.tick % stride !== 0 && samples.length > 0) return;
  samples.push(snapshotToReplaySample(snapshot));
}

/**
 * Rank key: stack first, then spatial accuracy.
 *
 * @example highlightRank(run)
 */
export function highlightRank(run: HighlightRun): number {
  return run.scores.task_completion_score * 1_000 + run.scores.spatial_accuracy;
}

/**
 * Keep the best N runs in a window. Same match_id replaces the previous row.
 *
 * @example rankHighlights(existing, incoming)
 */
export function rankHighlights(existing: HighlightRun[], incoming: HighlightRun): HighlightRun[] {
  const next = existing.filter((run) => run.match_id !== incoming.match_id);
  next.push(incoming);
  next.sort((a, b) => highlightRank(b) - highlightRank(a) || a.match_id.localeCompare(b.match_id));
  return next.slice(0, HIGHLIGHT_MAX_PER_WINDOW);
}

/**
 * Public reel: previous ISO week only, top K, no current-window poses.
 *
 * @example publicHighlightFeed(all, new Date("2026-09-10T12:00:00.000Z"))
 */
export function publicHighlightFeed(runs: HighlightRun[], at: Date = new Date()): HighlightFeed {
  const window = previousEvalWindowId(at);
  const ranked = runs
    .filter((run) => run.eval_window === window && isRetiredEvalWindow(run.eval_window, at))
    .filter((run) => run.samples.length > 0)
    .sort((a, b) => highlightRank(b) - highlightRank(a) || a.match_id.localeCompare(b.match_id))
    .slice(0, HIGHLIGHT_PUBLIC_TOP);
  return { window, runs: ranked };
}

/**
 * Delay between two highlight samples (physics ticks at 60 Hz), clamped for the socket.
 *
 * @example highlightDelayMs(0, 15)
 */
export function highlightDelayMs(fromTick: number, toTick: number): number {
  const dt = ((toTick - fromTick) / 60) * 1000;
  if (!Number.isFinite(dt) || dt <= 0) return 120;
  return Math.min(280, Math.max(40, dt));
}

/**
 * Replay sample → spectator wire frame (retired window only).
 *
 * @example highlightSampleToFrame(run, run.samples[0])
 */
export function highlightSampleToFrame(run: HighlightRun, sample: ReplaySample): SpectateFrameMessage {
  return {
    type: "spectate_frame",
    match_id: run.match_id,
    tick: sample.tick,
    timestamp_ms: Date.now(),
    agent: run.agent,
    mode: run.mode,
    kind: "highlight",
    eval_window: run.eval_window,
    joints: { ...sample.joints },
    blocks: sample.blocks.map((block) => ({
      id: block.id,
      position: block.position,
      rotation: block.rotation,
      color: BLOCK_COLOR[block.id] ?? "#888888",
    })),
    grasped_block_id: sample.grasped_block_id,
    task_completion_score: run.scores.task_completion_score,
  };
}

/**
 * End-of-run HUD for a highlight. elo_delta stays 0 — board writes still go through ingest.
 *
 * @example highlightResultMessage(run)
 */
export function highlightResultMessage(run: HighlightRun): SpectateResultMessage {
  return {
    type: "spectate_result",
    match_id: run.match_id,
    agent: run.agent,
    status: run.scores.task_completion_score >= 1 ? "completed" : "failed",
    kind: "highlight",
    eval_window: run.eval_window,
    scores: {
      spatial_accuracy: run.scores.spatial_accuracy,
      task_completion_score: run.scores.task_completion_score,
      joint_torque_telemetry: { peak: 0, avg: 0 },
    },
    elo_delta: 0,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asFinite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asSample(value: unknown): ReplaySample | null {
  const row = asRecord(value);
  if (!row) return null;
  const tick = asFinite(row.tick);
  const joints = asRecord(row.joints);
  if (tick === null || !joints) return null;
  const keys = ["baseYaw", "shoulderPitch", "elbowPitch", "wristPitch", "gripper"] as const;
  for (const key of keys) {
    if (asFinite(joints[key]) === null) return null;
  }
  if (!Array.isArray(row.blocks)) return null;
  const blocks: ReplaySample["blocks"] = [];
  for (const item of row.blocks) {
    const block = asRecord(item);
    if (!block || typeof block.id !== "string") return null;
    if (!Array.isArray(block.position) || block.position.length !== 3) return null;
    if (!Array.isArray(block.rotation) || block.rotation.length !== 4) return null;
    const position = block.position.map(Number) as [number, number, number];
    const rotation = block.rotation.map(Number) as [number, number, number, number];
    if (position.some((n) => !Number.isFinite(n)) || rotation.some((n) => !Number.isFinite(n))) return null;
    blocks.push({ id: block.id, position, rotation });
  }
  return {
    tick,
    joints: {
      baseYaw: joints.baseYaw as number,
      shoulderPitch: joints.shoulderPitch as number,
      elbowPitch: joints.elbowPitch as number,
      wristPitch: joints.wristPitch as number,
      gripper: joints.gripper as number,
    },
    blocks,
    grasped_block_id: typeof row.grasped_block_id === "string" ? row.grasped_block_id : null,
  };
}

/**
 * Parse a harness POST body. Current-window runs may be stored; GET still filters them out.
 *
 * @example parseHighlightRun(body)
 */
export function parseHighlightRun(body: unknown): HighlightRun | null {
  const row = asRecord(body);
  if (!row) return null;
  if (typeof row.match_id !== "string" || !row.match_id) return null;
  if (typeof row.agent !== "string" || !row.agent.trim()) return null;
  if (typeof row.eval_window !== "string" || !/^20\d{2}-W\d{2}$/.test(row.eval_window)) return null;
  const seed = asFinite(row.sampler_seed);
  if (seed === null) return null;
  if (row.mode !== "vla" && row.mode !== "state") return null;
  const scores = asRecord(row.scores);
  const spatial = asFinite(scores?.spatial_accuracy);
  const task = asFinite(scores?.task_completion_score);
  if (spatial === null || task === null) return null;
  if (!Array.isArray(row.samples) || row.samples.length === 0) return null;
  const samples: ReplaySample[] = [];
  for (const item of row.samples.slice(0, HIGHLIGHT_MAX_SAMPLES)) {
    const sample = asSample(item);
    if (!sample) return null;
    samples.push(sample);
  }
  return {
    match_id: row.match_id,
    agent: row.agent.trim(),
    eval_window: row.eval_window,
    sampler_seed: seed >>> 0,
    mode: row.mode,
    scores: { spatial_accuracy: spatial, task_completion_score: task },
    samples,
  };
}
