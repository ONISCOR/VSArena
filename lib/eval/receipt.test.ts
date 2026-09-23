import { describe, expect, it } from "vitest";
import { emptyCounters } from "@/lib/eval/taxonomy";
import { buildProvenance } from "@/lib/eval/provenance";
import { buildRunManifest, signRunManifest, stableStringify, verifyRunManifest } from "@/lib/eval/manifest";
import {
  DIGEST_ALG,
  DSSE_PAYLOAD_TYPE,
  RECEIPT_ALG,
  attachReceipt,
  digestRunManifest,
  dssePae,
  generateEvalKeyPair,
  normalizePem,
  parseEd25519Private,
  parseEd25519Public,
  resultsEd25519Public,
  verifyDigest,
  verifyManifestDsse,
  verifyStoredReceipt,
} from "@/lib/eval/receipt";
import { parseOfficialIngest } from "@/lib/matches/ingestPayload";
import type { RunManifest } from "@/lib/eval/manifest";

const HMAC_SECRET = "test-results-signing-ok";

function fixtureManifest(): RunManifest {
  const provenance = buildProvenance({
    mode: "vla",
    samplerSeed: 7,
    evalWindow: "2026-W37",
    scene: {
      set: "held_out",
      id: "held_out.layout-0",
      seed: 7,
      hash: "abcd1234",
      private_override: false,
      arm: "scored",
    },
    counters: emptyCounters(),
    env: { GIT_COMMIT: "abc" },
  });
  return buildRunManifest({
    match_id: "11111111-1111-4111-8111-111111111111",
    agent: "Ada",
    status: "completed",
    scores: {
      spatial_accuracy: 0.5,
      task_completion_score: 0,
      joint_torque_telemetry: { peak: 1.2, avg: 0.4 },
    },
    sampler_seed: 7,
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
}

function ingestBody(manifest: RunManifest, extra: Record<string, unknown> = {}) {
  return {
    type: "result",
    match_id: manifest.match_id,
    status: manifest.status,
    agent: manifest.agent,
    owner_id: "22222222-2222-4222-8222-222222222222",
    scores: manifest.scores,
    sampler_seed: manifest.sampler_seed,
    failure: manifest.failure,
    provenance: manifest.provenance,
    control: manifest.control,
    ...extra,
  };
}

describe("DSSE PAE", () => {
  it("matches the DSSEv1 length-prefixed encoding", () => {
    const payload = Buffer.from("{}", "utf8");
    const pae = dssePae("text/plain", payload);
    expect(pae.toString("utf8")).toBe("DSSEv1 10 text/plain 2 {}");
    expect(DSSE_PAYLOAD_TYPE).toBe("application/vnd.vsarena.run-manifest+json");
    expect(DSSE_PAYLOAD_TYPE.length).toBe(41);
  });
});

describe("integrity digest", () => {
  it("is 64 hex chars and flips when the manifest changes", () => {
    const manifest = fixtureManifest();
    const digest = digestRunManifest(manifest);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).toBe(digestRunManifest(manifest));
    expect(verifyDigest(manifest, digest)).toBe(true);
    expect(verifyDigest({ ...manifest, agent: "Eve" }, digest)).toBe(false);
    expect(DIGEST_ALG).toBe("sha256");
  });
});

describe("Ed25519 DSSE identity", () => {
  it("round-trips with a published public key", () => {
    const keys = generateEvalKeyPair();
    const manifest = fixtureManifest();
    const receipt = attachReceipt(manifest, keys.privateKey);
    expect(receipt.alg).toBe(RECEIPT_ALG);
    expect(verifyDigest(manifest, receipt.digest)).toBe(true);
    expect(verifyManifestDsse(manifest, receipt.signature, keys.publicKey)).toBe(true);
    expect(verifyManifestDsse({ ...manifest, agent: "Eve" }, receipt.signature, keys.publicKey)).toBe(false);
    const other = generateEvalKeyPair();
    expect(verifyManifestDsse(manifest, receipt.signature, other.publicKey)).toBe(false);
    expect(parseEd25519Private(keys.privatePem)?.asymmetricKeyType).toBe("ed25519");
    expect(parseEd25519Public(keys.publicPem)?.asymmetricKeyType).toBe("ed25519");
  });

  it("loads keys from env PEM with escaped newlines", () => {
    const keys = generateEvalKeyPair();
    const env = {
      VSARENA_RESULTS_ED25519_PRIVATE: keys.privatePem.replace(/\n/g, "\\n"),
      VSARENA_RESULTS_ED25519_PUBLIC: keys.publicPem.replace(/\n/g, "\\n"),
    };
    expect(resultsEd25519Public(env)?.export({ type: "spki", format: "pem" }).toString()).toBe(keys.publicPem);
  });

  it("loads concatenated, quoted, and raw-base64 env values", () => {
    const keys = generateEvalKeyPair();
    const publicBody = keys.publicPem.replace(/-----[-A-Z ]+-----/g, "").replace(/\s+/g, "");
    const privateBody = keys.privatePem.replace(/-----[-A-Z ]+-----/g, "").replace(/\s+/g, "");
    expect(parseEd25519Public(`-----BEGIN PUBLIC KEY-----${publicBody}-----END PUBLIC KEY-----`)?.asymmetricKeyType).toBe(
      "ed25519",
    );
    expect(parseEd25519Public(`"${keys.publicPem.replace(/\n/g, "\\n")}"`)?.asymmetricKeyType).toBe("ed25519");
    expect(parseEd25519Public(publicBody)?.asymmetricKeyType).toBe("ed25519");
    expect(parseEd25519Private(privateBody)?.asymmetricKeyType).toBe("ed25519");
    expect(normalizePem(`-----BEGIN PUBLIC KEY-----${publicBody}-----END PUBLIC KEY-----`)).toContain("\n");
    expect(
      resultsEd25519Public({ VSARENA_RESULTS_ED25519_PUBLIC: publicBody })
        ?.export({ type: "spki", format: "pem" })
        .toString(),
    ).toBe(keys.publicPem);
  });
});

describe("official ingest gate", () => {
  it("rejects HMAC-only bodies and accepts digest + Ed25519", () => {
    const keys = generateEvalKeyPair();
    const manifest = fixtureManifest();
    const receipt = attachReceipt(manifest, keys.privateKey);
    const hmac = signRunManifest(manifest, HMAC_SECRET);
    const base = ingestBody(manifest);

    expect(parseOfficialIngest(base, { publicKey: keys.publicKey }).ok).toBe(false);
    expect(parseOfficialIngest({ ...base, signature: hmac }, { publicKey: keys.publicKey }).ok).toBe(false);
    expect(parseOfficialIngest({ ...base, digest: receipt.digest }, { publicKey: keys.publicKey }).ok).toBe(false);

    const ok = parseOfficialIngest(
      { ...base, digest: receipt.digest, signature: receipt.signature },
      { publicKey: keys.publicKey },
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.entry.digest).toBe(receipt.digest);
      expect(ok.entry.signature).toBe(receipt.signature);
      expect(ok.entry.owner_id).toBe("22222222-2222-4222-8222-222222222222");
      expect(ok.entry.scores.joint_torque_telemetry.eval?.alg).toBe(RECEIPT_ALG);
      expect(ok.entry.scores.joint_torque_telemetry.eval?.digest).toBe(receipt.digest);
    }

    expect(
      parseOfficialIngest(
        { ...base, digest: receipt.digest, signature: receipt.signature, owner_id: "not-a-uuid" },
        { publicKey: keys.publicKey },
      ).ok,
    ).toBe(false);

    expect(
      parseOfficialIngest(
        { ...base, digest: receipt.digest, signature: receipt.signature, scores: { ...base.scores, task_completion_score: 1 } },
        { publicKey: keys.publicKey },
      ).ok,
    ).toBe(false);

    expect(
      parseOfficialIngest(
        { ...base, digest: "0".repeat(64), signature: receipt.signature },
        { publicKey: keys.publicKey },
      ).ok,
    ).toBe(false);
  });

  it("rejects when the verify key is missing", () => {
    const keys = generateEvalKeyPair();
    const manifest = fixtureManifest();
    const receipt = attachReceipt(manifest, keys.privateKey);
    const parsed = parseOfficialIngest(
      ingestBody(manifest, { digest: receipt.digest, signature: receipt.signature }),
      { publicKey: null },
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.status).toBe(403);
  });
});

describe("stored receipt re-verify", () => {
  it("accepts Ed25519 rows with the published key and HMAC rows with the old secret", () => {
    const keys = generateEvalKeyPair();
    const manifest = fixtureManifest();
    const receipt = attachReceipt(manifest, keys.privateKey);
    const env = {
      VSARENA_RESULTS_ED25519_PUBLIC: keys.publicPem,
      HARNESS_INGEST_SECRET: HMAC_SECRET,
    };
    expect(verifyStoredReceipt(manifest, receipt, env)).toBe(true);
    expect(verifyStoredReceipt({ ...manifest, agent: "Eve" }, receipt, env)).toBe(false);

    const hmac = signRunManifest(manifest, HMAC_SECRET);
    expect(verifyStoredReceipt(manifest, { signature: hmac, alg: "hmac-sha256" }, env)).toBe(true);
    expect(verifyRunManifest(manifest, hmac, HMAC_SECRET)).toBe(true);
  });
});

describe("stable stringify", () => {
  it("sorts keys", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });
});

describe("legacy HMAC helper", () => {
  it("still verifies old hex receipts", () => {
    const manifest = fixtureManifest();
    const hmac = signRunManifest(manifest, HMAC_SECRET);
    expect(verifyRunManifest(manifest, hmac, HMAC_SECRET)).toBe(true);
    expect(verifyRunManifest({ ...manifest, agent: "Eve" }, hmac, HMAC_SECRET)).toBe(false);
  });
});
