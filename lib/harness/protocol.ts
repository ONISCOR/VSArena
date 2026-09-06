import type { ControlArm } from "@/lib/eval/control";

/** WebSocket / local-loop contract. Assumption: joint_1..4 map to yaw, shoulder, elbow, wrist. */

export const JOINT_KEYS = ["joint_1", "joint_2", "joint_3", "joint_4"] as const;
export type JointKey = (typeof JOINT_KEYS)[number];

export type GripperState = "open" | "closed";

/** `state` = privileged poses (IK/debug). `vla` = RGB + instruction, no cube poses. */
export type ObservationMode = "state" | "vla";

export interface SceneBlock {
  id: string;
  pose: [number, number, number, number, number, number, number];
  target_pose: [number, number, number, number, number, number, number];
}

export interface VlaImage {
  mime: "image/rgb8";
  width: number;
  height: number;
  /** Standard base64 of packed RGB bytes (row-major). */
  b64: string;
}

export interface StateMessage {
  type: "state";
  match_id: string;
  tick: number;
  timestamp_ms: number;
  observation_mode: ObservationMode;
  /** Natural-language goal. Always set; VLA policies must use this instead of target_pose. */
  instruction: string;
  scene: {
    gripper_pose: [number, number, number, number, number, number, number];
    blocks: SceneBlock[];
    joint_states: Record<JointKey, number>;
    grasped_block_id: string | null;
  };
  images?: {
    scene: VlaImage;
  };
}

export interface ActionMessage {
  type: "action";
  match_id: string;
  tick: number;
  action: {
    joint_targets?: Partial<Record<JointKey, number>>;
    /** Metres from current TCP. If set, IK overrides joint_targets. */
    ee_delta?: { dx: number; dy: number; dz: number };
    gripper_state: GripperState;
  };
}

export interface ResultMessage {
  type: "result";
  match_id: string;
  status: "completed" | "failed";
  scores: {
    spatial_accuracy: number;
    task_completion_score: number;
    joint_torque_telemetry: { peak: number; avg: number; eval?: unknown };
  };
  elo_delta: number;
  /** Published taxonomy — policy vs protocol vs harness. */
  failure?: {
    code: string;
    domain: string;
    message: string;
    recoverable: boolean;
  };
  provenance?: object;
  replay?: object;
  /** Benign control arm (public canonical) next to the scored condition. */
  control?: ControlArm;
  /** HMAC-SHA256 hex over the run manifest. */
  signature?: string;
}

export interface HelloMessage {
  type: "hello";
  api_key: string;
  task?: string;
  mode?: ObservationMode;
  /** Display name on the leaderboard (must be an agent you own, or any string in memory-dev). */
  agent?: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
  recoverable: boolean;
  /** Dotted taxonomy code, e.g. harness.busy */
  code?: string;
  domain?: string;
}

export type HarnessMessage = StateMessage | ActionMessage | ResultMessage | HelloMessage | ErrorMessage;

export interface Agent {
  /** @example new BaselineIK().act(state) */
  act(state: StateMessage): ActionMessage["action"];
}
