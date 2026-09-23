import { describe, expect, it } from "vitest";
import { DEFAULT_JOINTS, TABLE_TOP_Y, CUBE_HALF } from "@/simulation/constants";
import { forwardKinematics } from "@/simulation/armKinematics";
import { armClearsTable } from "@/simulation/tableBounds";
import { snapshotToState } from "@/lib/harness/codec";
import { PlayScript } from "@/lib/agents/playScript";
import type { JointState, SimulationSnapshot } from "@/simulation/types";

function restState(): ReturnType<typeof snapshotToState> {
  const snapshot: SimulationSnapshot = {
    joints: DEFAULT_JOINTS,
    arm: forwardKinematics(DEFAULT_JOINTS),
    blocks: [
      {
        id: "block_cyan",
        position: [0.26, TABLE_TOP_Y + CUBE_HALF, -0.16],
        rotation: [0, 0, 0, 1],
        color: "#00AEEF",
      },
    ],
    graspedBlockId: null,
    tick: 1,
    debugBoxes: [],
  };
  return snapshotToState(snapshot, "play-wave", 1, { mode: "state" });
}

function jointsFrom(action: { joint_targets?: Partial<Record<string, number>> }): JointState {
  return {
    baseYaw: action.joint_targets?.joint_1 ?? DEFAULT_JOINTS.baseYaw,
    shoulderPitch: action.joint_targets?.joint_2 ?? DEFAULT_JOINTS.shoulderPitch,
    elbowPitch: action.joint_targets?.joint_3 ?? DEFAULT_JOINTS.elbowPitch,
    wristPitch: action.joint_targets?.joint_4 ?? DEFAULT_JOINTS.wristPitch,
    gripper: 0,
  };
}

describe("PlayScript", () => {
  it("waves above the table then finishes", () => {
    const agent = new PlayScript("wave");
    const state = restState();
    let yaw = 0;
    let peakY = 0;
    for (let i = 0; i < 160; i += 1) {
      const action = agent.act(state);
      const joints = jointsFrom(action);
      expect(armClearsTable(forwardKinematics(joints))).toBe(true);
      yaw = Math.max(yaw, Math.abs(joints.baseYaw));
      peakY = Math.max(peakY, forwardKinematics(joints).tcp.position[1]);
    }
    expect(yaw).toBeGreaterThan(0.5);
    expect(peakY).toBeGreaterThan(1.05);
    expect(agent.finished).toBe(true);
  });

  it("points above the cyan cube", () => {
    const agent = new PlayScript("point");
    const state = restState();
    let nearCyan = false;
    for (let i = 0; i < 90; i += 1) {
      const tcp = forwardKinematics(jointsFrom(agent.act(state))).tcp.position;
      expect(tcp[1]).toBeGreaterThan(TABLE_TOP_Y + 0.05);
      if (Math.abs(tcp[0] - 0.26) < 0.08 && Math.abs(tcp[2] + 0.16) < 0.08 && tcp[1] > 0.94) {
        nearCyan = true;
      }
    }
    expect(nearCyan).toBe(true);
  });

  it("snaps the gripper open and closed", () => {
    const agent = new PlayScript("snap");
    const state = restState();
    const grips = new Set<string>();
    for (let i = 0; i < 120; i += 1) {
      grips.add(agent.act(state).gripper_state);
    }
    expect(grips.has("open")).toBe(true);
    expect(grips.has("closed")).toBe(true);
    expect(agent.finished).toBe(true);
  });
});
