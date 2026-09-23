import type { JointState, Quat, Vec3 } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vecSub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vecLerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function vecDist(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dy, dz);
}

export function quatIdentity(): Quat {
  return [0, 0, 0, 1];
}

/**
 * Axis-angle to xyzw quaternion. Axis must be unit length.
 */
export function quatFromAxisAngle(ax: number, ay: number, az: number, angle: number): Quat {
  const half = angle * 0.5;
  const s = Math.sin(half);
  return [ax * s, ay * s, az * s, Math.cos(half)];
}

export function quatMul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function quatConjugate(q: Quat): Quat {
  return [-q[0], -q[1], -q[2], q[3]];
}

/**
 * Rotate a vector by a quaternion.
 */
export function quatRotateVec(q: Quat, v: Vec3): Vec3 {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  const ix = qw * vx + qy * vz - qz * vy;
  const iy = qw * vy + qz * vx - qx * vz;
  const iz = qw * vz + qx * vy - qy * vx;
  const iw = -qx * vx - qy * vy - qz * vz;
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ];
}

export function quatSlerp(a: Quat, b: Quat, t: number): Quat {
  let ax = a[0];
  let ay = a[1];
  let az = a[2];
  let aw = a[3];
  let bx = b[0];
  let by = b[1];
  let bz = b[2];
  let bw = b[3];
  let dot = ax * bx + ay * by + az * bz + aw * bw;
  if (dot < 0) {
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
    dot = -dot;
  }
  if (dot > 0.9995) {
    const x = ax + t * (bx - ax);
    const y = ay + t * (by - ay);
    const z = az + t * (bz - az);
    const w = aw + t * (bw - aw);
    const n = Math.hypot(x, y, z, w) || 1;
    return [x / n, y / n, z / n, w / n];
  }
  const theta0 = Math.acos(Math.min(1, dot));
  const sin0 = Math.sin(theta0);
  const s0 = Math.sin(theta0 - theta0 * t) / sin0;
  const s1 = Math.sin(theta0 * t) / sin0;
  return [s0 * ax + s1 * bx, s0 * ay + s1 * by, s0 * az + s1 * bz, s0 * aw + s1 * bw];
}

export function cloneJoints(joints: JointState): JointState {
  return { ...joints };
}

export function moveToward(current: number, target: number, maxDelta: number): number {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
}
