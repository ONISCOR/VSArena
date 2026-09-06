import { describe, expect, it } from "vitest";
import { buildReplayArtifact, maybeRecordReplaySample, type ReplaySample } from "@/lib/eval/replay";
import { REPLAY_FORMAT } from "@/lib/eval/product";
import { emptyCounters } from "@/lib/eval/taxonomy";
import { buildProvenance } from "@/lib/eval/provenance";
import { DEFAULT_JOINTS } from "@/simulation/constants";
import { forwardKinematics } from "@/simulation/armKinematics";
import type { SimulationSnapshot } from "@/simulation/types";

function snap(tick: number): SimulationSnapshot {
  return {
    joints: DEFAULT_JOINTS,
    arm: forwardKinematics(DEFAULT_JOINTS),
    blocks: [
      {
        id: "block_cyan",
        position: [0.2, 0.75, 0],
        rotation: [0, 0, 0, 1],
        color: "#00AEEF",
      },
    ],
    graspedBlockId: null,
    tick,
    debugBoxes: [],
  };
}

describe("replay artifact", () => {
  it("records a sparse privileged trail in vsarena-replay-v1", () => {
    const samples: ReplaySample[] = [];
    maybeRecordReplaySample(samples, snap(0), "vla");
    maybeRecordReplaySample(samples, snap(1), "vla");
    maybeRecordReplaySample(samples, snap(8), "vla");
    expect(samples.map((s) => s.tick)).toEqual([0, 8]);

    const provenance = buildProvenance({
      mode: "vla",
      samplerSeed: 7,
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
    const artifact = buildReplayArtifact({
      matchId: "m1",
      agent: "Hold",
      provenance,
      failure: {
        code: "policy.task_incomplete",
        domain: "policy",
        message: "policy.task_incomplete: horizon reached without a full stack",
        recoverable: false,
      },
      scores: {
        spatial_accuracy: 0.1,
        task_completion_score: 0,
        joint_torque_telemetry: { peak: 0, avg: 0 },
      },
      status: "completed",
      samples,
    });
    expect(artifact.format).toBe(REPLAY_FORMAT);
    expect(artifact.samples[0].blocks[0].position).toEqual([0.2, 0.75, 0]);
    expect(artifact.provenance.product).toBe(provenance.product);
  });
});
