/** Observation/action contract checks. Assumption: invalid actions must not move Rapier. */

import { JOINT_KEYS, type ActionMessage, type JointKey } from "@/lib/harness/protocol";

export interface ActionContractOk {
  ok: true;
  action: ActionMessage["action"];
}

export interface ActionContractBad {
  ok: false;
  reason: string;
}

const MAX_JOINT = Math.PI * 2;
const MAX_EE_M = 0.25;

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validate an on-wire action before it touches physics.
 */
export function parseActionContract(action: unknown): ActionContractOk | ActionContractBad {
  if (!action || typeof action !== "object") {
    return { ok: false, reason: "action object required" };
  }
  const raw = action as ActionMessage["action"];
  if (raw.gripper_state !== "open" && raw.gripper_state !== "closed") {
    return { ok: false, reason: "gripper_state must be open|closed" };
  }

  let hasJoints = false;
  if (raw.joint_targets !== undefined) {
    if (!raw.joint_targets || typeof raw.joint_targets !== "object") {
      return { ok: false, reason: "joint_targets must be an object" };
    }
    for (const key of Object.keys(raw.joint_targets) as JointKey[]) {
      if (!JOINT_KEYS.includes(key)) {
        return { ok: false, reason: `unknown joint ${key}` };
      }
      const value = raw.joint_targets[key];
      if (!finiteNumber(value) || Math.abs(value) > MAX_JOINT) {
        return { ok: false, reason: `joint ${key} out of range` };
      }
      hasJoints = true;
    }
  }

  if (raw.ee_delta !== undefined) {
    if (!raw.ee_delta || typeof raw.ee_delta !== "object") {
      return { ok: false, reason: "ee_delta must be an object" };
    }
    const { dx, dy, dz } = raw.ee_delta;
    if (!finiteNumber(dx) || !finiteNumber(dy) || !finiteNumber(dz)) {
      return { ok: false, reason: "ee_delta dx/dy/dz must be finite metres" };
    }
    if (Math.abs(dx) > MAX_EE_M || Math.abs(dy) > MAX_EE_M || Math.abs(dz) > MAX_EE_M) {
      return { ok: false, reason: "ee_delta exceeds 0.25 m per tick" };
    }
  }

  const hasDelta = raw.ee_delta !== undefined;
  if (!hasJoints && !hasDelta) {
    return { ok: false, reason: "joint_targets or ee_delta required" };
  }

  return { ok: true, action: raw };
}

/** Negative-control fixtures that must be rejected. */
export const NEGATIVE_ACTION_FIXTURES: Array<{ name: string; action: unknown }> = [
  { name: "missing gripper", action: { joint_targets: { joint_1: 0 } } },
  { name: "nan joint", action: { gripper_state: "open", joint_targets: { joint_1: Number.NaN } } },
  { name: "unknown joint", action: { gripper_state: "open", joint_targets: { joint_9: 0 } } },
  { name: "huge ee_delta", action: { gripper_state: "open", ee_delta: { dx: 9, dy: 0, dz: 0 } } },
  { name: "empty motion", action: { gripper_state: "open" } },
  { name: "empty joint_targets", action: { gripper_state: "open", joint_targets: {} } },
  { name: "not an object", action: null },
];
