// Assumption: held cubes are kinematic and snapped to TCP — impulse joints cannot fight Rapier contacts.

import RAPIER from "@dimforge/rapier3d-compat";
import type { RigidBody } from "@dimforge/rapier3d-compat";
import { GRASP_BOX, GRASP_RADIUS } from "./constants";
import { quatConjugate, quatRotateVec, vecDist, vecSub } from "./math";
import type { Quat, Vec3 } from "./types";

/**
 * True when a block center sits in the pinch box at the gripper TCP.
 * Local X = along the fingers, Y = gripper up, Z = between the pads.
 */
export function inGraspVolume(tcp: Vec3, tcpRot: Quat, block: Vec3): boolean {
  const rel = quatRotateVec(quatConjugate(tcpRot), vecSub(block, tcp));
  return Math.abs(rel[0]) <= GRASP_BOX.x && Math.abs(rel[1]) <= GRASP_BOX.y && Math.abs(rel[2]) <= GRASP_BOX.z;
}

/**
 * Nearest block inside the pinch volume (sphere pre-filter, then local box).
 */
export function findGraspTarget(
  tcp: Vec3,
  tcpRot: Quat,
  blocks: Array<{ id: string; position: Vec3 }>,
): string | null {
  let bestId: string | null = null;
  let bestDist = GRASP_RADIUS;
  for (const block of blocks) {
    const dist = vecDist(tcp, block.position);
    if (dist >= bestDist) continue;
    if (!inGraspVolume(tcp, tcpRot, block.position)) continue;
    bestDist = dist;
    bestId = block.id;
  }
  return bestId;
}

/**
 * Weld a cube to the pinch point by making it kinematic at the TCP (upright).
 */
export function attachBlockToGripper(body: RigidBody, tcp: Vec3): void {
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
  body.setTranslation({ x: tcp[0], y: tcp[1], z: tcp[2] }, true);
  body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
}

/**
 * Keep a held kinematic cube glued to the TCP for the next Rapier step.
 */
export function followGripper(body: RigidBody, tcp: Vec3): void {
  body.setNextKinematicTranslation({ x: tcp[0], y: tcp[1], z: tcp[2] });
  body.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
}

/**
 * Drop a held cube back to a dynamic rigid body at the current pose.
 */
export function releaseHeldBlock(body: RigidBody): void {
  const t = body.translation();
  const r = body.rotation();
  body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
  body.setTranslation({ x: t.x, y: t.y, z: t.z }, true);
  body.setRotation({ x: r.x, y: r.y, z: r.z, w: r.w }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp();
}
