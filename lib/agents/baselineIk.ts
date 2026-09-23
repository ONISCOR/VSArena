import { inverseKinematics } from "@/simulation/inverseKinematics";
import { CUBE_SIZE, STACK_TOLERANCE } from "@/simulation/constants";
import type { Agent, ActionMessage, SceneBlock, StateMessage } from "@/lib/harness/protocol";

type Phase = "hover" | "down" | "pinch" | "lift" | "carry" | "drop" | "open" | "retreat" | "done";

const HOVER = 0.14;
const LIFT = 0.22;
const PINCH_TICKS = 48;
const OPEN_TICKS = 28;
const STUCK = 90;

function blockInTarget(pose: number[], target: number[]): boolean {
  return Math.hypot(pose[0] - target[0], pose[1] - target[1], pose[2] - target[2]) <= STACK_TOLERANCE;
}

function isTopCube(id: string): boolean {
  return id === "block_magenta";
}

/**
 * Magenta sits on the live orange cube (not the empty ghost slot) so a small base offset still stacks.
 */
function stackPlace(block: SceneBlock, blocks: SceneBlock[]): [number, number, number] {
  const target: [number, number, number] = [block.target_pose[0], block.target_pose[1], block.target_pose[2]];
  if (!isTopCube(block.id)) return target;
  const below = blocks.find((b) => b.id === "block_orange");
  if (!below) return target;
  return [below.pose[0], below.pose[1] + CUBE_SIZE, below.pose[2]];
}

/**
 * Scripted IK pick-and-place. Always finishes the cube currently in the gripper
 * before starting another pick (no cyan-held / magenta-pinch deadlock).
 */
export class BaselineIK implements Agent {
  private phase: Phase = "hover";
  private hold = 0;
  private targetId: string | null = null;
  private pick: [number, number, number] = [0, 0, 0];
  lastPlan = "Baseline-IK idle";

  reset(): void {
    this.phase = "hover";
    this.hold = 0;
    this.targetId = null;
    this.lastPlan = "Baseline-IK reset";
  }

  act(state: StateMessage): ActionMessage["action"] {
    const grasped = state.scene.grasped_block_id;
    const pending = state.scene.blocks.filter((b) => !blockInTarget(b.pose, b.target_pose));

    if (grasped) {
      this.targetId = grasped;
      if (this.phase === "hover" || this.phase === "down" || this.phase === "pinch") {
        this.phase = "lift";
        this.hold = 0;
      }
    }

    if (!grasped && pending.length === 0) {
      this.phase = "done";
      this.lastPlan = "All blocks stacked";
      return this.holdPose(state, "open");
    }

    if (!grasped && (!this.targetId || !pending.some((b) => b.id === this.targetId))) {
      const block = pending[0];
      this.targetId = block.id;
      this.pick = [block.pose[0], block.pose[1], block.pose[2]];
      this.phase = "hover";
      this.hold = 0;
    }

    const block =
      state.scene.blocks.find((b) => b.id === this.targetId) ?? pending[0] ?? state.scene.blocks[0];
    if (!block) {
      return this.holdPose(state, "open");
    }

    const place = stackPlace(block, state.scene.blocks);
    const tcp: [number, number, number] = [
      state.scene.gripper_pose[0],
      state.scene.gripper_pose[1],
      state.scene.gripper_pose[2],
    ];
    const hover: [number, number, number] = [this.pick[0], this.pick[1] + HOVER, this.pick[2]];
    const down: [number, number, number] = [this.pick[0], this.pick[1], this.pick[2]];
    const top = isTopCube(block.id);
    const carryLift = top ? 0.1 : LIFT;
    const dropClearance = top ? 0.016 : 0.01;

    switch (this.phase) {
      case "hover": {
        this.lastPlan = `Hover ${block.id}`;
        this.hold += 1;
        if (this.reached(tcp, hover, 0.04) || this.hold > STUCK) {
          this.phase = "down";
          this.hold = 0;
        }
        return this.goto(hover, "open");
      }
      case "down": {
        this.lastPlan = `Descend ${block.id}`;
        this.hold += 1;
        if (this.reached(tcp, down, 0.02) || this.hold > STUCK) {
          this.phase = "pinch";
          this.hold = 0;
        }
        return this.goto(down, "open");
      }
      case "pinch": {
        this.lastPlan = `Pinch ${block.id}`;
        this.hold += 1;
        if (grasped === block.id && this.hold > 8) {
          this.phase = "lift";
          this.hold = 0;
        } else if (this.hold > PINCH_TICKS) {
          this.lastPlan = `Retry ${block.id}`;
          this.pick = [block.pose[0], block.pose[1], block.pose[2]];
          this.phase = "hover";
          this.hold = 0;
        }
        return this.goto(down, "closed");
      }
      case "lift": {
        this.lastPlan = `Lift ${block.id}`;
        const goal: [number, number, number] = [this.pick[0], this.pick[1] + LIFT, this.pick[2]];
        this.hold += 1;
        if (grasped !== block.id) {
          this.phase = "hover";
          this.hold = 0;
          return this.goto(hover, "open");
        }
        if (this.reached(tcp, goal, 0.05) || this.hold > STUCK) {
          this.phase = "carry";
          this.hold = 0;
        }
        return this.goto(goal, "closed");
      }
      case "carry": {
        this.lastPlan = `Carry ${block.id}`;
        const goal: [number, number, number] = [place[0], place[1] + carryLift, place[2]];
        this.hold += 1;
        if (this.reached(tcp, goal, 0.05) || this.hold > STUCK) {
          this.phase = "drop";
          this.hold = 0;
        }
        return this.goto(goal, "closed");
      }
      case "drop": {
        this.lastPlan = `Place ${block.id}`;
        const goal: [number, number, number] = [place[0], place[1] + dropClearance, place[2]];
        this.hold += 1;
        const near = this.reached(tcp, goal, top ? 0.018 : 0.03);
        const dwell = top ? 22 : 0;
        if ((near && this.hold > dwell) || this.hold > (top ? 130 : STUCK)) {
          this.phase = "open";
          this.hold = 0;
        }
        return this.goto(goal, "closed");
      }
      case "open": {
        this.lastPlan = `Release ${block.id}`;
        const goal: [number, number, number] = [place[0], place[1] + dropClearance, place[2]];
        this.hold += 1;
        const released = grasped !== block.id;
        const settled = !top || this.hold > 16;
        if ((released && settled) || this.hold > (top ? 48 : OPEN_TICKS)) {
          this.phase = "retreat";
          this.hold = 0;
        }
        return this.goto(goal, "open");
      }
      case "retreat": {
        this.lastPlan = `Retreat ${block.id}`;
        const up = top ? HOVER + 0.06 : HOVER;
        const goal: [number, number, number] = [place[0], place[1] + up, place[2]];
        this.hold += 1;
        if (this.reached(tcp, goal, 0.07) || this.hold > 45) {
          this.targetId = null;
          this.phase = "hover";
          this.hold = 0;
        }
        return this.goto(goal, "open");
      }
      default:
        return this.holdPose(state, "open");
    }
  }

  private reached(tcp: [number, number, number], goal: [number, number, number], tol: number): boolean {
    return Math.hypot(tcp[0] - goal[0], tcp[1] - goal[1], tcp[2] - goal[2]) < tol;
  }

  private goto(goal: [number, number, number], gripper: "open" | "closed") {
    const ik = inverseKinematics(goal, gripper === "closed" ? 1 : 0);
    return {
      joint_targets: {
        joint_1: ik.baseYaw,
        joint_2: ik.shoulderPitch,
        joint_3: ik.elbowPitch,
        joint_4: ik.wristPitch,
      },
      gripper_state: gripper,
    };
  }

  private holdPose(state: StateMessage, gripper: "open" | "closed") {
    return {
      joint_targets: { ...state.scene.joint_states },
      gripper_state: gripper,
    };
  }
}
