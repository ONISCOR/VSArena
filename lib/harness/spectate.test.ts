import { describe, expect, it } from "vitest";
import {
  isSpectatePath,
  shouldBroadcastSpectate,
  spectateKindForArm,
  snapshotToSpectateFrame,
} from "@/lib/harness/spectate";
import type { SimulationSnapshot } from "@/simulation/types";

function emptySnap(tick: number): SimulationSnapshot {
  const pose = {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0, 1] as [number, number, number, number],
  };
  return {
    tick,
    joints: {
      baseYaw: 0.1,
      shoulderPitch: 0.2,
      elbowPitch: -0.3,
      wristPitch: 0.4,
      gripper: 0.5,
    },
    arm: {
      pedestal: pose,
      shoulder: pose,
      upperArm: pose,
      elbow: pose,
      forearm: pose,
      wrist: pose,
      palm: pose,
      jawLeft: pose,
      jawRight: pose,
      tcp: pose,
    },
    blocks: [
      {
        id: "block_orange",
        position: [0.1, 0.2, 0.3],
        rotation: [0, 0, 0, 1],
        color: "#F7941E",
      },
      {
        id: "block_cyan",
        position: [0, 0.1, 0],
        rotation: [0, 0, 0, 1],
        color: "#00AEEF",
      },
      {
        id: "block_magenta",
        position: [-0.1, 0.1, 0],
        rotation: [0, 0, 0, 1],
        color: "#E11D8F",
      },
    ],
    graspedBlockId: null,
    debugBoxes: [],
  };
}

describe("spectate", () => {
  it("routes /spectate", () => {
    expect(isSpectatePath("/spectate")).toBe(true);
    expect(isSpectatePath("/spectate/")).toBe(true);
    expect(isSpectatePath("/")).toBe(false);
  });

  it("does not stream the current held-out scored layout", () => {
    expect(shouldBroadcastSpectate("control", "held_out")).toBe(true);
    expect(shouldBroadcastSpectate("scored", "public")).toBe(true);
    expect(shouldBroadcastSpectate("scored", "held_out")).toBe(false);
  });

  it("labels scored public streams distinctly from control", () => {
    expect(spectateKindForArm("control")).toBe("control");
    expect(spectateKindForArm("scored")).toBe("scored");
  });

  it("orders blocks cyan → orange → magenta", () => {
    const frame = snapshotToSpectateFrame(emptySnap(7), "mid", "ColorSeek", "vla");
    expect(frame.type).toBe("spectate_frame");
    expect(frame.blocks.map((b) => b.id)).toEqual([
      "block_cyan",
      "block_orange",
      "block_magenta",
    ]);
    expect(frame.tick).toBe(7);
    expect(frame.agent).toBe("ColorSeek");
    expect(frame.joints.baseYaw).toBe(0.1);
  });
});
