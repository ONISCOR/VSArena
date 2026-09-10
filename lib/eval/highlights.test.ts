import { describe, expect, it } from "vitest";
import {
  highlightDelayMs,
  highlightSampleToFrame,
  maybeRecordHighlightSample,
  parseHighlightRun,
  publicHighlightFeed,
  rankHighlights,
  type HighlightRun,
} from "@/lib/eval/highlights";
import type { ReplaySample } from "@/lib/eval/replay";
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

function run(partial: Partial<HighlightRun> & Pick<HighlightRun, "match_id" | "eval_window">): HighlightRun {
  return {
    agent: "Ada",
    sampler_seed: 1,
    mode: "vla",
    scores: { spatial_accuracy: 0.4, task_completion_score: 0 },
    samples: [snap(0)].map((s) => ({
      tick: s.tick,
      joints: s.joints,
      blocks: s.blocks.map((b) => ({ id: b.id, position: b.position, rotation: b.rotation })),
      grasped_block_id: null,
    })),
    ...partial,
  };
}

describe("weekly highlights", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  it("records a denser trail than the audit replay", () => {
    const trail: ReplaySample[] = [];
    maybeRecordHighlightSample(trail, snap(0), "vla");
    maybeRecordHighlightSample(trail, snap(1), "vla");
    maybeRecordHighlightSample(trail, snap(15), "vla");
    expect(trail.map((s) => s.tick)).toEqual([0, 15]);
  });

  it("hides the current window on the public feed", () => {
    const feed = publicHighlightFeed(
      [
        run({ match_id: "old", eval_window: "2026-W36", scores: { spatial_accuracy: 0.9, task_completion_score: 1 } }),
        run({ match_id: "now", eval_window: "2026-W37", scores: { spatial_accuracy: 1, task_completion_score: 1 } }),
      ],
      now,
    );
    expect(feed.window).toBe("2026-W36");
    expect(feed.runs.map((r) => r.match_id)).toEqual(["old"]);
  });

  it("keeps the best runs and stamps highlight frames", () => {
    const ranked = rankHighlights(
      [run({ match_id: "weak", eval_window: "2026-W36", scores: { spatial_accuracy: 0.1, task_completion_score: 0 } })],
      run({ match_id: "strong", eval_window: "2026-W36", scores: { spatial_accuracy: 0.8, task_completion_score: 1 } }),
    );
    expect(ranked[0].match_id).toBe("strong");
    const frame = highlightSampleToFrame(ranked[0], ranked[0].samples[0]);
    expect(frame.kind).toBe("highlight");
    expect(frame.eval_window).toBe("2026-W36");
    expect(highlightDelayMs(0, 15)).toBe(250);
    expect(parseHighlightRun({ ...ranked[0], samples: [] })).toBeNull();
    expect(parseHighlightRun(ranked[0])?.agent).toBe("Ada");
  });
});
