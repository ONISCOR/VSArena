/** Hidden-scene construction. Assumption: Studio uses public.canonical; official ELO uses held_out (or operator JSON). */

import { BLOCK_SPAWNS, CUBE_HALF, TABLE_TOP_Y } from "@/simulation/constants";

export type SceneSet = "public" | "held_out";

export interface BlockSpawn {
  id: string;
  position: [number, number, number];
  color: string;
}

export interface ResolvedScene {
  set: SceneSet;
  /** Stable id, e.g. public.canonical or held_out.layout-3 */
  id: string;
  seed: number;
  hash: string;
  spawns: BlockSpawn[];
  /** true when VSARENA_HELD_OUT_JSON supplied layouts not in git */
  private_override: boolean;
}

const Y = TABLE_TOP_Y + CUBE_HALF + 0.006;

const COLORS: Record<string, string> = {
  block_cyan: "#00AEEF",
  block_orange: "#F7941E",
  block_magenta: "#E11D8F",
};

/**
 * Eight held-out XY layouts. Not used in Studio. Coordinates are in-repo (not secret);
 * operators can replace them with VSARENA_HELD_OUT_JSON for a private set.
 */
const HELD_OUT_XZ: Array<[[number, number], [number, number], [number, number]]> = [
  [
    [0.18, -0.22],
    [0.34, 0.02],
    [0.12, 0.18],
  ],
  [
    [0.22, 0.26],
    [0.08, -0.1],
    [0.36, -0.22],
  ],
  [
    [0.1, -0.26],
    [0.28, 0.14],
    [0.38, -0.06],
  ],
  [
    [0.16, 0.08],
    [0.06, 0.24],
    [0.32, -0.18],
  ],
  [
    [0.4, 0.1],
    [0.14, -0.14],
    [0.24, 0.22],
  ],
  [
    [0.08, 0.02],
    [0.3, -0.24],
    [0.2, 0.16],
  ],
  [
    [0.36, 0.2],
    [0.18, -0.04],
    [0.12, -0.2],
  ],
  [
    [0.26, -0.28],
    [0.06, -0.16],
    [0.34, 0.12],
  ],
];

/**
 * Integer hash of a uuid / string → uint32.
 *
 * @example seedFromId("m1")
 */
export function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function spawnHash(spawns: BlockSpawn[], set: SceneSet, seed: number): string {
  const payload = JSON.stringify({
    set,
    seed,
    p: spawns.map((s) => [s.id, s.position.map((n) => Math.round(n * 1000))]),
  });
  let h = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function publicSpawns(): BlockSpawn[] {
  return BLOCK_SPAWNS.map((s) => ({
    id: s.id,
    position: [...s.position] as [number, number, number],
    color: s.color,
  }));
}

function heldOutSpawns(seed: number): { index: number; spawns: BlockSpawn[] } {
  const index = seed % HELD_OUT_XZ.length;
  const layout = HELD_OUT_XZ[index];
  const ids = ["block_cyan", "block_orange", "block_magenta"] as const;
  const spawns: BlockSpawn[] = ids.map((id, i) => {
    const jitterX = (((seed >>> (i * 3)) & 7) - 3) * 0.008;
    const jitterZ = (((seed >>> (i * 5 + 2)) & 7) - 3) * 0.008;
    const xz = layout[i];
    return {
      id,
      color: COLORS[id],
      position: [xz[0] + jitterX, Y, xz[1] + jitterZ],
    };
  });
  return { index, spawns };
}

function parsePrivateJson(raw: string): BlockSpawn[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 3) return null;
    const out: BlockSpawn[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") return null;
      const id = String((row as { id?: string }).id ?? "");
      const pos = (row as { position?: number[] }).position;
      if (!COLORS[id] || !Array.isArray(pos) || pos.length !== 3) return null;
      if (!pos.every((n) => typeof n === "number" && Number.isFinite(n))) return null;
      out.push({
        id,
        color: COLORS[id],
        position: [pos[0], pos[1], pos[2]],
      });
    }
    const ids = out.map((s) => s.id).sort().join(",");
    if (ids !== "block_cyan,block_magenta,block_orange") return null;
    return out;
  } catch {
    return null;
  }
}

/**
 * Official vs Studio scene. Production harness defaults to held_out.
 * Pass `samplerSeed` (eval-window) so every agent in the same week shares layouts.
 * `arm: "control"` is always the public canonical layout (no jitter).
 *
 * @example resolveScene({ matchId: "uuid", samplerSeed, arm: "scored" })
 */
export function resolveScene(options: {
  matchId: string;
  env?: NodeJS.ProcessEnv;
  /** When set, held-out sampling uses this instead of hashing matchId. */
  samplerSeed?: number;
  arm?: "scored" | "control";
}): ResolvedScene {
  const env = options.env ?? process.env;
  if (options.arm === "control") {
    const spawns = publicSpawns();
    return {
      set: "public",
      id: "public.canonical",
      seed: 0,
      hash: spawnHash(spawns, "public", 0),
      spawns,
      private_override: false,
    };
  }
  const seed = options.samplerSeed !== undefined ? options.samplerSeed >>> 0 : seedFromId(options.matchId);
  const forced = (env.VSARENA_SCENE_SET ?? "").trim();
  const privateSpawns = env.VSARENA_HELD_OUT_JSON ? parsePrivateJson(env.VSARENA_HELD_OUT_JSON) : null;

  let set: SceneSet;
  if (forced === "public" || forced === "held_out") {
    set = forced;
  } else {
    set = env.NODE_ENV === "production" ? "held_out" : "public";
  }

  if (set === "public") {
    const spawns = publicSpawns();
    return {
      set,
      id: "public.canonical",
      seed: 0,
      hash: spawnHash(spawns, set, 0),
      spawns,
      private_override: false,
    };
  }

  if (privateSpawns) {
    return {
      set,
      id: "held_out.private",
      seed,
      hash: spawnHash(privateSpawns, set, seed),
      spawns: privateSpawns,
      private_override: true,
    };
  }

  const { index, spawns } = heldOutSpawns(seed);
  return {
    set,
    id: `held_out.layout-${index}`,
    seed,
    hash: spawnHash(spawns, set, seed),
    spawns,
    private_override: false,
  };
}

export function canonicalPublicSpawns(): BlockSpawn[] {
  return publicSpawns();
}
