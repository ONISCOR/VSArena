import { describe, expect, it } from "vitest";
import { ArenaSimulation } from "@/simulation/rapierWorld";
import { officialSamplerSeed } from "@/lib/eval/sampler";
import {
  canonicalPublicSpawns,
  resolveScene,
  seedFromId,
} from "@/lib/eval/scenes";
import { shouldRunLiveControl } from "@/lib/eval/control";

describe("scene construction", () => {
  it("is deterministic for the same match id", () => {
    const env = { NODE_ENV: "production" };
    const a = resolveScene({ matchId: "match-repeat", env });
    const b = resolveScene({ matchId: "match-repeat", env });
    expect(a.hash).toBe(b.hash);
    expect(a.id).toBe(b.id);
    expect(a.spawns).toEqual(b.spawns);
    expect(seedFromId("match-repeat")).toBe(seedFromId("match-repeat"));
  });

  it("keeps Studio/public layouts different from held-out ELO layouts", () => {
    const pub = resolveScene({ matchId: "m1", env: { VSARENA_SCENE_SET: "public" } });
    const held = resolveScene({ matchId: "m1", env: { VSARENA_SCENE_SET: "held_out" } });
    expect(pub.set).toBe("public");
    expect(pub.id).toBe("public.canonical");
    expect(held.set).toBe("held_out");
    expect(held.id).not.toBe(pub.id);
    expect(held.spawns.map((s) => s.position)).not.toEqual(pub.spawns.map((s) => s.position));
    expect(held.hash).not.toBe(pub.hash);
  });

  it("defaults local harness to public and production to held_out", () => {
    expect(resolveScene({ matchId: "m", env: { NODE_ENV: "development" } }).set).toBe("public");
    expect(resolveScene({ matchId: "m", env: { NODE_ENV: "production" } }).set).toBe("held_out");
  });

  it("pins held-out layouts to the eval-window sampler seed, not match_id", () => {
    const seed = officialSamplerSeed(new Date("2026-09-10T12:00:00.000Z")).seed;
    const a = resolveScene({
      matchId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      samplerSeed: seed,
      arm: "scored",
      env: { VSARENA_SCENE_SET: "held_out" },
    });
    const b = resolveScene({
      matchId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      samplerSeed: seed,
      arm: "scored",
      env: { VSARENA_SCENE_SET: "held_out" },
    });
    expect(a.seed).toBe(seed);
    expect(a.hash).toBe(b.hash);
    expect(a.spawns).toEqual(b.spawns);
  });

  it("keeps the control arm on the public canonical layout", () => {
    const seed = officialSamplerSeed(new Date("2026-09-10T12:00:00.000Z")).seed;
    const control = resolveScene({
      matchId: "m-control",
      samplerSeed: seed,
      arm: "control",
      env: { NODE_ENV: "production", VSARENA_SCENE_SET: "held_out" },
    });
    const scored = resolveScene({
      matchId: "m-control",
      samplerSeed: seed,
      arm: "scored",
      env: { NODE_ENV: "production" },
    });
    expect(control.id).toBe("public.canonical");
    expect(control.seed).toBe(0);
    expect(control.set).toBe("public");
    expect(scored.set).toBe("held_out");
    expect(shouldRunLiveControl("held_out", {})).toBe(true);
    expect(shouldRunLiveControl("public", {})).toBe(false);
    expect(shouldRunLiveControl("held_out", { VSARENA_SKIP_CONTROL: "1" })).toBe(false);
  });

  it("accepts a private operator JSON override", () => {
    const json = JSON.stringify([
      { id: "block_cyan", position: [0.11, 0.78, 0.02] },
      { id: "block_orange", position: [0.2, 0.78, -0.1] },
      { id: "block_magenta", position: [0.3, 0.78, 0.12] },
    ]);
    const scene = resolveScene({
      matchId: "priv",
      env: { VSARENA_SCENE_SET: "held_out", VSARENA_HELD_OUT_JSON: json },
    });
    expect(scene.private_override).toBe(true);
    expect(scene.id).toBe("held_out.private");
    expect(scene.spawns[0].position[0]).toBeCloseTo(0.11);
  });
});

describe("reset determinism", () => {
  it("places custom spawns at t=0", async () => {
    const spawns = canonicalPublicSpawns().map((s, i) => ({
      ...s,
      position: [0.12 + i * 0.06, s.position[1], 0.04] as [number, number, number],
    }));
    const sim = await ArenaSimulation.create({ spawns });
    const blocks = sim.getCurrentSnapshot().blocks;
    for (const spawn of spawns) {
      const block = blocks.find((b) => b.id === spawn.id);
      expect(block).toBeDefined();
      expect(block!.position[0]).toBeCloseTo(spawn.position[0], 3);
      expect(block!.position[2]).toBeCloseTo(spawn.position[2], 3);
    }
    sim.dispose();
  }, 20000);
});
