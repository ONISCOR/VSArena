import { describe, expect, it } from "vitest";
import {
  evalWindowId,
  isRetiredEvalWindow,
  officialSamplerSeed,
  previousEvalWindowId,
  samplerSeedFromAgent,
} from "@/lib/eval/sampler";
import { resolveScene } from "@/lib/eval/scenes";

describe("eval window sampler", () => {
  const thursday = new Date("2026-09-10T12:00:00.000Z");

  it("uses UTC ISO weeks", () => {
    expect(evalWindowId(thursday)).toBe("2026-W37");
    expect(previousEvalWindowId(thursday)).toBe("2026-W36");
    expect(isRetiredEvalWindow("2026-W36", thursday)).toBe(true);
    expect(isRetiredEvalWindow("2026-W37", thursday)).toBe(false);
  });

  it("gives every agent the same official seed in one window", () => {
    const a = officialSamplerSeed(thursday);
    const b = officialSamplerSeed(thursday);
    expect(a.window).toBe("2026-W37");
    expect(a.seed).toBe(b.seed);
    const next = officialSamplerSeed(new Date("2026-09-17T12:00:00.000Z"));
    expect(next.window).toBe("2026-W38");
    expect(next.seed).not.toBe(a.seed);
  });

  it("does not pin official layouts to the agent name", () => {
    const seed = officialSamplerSeed(thursday).seed;
    const ada = resolveScene({
      matchId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      samplerSeed: seed,
      arm: "scored",
      env: { VSARENA_SCENE_SET: "held_out" },
    });
    const bea = resolveScene({
      matchId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      samplerSeed: seed,
      arm: "scored",
      env: { VSARENA_SCENE_SET: "held_out" },
    });
    expect(ada.hash).toBe(bea.hash);
    expect(ada.spawns).toEqual(bea.spawns);
    expect(samplerSeedFromAgent("Ada")).not.toBe(samplerSeedFromAgent("Bea"));
  });
});
