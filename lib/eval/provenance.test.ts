import { describe, expect, it } from "vitest";
import { PRODUCT_VERSION, RAPIER_VERSION, REPLAY_FORMAT } from "@/lib/eval/product";
import { buildProvenance, gitSha, latencyBudgetMs } from "@/lib/eval/provenance";
import { emptyCounters } from "@/lib/eval/taxonomy";

describe("eval provenance", () => {
  it("stamps product, Rapier, and git sha", () => {
    const provenance = buildProvenance({
      mode: "vla",
      samplerSeed: 42,
      evalWindow: "2026-W37",
      scene: {
        set: "held_out",
        id: "held_out.layout-0",
        seed: 1,
        hash: "abc",
        private_override: false,
        arm: "scored",
      },
      counters: emptyCounters(),
      env: { RENDER_GIT_COMMIT: "abcdef0123456789" },
    });
    expect(provenance.sampler_seed).toBe(42);
    expect(provenance.eval_window).toBe("2026-W37");
    expect(provenance.scene.arm).toBe("scored");
    expect(provenance.product).toBe(PRODUCT_VERSION);
    expect(provenance.rapier).toBe(RAPIER_VERSION);
    expect(provenance.physics_hz).toBe(60);
    expect(provenance.git_sha).toBe("abcdef0123456789");
    expect(provenance.observation_mode).toBe("vla");
    expect(provenance.latency_budget_ms).toBe(latencyBudgetMs("vla"));
    expect(provenance.task_id).toBe("block_stacking");
    expect(provenance.task_version).toBe("block_stacking.v1");
    expect(provenance.observation_schema_version).toBe("obs.v1");
    expect(provenance.action_schema_version).toBe("action.v1");
    expect(gitSha({ VERCEL_GIT_COMMIT_SHA: "deadbeef" })).toBe("deadbeef");
    expect(gitSha({})).toBe("unknown");
  });

  it("records episode wall-clock duration when start/end are provided", () => {
    const provenance = buildProvenance({
      mode: "vla",
      samplerSeed: 1,
      startedAtMs: 1_000,
      endedAtMs: 4_500,
      scene: {
        set: "public",
        id: "public.canonical",
        seed: 0,
        hash: "h",
        private_override: false,
        arm: "scored",
      },
      counters: emptyCounters(),
      env: {},
    });
    expect(provenance.started_at_ms).toBe(1000);
    expect(provenance.ended_at_ms).toBe(4500);
    expect(provenance.duration_ms).toBe(3500);
  });

  it("keeps the replay format id stable", () => {
    expect(REPLAY_FORMAT).toBe("vsarena-replay-v1");
  });
});
