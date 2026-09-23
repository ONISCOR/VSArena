// Assumption: Y-up, meters, arm mount on table top toward -X reaching +X.

import type { JointState } from "./types";

export const FIXED_DT = 1 / 60;
export const MAX_SUBSTEPS = 5;
export const GRAVITY_Y = -9.81;

export const TABLE_TOP_Y = 0.72;
export const TABLE_HALF_EXTENTS = { x: 0.7, y: 0.04, z: 0.45 };
export const TABLE_CENTER_Y = TABLE_TOP_Y - TABLE_HALF_EXTENTS.y;
/** Invisible rim colliders so cubes cannot slide off the table. */
export const TABLE_WALL_HALF_THICKNESS = 0.018;
export const TABLE_WALL_HALF_HEIGHT = 0.08;

export const FLOOR_HALF_EXTENTS = { x: 8, y: 0.05, z: 8 };

export const ARM_MOUNT: [number, number, number] = [-0.28, TABLE_TOP_Y, 0];
export const PEDESTAL_H = 0.11;
export const PEDESTAL_R = 0.07;
export const L_UPPER = 0.38;
export const L_FOREARM = 0.32;
export const L_WRIST = 0.13;
export const LINK_SIZE = 0.05;
export const JAW_LENGTH = 0.095;
export const JAW_HEIGHT = 0.048;
export const JAW_THICKNESS = 0.014;
/** Closed pad-to-pad gap equals the cube so fingers touch faces instead of clipping through. */
export const JAW_MIN_SEP = 0.069;
/** Open wide enough to straddle a cube without squeezing it on approach. */
export const JAW_MAX_SEP = 0.125;
/** Mid-finger grasp point, forward of the palm along the gripper X axis. */
export const GRASP_DEPTH = 0.05;
/** Gripper world pitch in the arm plane (table-parallel with a slight downward bias). */
export const WRIST_WORLD_PITCH = -0.12;

export const CUBE_SIZE = 0.055;
export const CUBE_HALF = CUBE_SIZE / 2;

export const GRASP_RADIUS = 0.04;
export const GRASP_BOX = { x: 0.028, y: 0.02, z: 0.03 };
export const GRASP_CLOSE_THRESHOLD = 0.82;
export const GRASP_OPEN_THRESHOLD = 0.38;

export const JOINT_SPEED = 3.4;
export const GRIPPER_SPEED = 3.6;

export const JOINT_LIMITS: Record<keyof JointState, { min: number; max: number }> = {
  baseYaw: { min: -Math.PI, max: Math.PI },
  shoulderPitch: { min: -0.35, max: 1.75 },
  elbowPitch: { min: -2.4, max: 0.15 },
  wristPitch: { min: -1.6, max: 1.6 },
  gripper: { min: 0, max: 1 },
};

export const DEFAULT_JOINTS: JointState = {
  baseYaw: 0,
  shoulderPitch: 0.97,
  elbowPitch: -1.92,
  wristPitch: 0.83,
  gripper: 0,
};

export const BLOCK_SPAWNS = [
  {
    id: "block_cyan",
    position: [0.26, TABLE_TOP_Y + CUBE_HALF + 0.006, -0.16] as [number, number, number],
    color: "#00AEEF",
  },
  {
    id: "block_orange",
    position: [0.36, TABLE_TOP_Y + CUBE_HALF + 0.006, 0] as [number, number, number],
    color: "#F7941E",
  },
  {
    id: "block_magenta",
    position: [0.28, TABLE_TOP_Y + CUBE_HALF + 0.006, 0.16] as [number, number, number],
    color: "#E11D8F",
  },
] as const;

export type BlockSpawnDesc = {
  id: string;
  position: [number, number, number];
  color: string;
};

/** Landing pad XY for a 3-cube tower (cyan base → orange → magenta). */
export const STACK_ORIGIN: [number, number, number] = [0.48, TABLE_TOP_Y, 0.22];

/**
 * Center Y of stack layer 0 (table), 1, 2.
 */
export function stackSlotY(layer: number): number {
  return TABLE_TOP_Y + CUBE_HALF + layer * CUBE_SIZE;
}

export const TARGET_ZONE = {
  position: [STACK_ORIGIN[0], TABLE_TOP_Y + 0.002, STACK_ORIGIN[2]] as [number, number, number],
  radius: 0.048,
};

/** 3D slot tolerance for “this cube is stacked”. */
export const STACK_TOLERANCE = 0.038;

/** Goal poses: same XY, increasing Y. Cyan is the base. */
export const BLOCK_TARGETS: Record<string, [number, number, number]> = {
  block_cyan: [STACK_ORIGIN[0], stackSlotY(0), STACK_ORIGIN[2]],
  block_orange: [STACK_ORIGIN[0], stackSlotY(1), STACK_ORIGIN[2]],
  block_magenta: [STACK_ORIGIN[0], stackSlotY(2), STACK_ORIGIN[2]],
};

export const MATCH_MAX_TICKS = 2400;
/** VLA is 5 Hz; three pick-and-places need more wall-clock than the state-track 20 Hz budget. */
export const VLA_MATCH_MAX_TICKS = 3600;
/** Extra physics ticks if the clock hits while a cube is still in the gripper. */
export const MATCH_GRASP_GRACE_TICKS = 180;
export const ACTION_TIMEOUT_MS = 150;
export const HARNESS_TICK_HZ = 20;
/** Pause after a match so scores stay readable, then restore the table. */
export const AUTO_RESET_DELAY_MS = 2500;

export interface TableWallDesc {
  id: string;
  /** Translation relative to the table rigid body. */
  local: [number, number, number];
  halfExtents: [number, number, number];
}

/**
 * Four rim walls sitting on the table top (local to the table body).
 */
export const TABLE_WALLS: TableWallDesc[] = (() => {
  const t = TABLE_WALL_HALF_THICKNESS;
  const h = TABLE_WALL_HALF_HEIGHT;
  const { x, z } = TABLE_HALF_EXTENTS;
  const y = TABLE_HALF_EXTENTS.y + h;
  return [
    { id: "wall_x+", local: [x - t, y, 0], halfExtents: [t, h, z] },
    { id: "wall_x-", local: [-(x - t), y, 0], halfExtents: [t, h, z] },
    { id: "wall_z+", local: [0, y, z - t], halfExtents: [x, h, t] },
    { id: "wall_z-", local: [0, y, -(z - t)], halfExtents: [x, h, t] },
  ];
})();
