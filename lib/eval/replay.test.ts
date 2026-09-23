import { describe, expect, it } from "vitest";
import {
  buildReplayArtifact,
  failureSampleIndex,
  parseStoredReplayTrail,
  snapshotToReplaySample,
  toStoredReplayTrail,
} from "@/lib/eval/replay";
import { buildProvenance } from "@/lib/eval/provenance";
import { emptyCounters } from "@/lib/eval/taxonomy";
import { REPLAY_FORMAT } from "@/lib/eval/product";
import type { SimulationSnapshot } from "@/simulation/types";

function snap(tick: number): SimulationSnapshot {
  return {
    tick,
    joints: {
      baseYaw: 0.1,
      shoulderPitch: 0.2,
      elbowPitch: -0.3,
      wristPitch: 0.4,
      gripper: 0.5,
    },
    blocks: [
      {
        id: "block_cyan",
        position: [0.1, 0.2, 0.3],
        rotation: [0, 0, 0, 1],
        color: "#00AEEF",
      },
    ],
    graspedBlockId: null,
    gripperPose: [0, 0, 0, 0, 0, 0, 1],
  } as SimulationSnapshot;
}

describe("official replay trail", () => {
  it("round-trips stored samples and reports end index", () => {
    const sample = snapshotToReplaySample(snap(8));
    const provenance = buildProvenance({
      mode: "vla",
      samplerSeed: 3,
      scene: {
        set: "held_out",
        id: "held_out.layout-0",
        seed: 3,
        hash: "h",
        private_override: false,
        arm: "scored",
      },
      counters: emptyCounters(),
      env: { GIT_COMMIT: "abc" },
    });
    const artifact = buildReplayArtifact({
      matchId: "m1",
      agent: "Ada",
      provenance,
      failure: {
        code: "policy.task_incomplete",
        domain: "policy",
        message: "incomplete",
        recoverable: false,
      },
      scores: {
        spatial_accuracy: 0.2,
        task_completion_score: 0,
        joint_torque_telemetry: { peak: 1, avg: 0.5 },
      },
      status: "completed",
      samples: [sample, snapshotToReplaySample(snap(16))],
      startedAtMs: 10,
      endedAtMs: 210,
    });
    expect(artifact.format).toBe(REPLAY_FORMAT);
    expect(artifact.duration_ms).toBe(200);
    const trail = toStoredReplayTrail(artifact);
    const parsed = parseStoredReplayTrail(trail);
    expect(parsed?.samples).toHaveLength(2);
    expect(failureSampleIndex(parsed!.samples)).toBe(1);
  });

  it("rejects malformed trails", () => {
    expect(parseStoredReplayTrail({ format: REPLAY_FORMAT, samples: [{ tick: 1 }] })).toBeNull();
  });
});
