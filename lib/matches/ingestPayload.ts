/** Verify an official harness result before it can write ELO. */

import type { ControlArm } from "@/lib/eval/control";
import { buildRunManifest, type RunManifest } from "@/lib/eval/manifest";
import {
  RECEIPT_ALG,
  asPublicKey,
  resultsEd25519Public,
  verifyDigest,
  verifyManifestDsse,
} from "@/lib/eval/receipt";
import type { EvalProvenance } from "@/lib/eval/provenance";
import { hydrateReplayArtifact, parseStoredReplayTrail } from "@/lib/eval/replay";
import { packOfficialTelemetry } from "@/lib/eval/storedEval";
import type { FailureRecord } from "@/lib/eval/taxonomy";
import type { StoredMatch } from "@/lib/matches/memory";
import type { KeyObject } from "node:crypto";

export type IngestReject = { ok: false; status: 400 | 403; error: string };
export type IngestAccept = {
  ok: true;
  entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & {
    agent: string;
    owner_id: string;
  };
};

export interface IngestVerify {
  publicKey?: KeyObject | string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asFinite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Parse + verify digest and Ed25519 DSSE. Replay is optional and unsigned. */
export function parseOfficialIngest(body: unknown, options: IngestVerify = {}): IngestReject | IngestAccept {
  const row = asRecord(body);
  if (!row) return { ok: false, status: 400, error: "invalid result payload" };
  if (row.type !== "result" || typeof row.match_id !== "string" || !row.match_id) {
    return { ok: false, status: 400, error: "invalid result payload" };
  }
  if (row.status !== "completed" && row.status !== "failed") {
    return { ok: false, status: 400, error: "invalid result payload" };
  }
  if (typeof row.agent !== "string" || !row.agent.trim()) {
    return { ok: false, status: 400, error: "invalid result payload" };
  }
  if (typeof row.owner_id !== "string" || !isUuid(row.owner_id)) {
    return { ok: false, status: 400, error: "result missing owner_id" };
  }
  const ownerId = row.owner_id;
  const scores = asRecord(row.scores);
  const torque = asRecord(scores?.joint_torque_telemetry);
  const spatial = asFinite(scores?.spatial_accuracy);
  const completion = asFinite(scores?.task_completion_score);
  const peak = asFinite(torque?.peak);
  const avg = asFinite(torque?.avg);
  if (spatial === null || completion === null || peak === null || avg === null) {
    return { ok: false, status: 400, error: "invalid result payload" };
  }
  const samplerSeed = asFinite(row.sampler_seed);
  const digest = typeof row.digest === "string" ? row.digest : "";
  const signature = typeof row.signature === "string" ? row.signature : "";
  const failure = row.failure as FailureRecord | undefined;
  const provenance = row.provenance as EvalProvenance | undefined;
  const control = (row.control ?? null) as ControlArm | null;
  if (samplerSeed === null || !failure || !provenance) {
    return { ok: false, status: 400, error: "result missing sampler_seed, failure, or provenance" };
  }

  const replayTrail = row.replay == null ? null : parseStoredReplayTrail(row.replay);
  const scoreBlock = {
    spatial_accuracy: spatial,
    task_completion_score: completion,
    joint_torque_telemetry: { peak, avg },
  };

  const manifest: RunManifest = buildRunManifest({
    match_id: row.match_id,
    agent: row.agent.trim(),
    status: row.status,
    scores: scoreBlock,
    sampler_seed: samplerSeed >>> 0,
    failure,
    provenance,
    control,
  });

  if (!digest) {
    return { ok: false, status: 400, error: "result missing digest" };
  }
  if (!verifyDigest(manifest, digest)) {
    return { ok: false, status: 403, error: "invalid result digest" };
  }
  if (!signature) {
    return { ok: false, status: 400, error: "unsigned result" };
  }

  const publicKey =
    options.publicKey === undefined ? resultsEd25519Public() : asPublicKey(options.publicKey);
  if (!publicKey) {
    return { ok: false, status: 403, error: "results public key missing" };
  }
  if (!verifyManifestDsse(manifest, signature, publicKey)) {
    return { ok: false, status: 403, error: "invalid result signature" };
  }
  if (provenance.observation_mode && provenance.observation_mode !== "vla") {
    return { ok: false, status: 400, error: "only the VLA observation track may write public ELO" };
  }

  return {
    ok: true,
    entry: {
      type: "result",
      match_id: row.match_id,
      status: row.status,
      scores: {
        spatial_accuracy: spatial,
        task_completion_score: completion,
        joint_torque_telemetry: packOfficialTelemetry({
          peak,
          avg,
          failure,
          provenance,
          samplerSeed: samplerSeed >>> 0,
          control,
          replay: replayTrail,
          digest,
          signature,
          alg: RECEIPT_ALG,
        }),
      },
      agent: row.agent.trim(),
      owner_id: ownerId,
      failure,
      provenance,
      control: control ?? undefined,
      digest,
      signature,
      replay: replayTrail
        ? hydrateReplayArtifact(replayTrail, {
            matchId: row.match_id,
            agent: row.agent.trim(),
            provenance,
            failure,
            scores: scoreBlock,
            status: row.status,
          })
        : undefined,
    },
  };
}

export { resultsEd25519Public };
