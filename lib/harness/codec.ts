import { BLOCK_TARGETS } from "@/simulation/constants";
import { inverseKinematics } from "@/simulation/inverseKinematics";
import type { JointState, SimulationSnapshot } from "@/simulation/types";
import type { ActionMessage, HelloMessage, JointKey, ObservationMode, StateMessage } from "@/lib/harness/protocol";
import { encodeRgb8, rasterScene, STACK_INSTRUCTION, VLA_IMAGE_SIZE } from "@/lib/vision/raster";

const NAMED: Array<{ key: JointKey; joint: keyof Omit<JointState, "gripper"> }> = [
  { key: "joint_1", joint: "baseYaw" },
  { key: "joint_2", joint: "shoulderPitch" },
  { key: "joint_3", joint: "elbowPitch" },
  { key: "joint_4", joint: "wristPitch" },
];

function pose7(
  position: [number, number, number],
  rotation: [number, number, number, number],
): [number, number, number, number, number, number, number] {
  return [position[0], position[1], position[2], rotation[0], rotation[1], rotation[2], rotation[3]];
}

export interface SnapshotToStateOptions {
  mode?: ObservationMode;
  instruction?: string;
}

/**
 * Snapshot → on-wire state. VLA mode hides cube poses and attaches an RGB work-cell image.
 */
export function snapshotToState(
  snapshot: SimulationSnapshot,
  matchId: string,
  tick: number,
  options: SnapshotToStateOptions = {},
): StateMessage {
  const mode: ObservationMode = options.mode === "vla" ? "vla" : "state";
  const joint_states = {
    joint_1: snapshot.joints.baseYaw,
    joint_2: snapshot.joints.shoulderPitch,
    joint_3: snapshot.joints.elbowPitch,
    joint_4: snapshot.joints.wristPitch,
  };
  const privilegedBlocks = snapshot.blocks.map((block) => {
    const target = BLOCK_TARGETS[block.id] ?? block.position;
    return {
      id: block.id,
      pose: pose7(block.position, block.rotation),
      target_pose: pose7(target, [0, 0, 0, 1]),
    };
  });
  const message: StateMessage = {
    type: "state",
    match_id: matchId,
    tick,
    timestamp_ms: Date.now(),
    observation_mode: mode,
    instruction: options.instruction ?? STACK_INSTRUCTION,
    scene: {
      gripper_pose: pose7(snapshot.arm.tcp.position, snapshot.arm.tcp.rotation),
      blocks: mode === "vla" ? [] : privilegedBlocks,
      joint_states,
      grasped_block_id: mode === "vla" ? null : snapshot.graspedBlockId,
    },
  };
  if (mode === "vla") {
    const rgb = rasterScene(snapshot, VLA_IMAGE_SIZE);
    message.images = {
      scene: {
        mime: "image/rgb8",
        width: VLA_IMAGE_SIZE,
        height: VLA_IMAGE_SIZE,
        b64: encodeRgb8(rgb),
      },
    };
  }
  return message;
}

/**
 * Decode joint_targets into our JointState fields (missing keys stay as current).
 */
export function mergeJointTargets(
  current: JointState,
  targets: ActionMessage["action"]["joint_targets"] | undefined,
): JointState {
  const next = { ...current };
  if (!targets) return next;
  for (const { key, joint } of NAMED) {
    const value = targets[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      next[joint] = value;
    }
  }
  return next;
}

/**
 * Map an on-wire action onto joint servos. `ee_delta` (metres from current TCP) wins over joint_targets.
 */
export function applyAgentAction(snapshot: SimulationSnapshot, action: ActionMessage["action"]): JointState {
  const gripper = action.gripper_state === "closed" ? 1 : 0;
  const delta = action.ee_delta;
  if (
    delta &&
    Number.isFinite(delta.dx) &&
    Number.isFinite(delta.dy) &&
    Number.isFinite(delta.dz)
  ) {
    const tcp = snapshot.arm.tcp.position;
    const target: [number, number, number] = [tcp[0] + delta.dx, tcp[1] + delta.dy, tcp[2] + delta.dz];
    const ik = inverseKinematics(target, gripper);
    return { ...ik, gripper };
  }
  return { ...mergeJointTargets(snapshot.joints, action.joint_targets), gripper };
}

export function parseHarnessMessage(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function isActionMessage(value: unknown): value is ActionMessage {
  if (!value || typeof value !== "object") return false;
  const msg = value as ActionMessage;
  return msg.type === "action" && typeof msg.match_id === "string" && !!msg.action;
}

export function isHelloMessage(value: unknown): value is HelloMessage {
  if (!value || typeof value !== "object") return false;
  const msg = value as { type?: string; api_key?: string };
  return msg.type === "hello" && typeof msg.api_key === "string";
}
