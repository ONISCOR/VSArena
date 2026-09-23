/** Assumption: sample at VLA_POLICY_HZ; action is the motion since the previous sample. */

import { snapshotToState } from "@/lib/harness/codec";
import { STACK_INSTRUCTION, VLA_POLICY_HZ } from "@/lib/vision/raster";
import type { SimulationSnapshot, Vec3 } from "@/simulation/types";
import {
  DEMO_FORMAT,
  DEMO_HZ,
  DEMO_MAX_FRAMES,
  type DemoEpisode,
  type DemoFrame,
} from "@/lib/dataset/types";

export { DEMO_FORMAT, DEMO_HZ, DEMO_MAX_FRAMES };

/**
 * One VLA training frame: same observation as the harness, plus the teleop/agent motion.
 */
export function captureDemoFrame(
  snapshot: SimulationSnapshot,
  prevTcp: Vec3 | null,
  index: number,
): DemoFrame {
  const state = snapshotToState(snapshot, "demo", snapshot.tick, { mode: "vla" });
  const tcp = snapshot.arm.tcp.position;
  const image = state.images?.scene;
  if (!image) {
    throw new Error("VLA snapshot missing images.scene");
  }
  return {
    t: index,
    tick: snapshot.tick,
    timestamp_ms: state.timestamp_ms,
    images: { scene: image },
    scene: {
      gripper_pose: state.scene.gripper_pose,
      joint_states: state.scene.joint_states,
    },
    action: {
      joint_targets: { ...state.scene.joint_states },
      ee_delta: prevTcp
        ? { dx: tcp[0] - prevTcp[0], dy: tcp[1] - prevTcp[1], dz: tcp[2] - prevTcp[2] }
        : { dx: 0, dy: 0, dz: 0 },
      gripper_state: snapshot.joints.gripper >= 0.5 ? "closed" : "open",
    },
  };
}

/**
 * Fixed-rate VLA demo buffer. Call `tick` from the physics loop; do not drive physics from here.
 */
export class DemoRecorder {
  private frames: DemoFrame[] = [];
  private prevTcp: Vec3 | null = null;
  private acc = 0;
  private active = false;
  private startedAt = "";

  get recording(): boolean {
    return this.active;
  }

  get frameCount(): number {
    return this.frames.length;
  }

  get isFull(): boolean {
    return this.frames.length >= DEMO_MAX_FRAMES;
  }

  start(): void {
    this.frames = [];
    this.prevTcp = null;
    this.acc = 0;
    this.active = true;
    this.startedAt = new Date().toISOString();
  }

  /**
   * Accumulate `dt` seconds and maybe append a frame.
   *
   * @returns true if a frame was written
   */
  tick(dt: number, snapshot: SimulationSnapshot): boolean {
    if (!this.active || this.isFull) return false;
    const period = 1 / VLA_POLICY_HZ;
    this.acc += dt;
    if (this.acc < period) return false;
    this.acc = 0;
    const tcp = snapshot.arm.tcp.position;
    this.frames.push(captureDemoFrame(snapshot, this.prevTcp, this.frames.length));
    this.prevTcp = [tcp[0], tcp[1], tcp[2]];
    return true;
  }

  stop(): DemoEpisode {
    this.active = false;
    return {
      format: DEMO_FORMAT,
      task: "block_stacking",
      observation_mode: "vla",
      instruction: STACK_INSTRUCTION,
      hz: DEMO_HZ,
      created_at: this.startedAt || new Date().toISOString(),
      frames: this.frames,
    };
  }
}

/**
 * JSON payload for download / Python `load_episode`.
 */
export function serializeDemo(episode: DemoEpisode): string {
  return `${JSON.stringify(episode)}\n`;
}
