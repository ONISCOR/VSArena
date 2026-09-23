import { CUBE_HALF, FLOOR_HALF_EXTENTS, TABLE_HALF_EXTENTS, TABLE_TOP_Y } from "./constants";
import type { ArmSnapshot, Vec3 } from "./types";

/** Minimum gap between arm TCP and the table/floor surface. */
export const TABLE_CLEARANCE = 0.008;

/**
 * True when (x, z) is above the table top (including a small rim margin).
 */
export function isOverTable(x: number, z: number): boolean {
  return Math.abs(x) <= TABLE_HALF_EXTENTS.x + 0.02 && Math.abs(z) <= TABLE_HALF_EXTENTS.z + 0.02;
}

/**
 * Lowest allowed Y for a point (table top or floor top).
 */
export function surfaceY(x: number, z: number): number {
  return isOverTable(x, z) ? TABLE_TOP_Y : FLOOR_HALF_EXTENTS.y;
}

/**
 * Lowest allowed Y for a block center so the cube sits on the surface.
 */
export function minBlockCenterY(x: number, z: number): number {
  return surfaceY(x, z) + CUBE_HALF;
}

function pointClears(position: Vec3, extra: number): boolean {
  return position[1] >= surfaceY(position[0], position[2]) + extra;
}

/**
 * False if TCP, palm, jaws, wrist, or forearm would clip through the table/floor.
 */
export function armClearsTable(arm: ArmSnapshot): boolean {
  return (
    pointClears(arm.tcp.position, 0.012) &&
    pointClears(arm.palm.position, 0) &&
    pointClears(arm.wrist.position, 0.012) &&
    pointClears(arm.forearm.position, 0.02) &&
    pointClears(arm.jawLeft.position, 0) &&
    pointClears(arm.jawRight.position, 0)
  );
}

/** Rapier interaction groups: membership in the high 16 bits, filter in the low 16. */
export const LAYER_STATIC = 0b0001;
export const LAYER_BLOCK = 0b0010;
export const LAYER_ARM = 0b0100;

export function collisionGroups(membership: number, filter: number): number {
  return ((membership & 0xffff) << 16) | (filter & 0xffff);
}

export const GROUPS_STATIC = collisionGroups(LAYER_STATIC, LAYER_BLOCK | LAYER_ARM);
/** Free cube: table + other cubes. */
export const GROUPS_BLOCK = collisionGroups(LAYER_BLOCK, LAYER_STATIC | LAYER_BLOCK);
/** Held cube: only the table. Kinematic carry must not cannon other cubes. */
export const GROUPS_BLOCK_HELD = collisionGroups(LAYER_BLOCK, LAYER_STATIC);
export const GROUPS_ARM = collisionGroups(LAYER_ARM, LAYER_STATIC);
