import { DEFAULT_JOINTS, JOINT_LIMITS } from "@/simulation/constants";
import { inverseKinematics } from "@/simulation/inverseKinematics";
import { clamp } from "@/simulation/math";
import type { JointState } from "@/simulation/types";
import type { Agent, ActionMessage, StateMessage } from "@/lib/harness/protocol";
import type { PlayTrick } from "@/lib/playground";

type Pose = JointState;

function clampPose(j: Pose): Pose {
  return {
    baseYaw: clamp(j.baseYaw, JOINT_LIMITS.baseYaw.min, JOINT_LIMITS.baseYaw.max),
    shoulderPitch: clamp(j.shoulderPitch, JOINT_LIMITS.shoulderPitch.min, JOINT_LIMITS.shoulderPitch.max),
    elbowPitch: clamp(j.elbowPitch, JOINT_LIMITS.elbowPitch.min, JOINT_LIMITS.elbowPitch.max),
    wristPitch: clamp(j.wristPitch, JOINT_LIMITS.wristPitch.min, JOINT_LIMITS.wristPitch.max),
    gripper: clamp(j.gripper, 0, 1),
  };
}

function mix(a: Pose, b: Pose, u: number): Pose {
  const t = clamp(u, 0, 1);
  return clampPose({
    baseYaw: a.baseYaw + (b.baseYaw - a.baseYaw) * t,
    shoulderPitch: a.shoulderPitch + (b.shoulderPitch - a.shoulderPitch) * t,
    elbowPitch: a.elbowPitch + (b.elbowPitch - a.elbowPitch) * t,
    wristPitch: a.wristPitch + (b.wristPitch - a.wristPitch) * t,
    gripper: a.gripper + (b.gripper - a.gripper) * t,
  });
}

function targets(j: Pose): NonNullable<ActionMessage["action"]["joint_targets"]> {
  return {
    joint_1: j.baseYaw,
    joint_2: j.shoulderPitch,
    joint_3: j.elbowPitch,
    joint_4: j.wristPitch,
  };
}

function along(t: number, keys: Array<{ at: number; pose: Pose }>): Pose {
  if (t <= keys[0].at) return keys[0].pose;
  for (let i = 1; i < keys.length; i += 1) {
    const prev = keys[i - 1];
    const next = keys[i];
    if (t <= next.at) {
      const span = next.at - prev.at || 1;
      return mix(prev.pose, next.pose, (t - prev.at) / span);
    }
  }
  return keys[keys.length - 1].pose;
}

const REST = DEFAULT_JOINTS;
/** Over the table, still in the playground frame. Higher poses clip the canvas. */
const LIFT = inverseKinematics([0.12, 1.14, 0], 0);
const WAVE_L = inverseKinematics([0.16, 1.08, -0.26], 0);
const WAVE_R = inverseKinematics([0.16, 1.08, 0.26], 0);
const NOD_DOWN = inverseKinematics([0.16, 0.96, 0], 0);

/**
 * Canned joint scripts for the public playground. Not a policy. No ELO.
 * Poses must stay above the table: `armClearsTable` otherwise reverts every tick.
 */
export class PlayScript implements Agent {
  finished = false;
  lastPlan: string;
  private tick = 0;

  constructor(private readonly trick: PlayTrick) {
    this.lastPlan = `Play ${trick}`;
  }

  reset(): void {
    this.tick = 0;
    this.finished = false;
    this.lastPlan = `Play ${this.trick}`;
  }

  act(state: StateMessage): ActionMessage["action"] {
    this.tick += 1;
    const t = this.tick;
    if (this.trick === "wave") return this.wave(t);
    if (this.trick === "nod") return this.nod(t);
    if (this.trick === "snap") return this.snap(t);
    return this.point(t, state);
  }

  private wave(t: number): ActionMessage["action"] {
    const keys = [
      { at: 0, pose: REST },
      { at: 22, pose: LIFT },
      { at: 42, pose: WAVE_L },
      { at: 62, pose: WAVE_R },
      { at: 82, pose: WAVE_L },
      { at: 102, pose: WAVE_R },
      { at: 122, pose: LIFT },
      { at: 146, pose: REST },
    ];
    this.lastPlan = "Wave";
    if (t >= 146) this.finished = true;
    return { joint_targets: targets(along(t, keys)), gripper_state: "open" };
  }

  private nod(t: number): ActionMessage["action"] {
    const keys = [
      { at: 0, pose: REST },
      { at: 18, pose: NOD_DOWN },
      { at: 34, pose: REST },
      { at: 50, pose: NOD_DOWN },
      { at: 66, pose: REST },
      { at: 82, pose: NOD_DOWN },
      { at: 108, pose: REST },
    ];
    this.lastPlan = "Nod";
    if (t >= 108) this.finished = true;
    return { joint_targets: targets(along(t, keys)), gripper_state: "open" };
  }

  private snap(t: number): ActionMessage["action"] {
    const keys = [
      { at: 0, pose: REST },
      { at: 20, pose: LIFT },
      { at: 96, pose: LIFT },
      { at: 118, pose: REST },
    ];
    this.lastPlan = "Snap";
    if (t >= 118) this.finished = true;
    const closed = t > 24 && t < 96 && Math.floor((t - 24) / 12) % 2 === 0;
    return { joint_targets: targets(along(t, keys)), gripper_state: closed ? "closed" : "open" };
  }

  private point(t: number, state: StateMessage): ActionMessage["action"] {
    const cyan = state.scene.blocks.find((b) => b.id === "block_cyan");
    const aim: [number, number, number] = cyan
      ? [cyan.pose[0], Math.max(cyan.pose[1] + 0.22, 0.98), cyan.pose[2]]
      : [0.26, 1.0, -0.16];
    const reach = inverseKinematics(aim, 0);
    const keys = [
      { at: 0, pose: REST },
      { at: 20, pose: LIFT },
      { at: 42, pose: reach },
      { at: 88, pose: reach },
      { at: 118, pose: REST },
    ];
    this.lastPlan = "Point cyan";
    if (t >= 118) this.finished = true;
    return { joint_targets: targets(along(t, keys)), gripper_state: "open" };
  }
}
