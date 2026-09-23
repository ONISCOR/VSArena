import {
  ARM_MOUNT,
  CUBE_HALF,
  GRASP_DEPTH,
  JOINT_LIMITS,
  L_FOREARM,
  L_UPPER,
  L_WRIST,
  PEDESTAL_H,
  TABLE_TOP_Y,
  WRIST_WORLD_PITCH,
} from "./constants";
import { clamp, quatConjugate, quatFromAxisAngle, quatRotateVec } from "./math";
import { isOverTable } from "./tableBounds";
import type { JointState, Vec3 } from "./types";

/**
 * Geometric IK for the 5-DOF yaw + 2-link + wrist chain.
 * Aims the mid-finger TCP (L_WRIST + GRASP_DEPTH past the wrist joint).
 */
export function inverseKinematics(target: Vec3, gripper = 0): JointState {
  const minY = isOverTable(target[0], target[2]) ? TABLE_TOP_Y + CUBE_HALF + 0.008 : CUBE_HALF + 0.008;
  const aim: Vec3 = [target[0], Math.max(target[1], minY), target[2]];

  const shoulder: Vec3 = [ARM_MOUNT[0], ARM_MOUNT[1] + PEDESTAL_H, ARM_MOUNT[2]];
  const dx = aim[0] - shoulder[0];
  const dy = aim[1] - shoulder[1];
  const dz = aim[2] - shoulder[2];

  const baseYaw = clamp(Math.atan2(-dz, dx), JOINT_LIMITS.baseYaw.min, JOINT_LIMITS.baseYaw.max);
  const yawQ = quatFromAxisAngle(0, 1, 0, baseYaw);
  const local = quatRotateVec(quatConjugate(yawQ), [dx, dy, dz]);

  const wristReach = L_WRIST + GRASP_DEPTH;
  let x = local[0] - wristReach * Math.cos(WRIST_WORLD_PITCH);
  let y = local[1] - wristReach * Math.sin(WRIST_WORLD_PITCH);

  const L2 = L_FOREARM;
  const maxReach = L_UPPER + L2 - 0.02;
  const minReach = Math.abs(L_UPPER - L2) + 0.02;
  let d = Math.hypot(x, y);
  if (d < 1e-6) {
    x = minReach;
    y = 0;
    d = minReach;
  }
  if (d > maxReach) {
    const s = maxReach / d;
    x *= s;
    y *= s;
    d = maxReach;
  } else if (d < minReach) {
    const s = minReach / d;
    x *= s;
    y *= s;
    d = minReach;
  }

  const cosElbow = clamp((L_UPPER * L_UPPER + L2 * L2 - d * d) / (2 * L_UPPER * L2), -1, 1);
  const elbowInterior = Math.acos(cosElbow);
  const elbowPitch = clamp(elbowInterior - Math.PI, JOINT_LIMITS.elbowPitch.min, JOINT_LIMITS.elbowPitch.max);

  const toTarget = Math.atan2(y, x);
  const cosShoulder = clamp((L_UPPER * L_UPPER + d * d - L2 * L2) / (2 * L_UPPER * d), -1, 1);
  const shoulderOffset = Math.acos(cosShoulder);
  const shoulderPitch = clamp(toTarget + shoulderOffset, JOINT_LIMITS.shoulderPitch.min, JOINT_LIMITS.shoulderPitch.max);

  const wristPitch = clamp(
    WRIST_WORLD_PITCH - shoulderPitch - elbowPitch,
    JOINT_LIMITS.wristPitch.min,
    JOINT_LIMITS.wristPitch.max,
  );

  return {
    baseYaw,
    shoulderPitch,
    elbowPitch,
    wristPitch,
    gripper: clamp(gripper, 0, 1),
  };
}
