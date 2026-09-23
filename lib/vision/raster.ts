/** Assumption: 128×128 orthographic work-cell view; eval vision, not photorealism. */

import { CUBE_SIZE, TABLE_HALF_EXTENTS, TABLE_TOP_Y } from "@/simulation/constants";
import type { SimulationSnapshot, Vec3 } from "@/simulation/types";

export const VLA_IMAGE_SIZE = 128;
export const VLA_POLICY_HZ = 5;
export const VLA_ACTION_TIMEOUT_MS = 2000;

export const STACK_INSTRUCTION =
  "Stack the three cubes into a tower on the pad: cyan base, orange middle, magenta on top.";

/** World AABB of the camera (metres). */
export const VLA_X_MIN = -0.55;
export const VLA_X_MAX = 0.75;
export const VLA_Z_MIN = -0.5;
export const VLA_Z_MAX = 0.5;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function hexRgb(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  if (raw.length < 6) return [180, 180, 180];
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

/**
 * Project table XZ into pixel coordinates of the VLA raster.
 */
export function vlaWorldToPixel(x: number, z: number, size: number): [number, number] {
  const u = ((x - VLA_X_MIN) / (VLA_X_MAX - VLA_X_MIN)) * (size - 1);
  const v = ((VLA_Z_MAX - z) / (VLA_Z_MAX - VLA_Z_MIN)) * (size - 1);
  return [clamp(Math.round(u), 0, size - 1), clamp(Math.round(v), 0, size - 1)];
}

function fillRect(
  rgb: Uint8Array,
  size: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: [number, number, number],
): void {
  const loX = Math.max(0, Math.min(x0, x1));
  const hiX = Math.min(size - 1, Math.max(x0, x1));
  const loY = Math.max(0, Math.min(y0, y1));
  const hiY = Math.min(size - 1, Math.max(y0, y1));
  for (let y = loY; y <= hiY; y += 1) {
    for (let x = loX; x <= hiX; x += 1) {
      const i = (y * size + x) * 3;
      rgb[i] = color[0];
      rgb[i + 1] = color[1];
      rgb[i + 2] = color[2];
    }
  }
}

/**
 * Paint a top-down RGB frame of the table, cubes, and TCP. No privileged numbers in the pixels themselves.
 */
export function rasterScene(snapshot: SimulationSnapshot, size: number = VLA_IMAGE_SIZE): Uint8Array {
  const rgb = new Uint8Array(size * size * 3);
  rgb.fill(10);
  const table = vlaWorldToPixel(-TABLE_HALF_EXTENTS.x, -TABLE_HALF_EXTENTS.z, size);
  const table2 = vlaWorldToPixel(TABLE_HALF_EXTENTS.x, TABLE_HALF_EXTENTS.z, size);
  fillRect(rgb, size, table[0], table[1], table2[0], table2[1], [28, 32, 40]);

  const pad = vlaWorldToPixel(0.48, 0.22, size);
  fillRect(rgb, size, pad[0] - 4, pad[1] - 4, pad[0] + 4, pad[1] + 4, [40, 70, 90]);

  const halfPx = Math.max(2, Math.round((CUBE_SIZE / (VLA_X_MAX - VLA_X_MIN)) * size * 0.5));
  const ordered = [...snapshot.blocks].sort((a, b) => a.position[1] - b.position[1]);
  for (const block of ordered) {
    const [u, v] = vlaWorldToPixel(block.position[0], block.position[2], size);
    const lift = clamp(Math.round((block.position[1] - TABLE_TOP_Y) * 40), 0, 6);
    fillRect(rgb, size, u - halfPx, v - halfPx, u + halfPx + lift, v + halfPx, hexRgb(block.color));
  }

  const tcp: Vec3 = snapshot.arm.tcp.position;
  const [tu, tv] = vlaWorldToPixel(tcp[0], tcp[2], size);
  fillRect(rgb, size, tu - 1, tv - 3, tu + 1, tv + 3, [240, 240, 240]);
  fillRect(rgb, size, tu - 3, tv - 1, tu + 3, tv + 1, [240, 240, 240]);
  return rgb;
}

/**
 * Row-major RGB8 → standard base64 (no data: URL prefix).
 */
export function encodeRgb8(rgb: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(rgb).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < rgb.length; i += chunk) {
    const slice = rgb.subarray(i, i + chunk);
    for (let j = 0; j < slice.length; j += 1) {
      binary += String.fromCharCode(slice[j] as number);
    }
  }
  return btoa(binary);
}
