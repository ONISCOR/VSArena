import { describe, expect, it } from "vitest";
import { emptyCounters } from "@/lib/eval/taxonomy";
import { buildProvenance } from "@/lib/eval/provenance";
import {
  buildRunManifest,
  resultsSigningSecret,
  signRunManifest,
  stableStringify,
  verifyRunManifest,
} from "@/lib/eval/manifest";
import { samplerSeedFromAgent } from "@/lib/eval/sampler";
import { parseOfficialIngest } from "@/lib/matches/ingestPayload";

const SECRET = "test-results-signing-ok";

function fixture() {
  const samplerSeed = samplerSeedFromAgent("Ada");
  const provenance = buildProvenance({
    mode: "vla",
    samplerSeed,
    scene: {
      set: "held_out",
      id: "held_out.layout-0",
      seed: samplerSeed,
      hash: "abcd1234",
      private_override: false,
      arm: "scored",
    },
    counters: emptyCounters(),
    env: { GIT_COMMIT: "abc" },
  });
  const manifest = buildRunManifest({
    match_id: "11111111-1111-4111-8111-111111111111",
    agent: "Ada",
    status: "completed",
    scores: {
      spatial_accuracy: 0.5,
      task_completion_score: 0,
      joint_torque_telemetry: { peak: 1.2, avg: 0.4 },
    },
    sampler_seed: samplerSeed,
    failure: {
      code: "policy.task_incomplete",
      domain: "policy",
      message: "policy.task_incomplete: horizon reached without a full stack",
      recoverable: false,
    },
    provenance,
    control: {
      arm: "control",
      status: "completed",
      task_completion_score: 0,
      spatial_accuracy: 0.4,
      failure: {
        code: "policy.task_incomplete",
        domain: "policy",
        message: "policy.task_incomplete: horizon reached without a full stack",
        recoverable: false,
      },
      scene: { set: "public", id: "public.canonical", seed: 0, hash: "pubhash1" },
      degenerate: false,
    },
  });
  return { manifest, signature: signRunManifest(manifest, SECRET) };
}

describe("run manifest signature", () => {
  it("stable-stringifies with sorted keys", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("accepts a matching signature and rejects tampering", () => {
    const { manifest, signature } = fixture();
    expect(verifyRunManifest(manifest, signature, SECRET)).toBe(true);
    expect(verifyRunManifest({ ...manifest, agent: "Eve" }, signature, SECRET)).toBe(false);
    expect(verifyRunManifest(manifest, "0".repeat(64), SECRET)).toBe(false);
    expect(verifyRunManifest(manifest, signature, "wrong-secret-key!!")).toBe(false);
  });

  it("is deterministic for the same manifest", () => {
    const { manifest } = fixture();
    expect(signRunManifest(manifest, SECRET)).toBe(signRunManifest(manifest, SECRET));
  });

  it("falls back to the ingest secret", () => {
    expect(resultsSigningSecret({ HARNESS_INGEST_SECRET: SECRET })).toBe(SECRET);
    expect(resultsSigningSecret({ VSARENA_RESULTS_SIGNING_KEY: "dedicated-signing-key", HARNESS_INGEST_SECRET: SECRET })).toBe(
      "dedicated-signing-key",
    );
  });
});

describe("official ingest gate", () => {
  it("rejects unsigned and accepts a signed body", () => {
    const { manifest, signature } = fixture();
    const body = {
      type: "result",
      match_id: manifest.match_id,
      status: manifest.status,
      agent: manifest.agent,
      scores: manifest.scores,
      sampler_seed: manifest.sampler_seed,
      failure: manifest.failure,
      provenance: manifest.provenance,
      control: manifest.control,
    };
    expect(parseOfficialIngest(body, SECRET).ok).toBe(false);
    const signed = parseOfficialIngest({ ...body, signature }, SECRET);
    expect(signed.ok).toBe(true);
    if (signed.ok) {
      expect(signed.entry.signature).toBe(signature);
      expect(signed.entry.scores.joint_torque_telemetry.eval).toBeDefined();
    }
    expect(parseOfficialIngest({ ...body, signature, scores: { ...body.scores, task_completion_score: 1 } }, SECRET).ok).toBe(
      false,
    );
  });
});
