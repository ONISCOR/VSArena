/** Color blobs in the VLA RGB raster. Thresholds match `rasterScene` paints. */

import { VLA_X_MAX, VLA_X_MIN, VLA_Z_MAX, VLA_Z_MIN } from "@/lib/vision/raster";

export interface BlobCentroid {
  u: number;
  v: number;
  count: number;
}

export interface SceneBlobs {
  cyan: BlobCentroid | null;
  orange: BlobCentroid | null;
  magenta: BlobCentroid | null;
  tcp: BlobCentroid | null;
  pad: BlobCentroid | null;
}

function classify(r: number, g: number, b: number): keyof SceneBlobs | null {
  if (r > 220 && g > 220 && b > 220) return "tcp";
  if (r < 80 && g > 120 && b > 180) return "cyan";
  if (r > 200 && g > 90 && g < 210 && b < 90) return "orange";
  if (r > 160 && g < 90 && b > 90) return "magenta";
  if (r < 55 && g > 55 && g < 95 && b > 75 && b < 110) return "pad";
  return null;
}

/**
 * Centroids of painted cubes / TCP / pad in an `image/rgb8` buffer.
 */
export function findBlobs(rgb: Uint8Array, size: number): SceneBlobs {
  const acc: Record<keyof SceneBlobs, { su: number; sv: number; n: number }> = {
    cyan: { su: 0, sv: 0, n: 0 },
    orange: { su: 0, sv: 0, n: 0 },
    magenta: { su: 0, sv: 0, n: 0 },
    tcp: { su: 0, sv: 0, n: 0 },
    pad: { su: 0, sv: 0, n: 0 },
  };
  for (let v = 0; v < size; v += 1) {
    for (let u = 0; u < size; u += 1) {
      const i = (v * size + u) * 3;
      const key = classify(rgb[i], rgb[i + 1], rgb[i + 2]);
      if (!key) continue;
      acc[key].su += u;
      acc[key].sv += v;
      acc[key].n += 1;
    }
  }
  const toBlob = (cell: { su: number; sv: number; n: number }, min: number): BlobCentroid | null =>
    cell.n >= min ? { u: cell.su / cell.n, v: cell.sv / cell.n, count: cell.n } : null;
  return {
    cyan: toBlob(acc.cyan, 6),
    orange: toBlob(acc.orange, 6),
    magenta: toBlob(acc.magenta, 6),
    tcp: toBlob(acc.tcp, 4),
    pad: toBlob(acc.pad, 8),
  };
}

/**
 * Convert a pixel offset into a table-plane `ee_delta` (metres).
 */
export function pixelToEeDelta(du: number, dv: number, size: number): { dx: number; dz: number } {
  const span = size - 1;
  return {
    dx: (du / span) * (VLA_X_MAX - VLA_X_MIN),
    dz: -(dv / span) * (VLA_Z_MAX - VLA_Z_MIN),
  };
}
