/** Vision pick-and-place: cube colors from RGB. Place uses the known pad (STACK_ORIGIN), not the pad blob. */

import type { Agent, ActionMessage, StateMessage } from "@/lib/harness/protocol";
import { findBlobs, pixelToEeDelta, type BlobCentroid } from "@/lib/vision/blobs";
import { CUBE_HALF, STACK_ORIGIN, TABLE_TOP_Y, stackSlotY } from "@/simulation/constants";

type Hue = "cyan" | "orange" | "magenta";
type Phase = "hover" | "down" | "pinch" | "lift" | "carry" | "drop" | "open" | "done";

const ORDER: Hue[] = ["cyan", "orange", "magenta"];
const STEP = 0.03;
const XY_CLOSE = 6;
const XY_NEAR = 14;
const HELD_PX = 10;
const STACKED_PAD = 8;
const HOVER_Y = TABLE_TOP_Y + CUBE_HALF + 0.12;
const PICK_Y = TABLE_TOP_Y + CUBE_HALF + 0.012;
const DOWN_TICKS = 24;
const PINCH_TICKS = 16;
const LIFT_TICKS = 12;
const CARRY_MAX = 80;
const DROP_TICKS = 18;
const OPEN_TICKS = 12;
const PLACE_XY = 0.03;
const CARRY_CLEAR = 0.11;

function rgbOf(state: StateMessage): { rgb: Uint8Array; size: number } | null {
  const img = state.images?.scene;
  if (!img || img.mime !== "image/rgb8" || !img.b64) return null;
  try {
    const binary = globalThis.atob(img.b64);
    const rgb = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) rgb[i] = binary.charCodeAt(i);
    return { rgb, size: img.width };
  } catch {
    return null;
  }
}

function clampStep(dx: number, dy: number, dz: number): { dx: number; dy: number; dz: number } {
  const m = Math.hypot(dx, dy, dz);
  if (m <= STEP || m < 1e-9) return { dx, dy, dz };
  const s = STEP / m;
  return { dx: dx * s, dy: dy * s, dz: dz * s };
}

function near(a: BlobCentroid, b: BlobCentroid, px: number): boolean {
  return Math.hypot(a.u - b.u, a.v - b.v) <= px;
}

function tcpY(state: StateMessage): number {
  const y = state.scene.gripper_pose[1];
  return Number.isFinite(y) ? y : HOVER_Y;
}

function tcpWorld(state: StateMessage): [number, number, number] {
  const p = state.scene.gripper_pose;
  return [
    Number.isFinite(p[0]) ? p[0] : 0,
    Number.isFinite(p[1]) ? p[1] : HOVER_Y,
    Number.isFinite(p[2]) ? p[2] : 0,
  ];
}

/**
 * Stack slot for this cube (yellow pad + layer). Task geometry, not cube GPS.
 */
function slotPose(hue: Hue): [number, number, number] {
  return [STACK_ORIGIN[0], stackSlotY(ORDER.indexOf(hue)), STACK_ORIGIN[2]];
}

function xyOnPad(tcp: [number, number, number], tol = PLACE_XY): boolean {
  return Math.hypot(tcp[0] - STACK_ORIGIN[0], tcp[2] - STACK_ORIGIN[2]) <= tol;
}

/**
 * Scripted VLA-track policy: chase color blobs to pick, then carry to STACK_ORIGIN.
 */
export class ColorSeek implements Agent {
  private phase: Phase = "hover";
  private hold = 0;
  private target: Hue = "cyan";
  private lastGoal: BlobCentroid | null = null;
  lastPlan = "ColorSeek idle";

  reset(): void {
    this.phase = "hover";
    this.hold = 0;
    this.target = "cyan";
    this.lastGoal = null;
    this.lastPlan = "ColorSeek reset";
  }

  act(state: StateMessage): ActionMessage["action"] {
    const frame = rgbOf(state);
    if (!frame) {
      this.lastPlan = "ColorSeek no image";
      return this.holdPose(state, "open");
    }
    const blobs = findBlobs(frame.rgb, frame.size);
    const tcp = blobs.tcp;
    const pad = blobs.pad;
    if (!tcp) {
      this.lastPlan = "ColorSeek lost TCP";
      return this.holdPose(state, "open");
    }

    while (true) {
      const blob = blobs[this.target];
      const stacked = blob && pad ? near(blob, pad, STACKED_PAD) : false;
      if (stacked && this.phase === "hover") {
        const next = ORDER[ORDER.indexOf(this.target) + 1] as Hue | undefined;
        if (!next) {
          this.phase = "done";
          this.lastPlan = "ColorSeek stacked";
          return this.holdPose(state, "open");
        }
        this.target = next;
        this.hold = 0;
        this.lastGoal = null;
        continue;
      }
      break;
    }

    const cube = blobs[this.target];
    if (cube) this.lastGoal = cube;
    const occluded = !cube && this.lastGoal !== null && near(tcp, this.lastGoal, XY_NEAR);
    const goalBlob = cube ?? this.lastGoal;

    if (this.phase === "done") {
      this.lastPlan = "ColorSeek stacked";
      return this.holdPose(state, "open");
    }

    if (!goalBlob && this.phase === "hover") {
      this.lastPlan = `ColorSeek wait ${this.target}`;
      return this.holdPose(state, "open");
    }

    const aim = goalBlob ?? tcp;
    const delta = pixelToEeDelta(aim.u - tcp.u, aim.v - tcp.v, frame.size);
    const xyDist = Math.hypot(aim.u - tcp.u, aim.v - tcp.v);
    const xyClose = xyDist <= XY_CLOSE || occluded;
    const y = tcpY(state);
    const world = tcpWorld(state);
    const slot = slotPose(this.target);

    switch (this.phase) {
      case "hover": {
        this.lastPlan = `Seek ${this.target}`;
        this.hold += 1;
        if ((xyClose && this.hold > 3) || (xyDist <= XY_NEAR && this.hold > 40)) {
          this.phase = "down";
          this.hold = 0;
        }
        return this.move(delta.dx, HOVER_Y - y, delta.dz, "open");
      }
      case "down": {
        this.lastPlan = `Down ${this.target}`;
        this.hold += 1;
        if (y <= PICK_Y + 0.02 || this.hold > DOWN_TICKS) {
          this.phase = "pinch";
          this.hold = 0;
        }
        return this.move(delta.dx * 0.35, PICK_Y - y, delta.dz * 0.35, "open");
      }
      case "pinch": {
        this.lastPlan = `Pinch ${this.target}`;
        this.hold += 1;
        if (this.hold > PINCH_TICKS) {
          this.phase = "lift";
          this.hold = 0;
        }
        return this.move(delta.dx * 0.15, PICK_Y - y, delta.dz * 0.15, "closed");
      }
      case "lift": {
        this.lastPlan = `Lift ${this.target}`;
        this.hold += 1;
        if (this.hold > LIFT_TICKS) {
          this.phase = "carry";
          this.hold = 0;
        }
        return this.move(0, 0.024, 0, "closed");
      }
      case "carry": {
        if (cube && !near(cube, tcp, HELD_PX) && !(pad && near(cube, pad, STACKED_PAD))) {
          this.lastPlan = `Retry ${this.target}`;
          this.phase = "hover";
          this.hold = 0;
          return this.move(0, 0.01, 0, "open");
        }
        this.lastPlan = `Carry ${this.target}`;
        this.hold += 1;
        const hoverSlotY = slot[1] + CARRY_CLEAR;
        const atPad = xyOnPad(world);
        if ((atPad && Math.abs(world[1] - hoverSlotY) < 0.05) || this.hold > CARRY_MAX) {
          this.phase = "drop";
          this.hold = 0;
        }
        return this.move(slot[0] - world[0], hoverSlotY - world[1], slot[2] - world[2], "closed");
      }
      case "drop": {
        this.lastPlan = `Place ${this.target}`;
        this.hold += 1;
        const placeY = slot[1] + 0.012;
        const settled = xyOnPad(world, PLACE_XY + 0.01) && world[1] <= placeY + 0.03;
        if ((settled && this.hold > 4) || this.hold > DROP_TICKS) {
          this.phase = "open";
          this.hold = 0;
        }
        return this.move(slot[0] - world[0], placeY - world[1], slot[2] - world[2], "closed");
      }
      case "open": {
        this.lastPlan = `Release ${this.target}`;
        this.hold += 1;
        if (this.hold > OPEN_TICKS) {
          if (xyOnPad(world, 0.055)) {
            const next = ORDER[ORDER.indexOf(this.target) + 1];
            if (!next) {
              this.phase = "done";
            } else {
              this.target = next;
              this.phase = "hover";
              this.lastGoal = null;
            }
          } else {
            this.lastPlan = `Retry ${this.target}`;
            this.phase = "hover";
            this.lastGoal = null;
          }
          this.hold = 0;
        }
        return this.move(0, 0.014, 0, "open");
      }
      default:
        return this.holdPose(state, "open");
    }
  }

  private move(dx: number, dy: number, dz: number, gripper: "open" | "closed"): ActionMessage["action"] {
    return { ee_delta: clampStep(dx, dy, dz), gripper_state: gripper };
  }

  private holdPose(state: StateMessage, gripper: "open" | "closed"): ActionMessage["action"] {
    return { joint_targets: { ...state.scene.joint_states }, gripper_state: gripper };
  }
}
