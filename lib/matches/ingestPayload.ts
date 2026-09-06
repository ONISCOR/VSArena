/** Verify an official harness result before it can write ELO. */

import type { ControlArm } from "@/lib/eval/control";
import {
  buildRunManifest,
  resultsSigningSecret,
  verifyRunManifest,
  type RunManifest,
} from "@/lib/eval/manifest";
import type { EvalProvenance } from "@/lib/eval/provenance";
import { packOfficialTelemetry } from "@/lib/eval/storedEval";
import type { FailureRecord } from "@/lib/eval/taxonomy";
import type { StoredMatch } from "@/lib/matches/memory";

export type IngestReject = { ok: false; status: 400 | 403; error: string };
export type IngestAccept = {
  ok: true;
  entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & { agent: string };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asFinite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Parse + verify signature. Unsigned or tampered payloads never reach recordMatch.
 *
 * @example parseOfficialIngest(body, resultsSigningSecret())
 */
export function parseOfficialIngest(body: unknown, secret: string): IngestReject | IngestAccept {
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
  const signature = typeof row.signature === "string" ? row.signature : "";
  const failure = row.failure as FailureRecord | undefined;
  const provenance = row.provenance as EvalProvenance | undefined;
  const control = (row.control ?? null) as ControlArm | null;
  if (samplerSeed === null || !failure || !provenance) {
    return { ok: false, status: 400, error: "result missing sampler_seed, failure, or provenance" };
  }
  if (secret.length < 16) {
    return { ok: false, status: 403, error: "results signing key missing" };
  }
  if (!signature) {
    return { ok: false, status: 400, error: "unsigned result" };
  }

  const manifest: RunManifest = buildRunManifest({
    match_id: row.match_id,
    agent: row.agent.trim(),
    status: row.status,
    scores: {
      spatial_accuracy: spatial,
      task_completion_score: completion,
      joint_torque_telemetry: { peak, avg },
    },
    sampler_seed: samplerSeed >>> 0,
    failure,
    provenance,
    control,
  });
  if (!verifyRunManifest(manifest, signature, secret)) {
    return { ok: false, status: 403, error: "invalid result signature" };
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
          signature,
        }),
      },
      agent: row.agent.trim(),
      failure,
      provenance,
      control: control ?? undefined,
      signature,
    },
  };
}

export { resultsSigningSecret };
