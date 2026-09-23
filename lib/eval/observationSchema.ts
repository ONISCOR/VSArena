/** Observation-track contract. VLA must not leak cube GPS; state may. */

import { JOINT_KEYS, type ObservationMode } from "@/lib/harness/protocol";

export interface StateContractOk {
  ok: true;
  mode: ObservationMode;
}

export interface StateContractBad {
  ok: false;
  reason: string;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Check a `state` message against the published observation contract.
 */
export function parseStateContract(value: unknown): StateContractOk | StateContractBad {
  if (!value || typeof value !== "object") {
    return { ok: false, reason: "state object required" };
  }
  const msg = value as Record<string, unknown>;
  if (msg.type !== "state") return { ok: false, reason: "type must be state" };
  if (typeof msg.match_id !== "string" || !msg.match_id) {
    return { ok: false, reason: "match_id required" };
  }
  if (!finiteNumber(msg.tick)) return { ok: false, reason: "tick must be finite" };
  if (typeof msg.instruction !== "string" || msg.instruction.length < 8) {
    return { ok: false, reason: "instruction required" };
  }
  const mode = msg.observation_mode;
  if (mode !== "vla" && mode !== "state") {
    return { ok: false, reason: "observation_mode must be vla|state" };
  }
  const scene = msg.scene as Record<string, unknown> | undefined;
  if (!scene || typeof scene !== "object") return { ok: false, reason: "scene required" };
  const joints = scene.joint_states as Record<string, unknown> | undefined;
  if (!joints || typeof joints !== "object") return { ok: false, reason: "joint_states required" };
  for (const key of JOINT_KEYS) {
    if (!finiteNumber(joints[key])) return { ok: false, reason: `joint ${key} missing` };
  }
  if (!Array.isArray(scene.gripper_pose) || scene.gripper_pose.length !== 7) {
    return { ok: false, reason: "gripper_pose must be 7 numbers" };
  }

  const blocks = scene.blocks;
  if (!Array.isArray(blocks)) return { ok: false, reason: "blocks must be an array" };

  if (mode === "vla") {
    if (blocks.length !== 0) return { ok: false, reason: "vla must not leak cube poses" };
    if (scene.grasped_block_id !== null) {
      return { ok: false, reason: "vla grasped_block_id must be null" };
    }
    const images = msg.images as { scene?: { mime?: string; width?: number; height?: number; b64?: string } } | undefined;
    const img = images?.scene;
    if (!img || img.mime !== "image/rgb8" || typeof img.b64 !== "string" || img.b64.length < 4) {
      return { ok: false, reason: "vla images.scene (rgb8) required" };
    }
    if (!finiteNumber(img.width) || !finiteNumber(img.height)) {
      return { ok: false, reason: "vla image size required" };
    }
    return { ok: true, mode };
  }

  if (blocks.length === 0) return { ok: false, reason: "state track must include cube poses" };
  for (const row of blocks) {
    if (!row || typeof row !== "object") return { ok: false, reason: "block object required" };
    const block = row as { id?: string; pose?: unknown; target_pose?: unknown };
    if (typeof block.id !== "string") return { ok: false, reason: "block.id required" };
    if (!Array.isArray(block.pose) || block.pose.length !== 7) {
      return { ok: false, reason: "block.pose must be 7 numbers" };
    }
    if (!Array.isArray(block.target_pose) || block.target_pose.length !== 7) {
      return { ok: false, reason: "block.target_pose must be 7 numbers" };
    }
  }
  return { ok: true, mode };
}
