import {
  ARM_MOUNT,
  GRASP_DEPTH,
  JAW_LENGTH,
  JAW_MAX_SEP,
  JAW_MIN_SEP,
  L_FOREARM,
  L_UPPER,
  L_WRIST,
  PEDESTAL_H,
} from "./constants";
import { quatFromAxisAngle, quatIdentity, quatMul, quatRotateVec, vecAdd } from "./math";
import type { ArmSnapshot, JointState, Pose, Vec3 } from "./types";

function pose(position: Vec3, rotation: [number, number, number, number]): Pose {
  return { position, rotation };
}

/**
 * 5-DOF forward kinematics for the VSArena table-mounted arm.
 *
 * Chain: yaw (Y) → shoulder pitch (Z) → elbow pitch (Z) → wrist pitch (Z) → gripper opening.
 * TCP is the mid-finger pinch point, not the palm.
 */
export function forwardKinematics(joints: JointState, mount: Vec3 = ARM_MOUNT): ArmSnapshot {
  const pedestal = pose(
    [mount[0], mount[1] + PEDESTAL_H / 2, mount[2]],
    quatIdentity(),
  );

  let origin: Vec3 = [mount[0], mount[1] + PEDESTAL_H, mount[2]];
  let rot = quatFromAxisAngle(0, 1, 0, joints.baseYaw);
  const shoulder = pose([...origin], rot);

  rot = quatMul(rot, quatFromAxisAngle(0, 0, 1, joints.shoulderPitch));
  const upperArm = pose(vecAdd(origin, quatRotateVec(rot, [L_UPPER / 2, 0, 0])), rot);
  origin = vecAdd(origin, quatRotateVec(rot, [L_UPPER, 0, 0]));

  rot = quatMul(rot, quatFromAxisAngle(0, 0, 1, joints.elbowPitch));
  const elbow = pose([...origin], rot);
  const forearm = pose(vecAdd(origin, quatRotateVec(rot, [L_FOREARM / 2, 0, 0])), rot);
  origin = vecAdd(origin, quatRotateVec(rot, [L_FOREARM, 0, 0]));

  rot = quatMul(rot, quatFromAxisAngle(0, 0, 1, joints.wristPitch));
  const wrist = pose([...origin], rot);
  origin = vecAdd(origin, quatRotateVec(rot, [L_WRIST, 0, 0]));
  const palm = pose([...origin], rot);
  const tcp = pose(vecAdd(origin, quatRotateVec(rot, [GRASP_DEPTH, 0, 0])), rot);

  const sep = JAW_MIN_SEP / 2 + ((JAW_MAX_SEP - JAW_MIN_SEP) / 2) * (1 - joints.gripper);
  const jawLeft = pose(vecAdd(origin, quatRotateVec(rot, [JAW_LENGTH / 2, 0, sep])), rot);
  const jawRight = pose(vecAdd(origin, quatRotateVec(rot, [JAW_LENGTH / 2, 0, -sep])), rot);

  return { pedestal, shoulder, upperArm, elbow, forearm, wrist, palm, jawLeft, jawRight, tcp };
}
