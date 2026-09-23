import { BLOCK_TARGETS, STACK_TOLERANCE, TARGET_ZONE } from "@/simulation/constants";
import { clamp, quatRotateVec, vecDist } from "@/simulation/math";
import type { BlockState, Quat, Vec3 } from "@/simulation/types";

export interface TorqueSample {
  peak: number;
  avg: number;
}

export interface MatchScores {
  spatial_accuracy: number;
  task_completion_score: number;
  joint_torque_telemetry: TorqueSample;
}

const POS_SCALE_M = 0.35;
const TORQUE_GAIN = 4.2;

/**
 * Position score in [0, 1]: 1 at the target, 0 beyond POS_SCALE_M.
 */
export function positionScore(actual: Vec3, target: Vec3): number {
  const dist = vecDist(actual, target);
  return clamp(1 - dist / POS_SCALE_M, 0, 1);
}

/**
 * Upright cube score: 1 when local +Y aligns with world up.
 */
export function orientationScore(rotation: Quat): number {
  const up = quatRotateVec(rotation, [0, 1, 0]);
  return clamp(Math.abs(up[1]), 0, 1);
}

/**
 * Mean spatial accuracy across blocks (70% position, 30% upright orientation).
 */
export function spatialAccuracy(blocks: BlockState[]): number {
  if (blocks.length === 0) return 0;
  let sum = 0;
  for (const block of blocks) {
    const target = BLOCK_TARGETS[block.id] ?? TARGET_ZONE.position;
    const pos = positionScore(block.position, target);
    const ori = orientationScore(block.rotation);
    sum += 0.7 * pos + 0.3 * ori;
  }
  return sum / blocks.length;
}

function blockCompletion(block: BlockState): number {
  const target = BLOCK_TARGETS[block.id] ?? TARGET_ZONE.position;
  const dist = vecDist(block.position, target);
  if (dist <= STACK_TOLERANCE) return 1;
  return 0.5 * clamp(1 - dist / 0.55, 0, 1);
}

/**
 * 1.0 if every cube is in its 3D stack slot; a cube still in the gripper does not count.
 */
export function taskCompletion(blocks: BlockState[], graspedBlockId: string | null = null): number {
  if (blocks.length === 0) return 0;
  const parts = blocks.map((block) => (block.id === graspedBlockId ? 0 : blockCompletion(block)));
  if (parts.every((p) => p >= 1)) return 1;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

export interface TorqueTracker {
  samples: number[];
}

export function createTorqueTracker(): TorqueTracker {
  return { samples: [] };
}

/**
 * Kinematic effort proxy (no real motors). Records Σ|Δq| * gain for this step.
 */
export function sampleTorque(
  tracker: TorqueTracker,
  prev: { baseYaw: number; shoulderPitch: number; elbowPitch: number; wristPitch: number; gripper: number },
  next: { baseYaw: number; shoulderPitch: number; elbowPitch: number; wristPitch: number; gripper: number },
): number {
  const effort =
    (Math.abs(next.baseYaw - prev.baseYaw) +
      Math.abs(next.shoulderPitch - prev.shoulderPitch) +
      Math.abs(next.elbowPitch - prev.elbowPitch) +
      Math.abs(next.wristPitch - prev.wristPitch) +
      Math.abs(next.gripper - prev.gripper)) *
    TORQUE_GAIN;
  tracker.samples.push(effort);
  return effort;
}

export function summarizeTorque(tracker: TorqueTracker): TorqueSample {
  if (tracker.samples.length === 0) return { peak: 0, avg: 0 };
  const peak = tracker.samples.reduce((m, v) => Math.max(m, v), 0);
  const avg = tracker.samples.reduce((a, b) => a + b, 0) / tracker.samples.length;
  return { peak, avg };
}

/**
 * Final match scores from block poses + torque tracker.
 */
export function scoreMatch(
  blocks: BlockState[],
  tracker: TorqueTracker,
  graspedBlockId: string | null = null,
): MatchScores {
  return {
    spatial_accuracy: spatialAccuracy(blocks),
    task_completion_score: taskCompletion(blocks, graspedBlockId),
    joint_torque_telemetry: summarizeTorque(tracker),
  };
}

export { eloDelta, eloOutcome, expectedScore, kFactor, TASK_RATING } from "./elo";
