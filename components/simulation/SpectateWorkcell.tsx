"use client";

import type { MutableRefObject } from "react";
import { Blocks } from "@/components/simulation/Blocks";
import { RobotArm } from "@/components/simulation/RobotArm";
import { Table } from "@/components/simulation/Table";
import { TargetZone } from "@/components/simulation/TargetZone";
import type { BlockState, JointState } from "@/simulation/types";

/** Rest pose used by the spectator until the first harness frame arrives. */
export const SPECTATE_REST: JointState = {
  baseYaw: 0,
  shoulderPitch: 0.6,
  elbowPitch: -1.2,
  wristPitch: -0.4,
  gripper: 0,
};

/**
 * Table, pad, arm, cubes — no hall, no Rapier. Shared by Studio, live, and PiP.
 */
export function SpectateWorkcell({
  jointsRef,
  blocksRef,
  ready,
}: {
  jointsRef: MutableRefObject<JointState>;
  blocksRef: MutableRefObject<BlockState[]>;
  ready: boolean;
}) {
  return (
    <>
      <Table />
      <TargetZone />
      {ready ? (
        <>
          <RobotArm jointsRef={jointsRef} />
          <Blocks blocksRef={blocksRef} />
        </>
      ) : null}
    </>
  );
}
