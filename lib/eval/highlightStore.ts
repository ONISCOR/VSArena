/** Memory + Postgres store for weekly highlight reels. */

import {
  publicHighlightFeed,
  rankHighlights,
  type HighlightFeed,
  type HighlightRun,
} from "@/lib/eval/highlights";
import { hasServiceRole } from "@/lib/supabase/env";
import { createAdminSupabase } from "@/lib/supabase/admin";

const memory: HighlightRun[] = [];

function isMissingRelation(error: { message?: string; code?: string } | null): boolean {
  const message = (error?.message ?? "").toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    error?.code === "42P01" ||
    error?.code === "PGRST205"
  );
}

/**
 * Upsert a scored-run highlight. Current-week rows stay stored; GET will not serve them yet.
 *
 * @example await recordHighlight(run)
 */
export async function recordHighlight(run: HighlightRun): Promise<void> {
  const sameWindow = memory.filter((row) => row.eval_window === run.eval_window);
  const others = memory.filter((row) => row.eval_window !== run.eval_window);
  memory.splice(0, memory.length, ...others, ...rankHighlights(sameWindow, run));

  if (!hasServiceRole()) return;
  try {
    const admin = createAdminSupabase();
    const { error } = await admin.from("eval_highlights").upsert(
      {
        match_id: run.match_id,
        agent: run.agent,
        eval_window: run.eval_window,
        sampler_seed: run.sampler_seed,
        mode: run.mode,
        spatial_accuracy: run.scores.spatial_accuracy,
        task_completion_score: run.scores.task_completion_score,
        samples: run.samples,
      },
      { onConflict: "match_id" },
    );
    if (error) {
      if (!isMissingRelation(error)) console.error("[highlights] upsert failed", error.message);
      return;
    }
    const listed = await admin
      .from("eval_highlights")
      .select("match_id, spatial_accuracy, task_completion_score")
      .eq("eval_window", run.eval_window)
      .order("task_completion_score", { ascending: false })
      .order("spatial_accuracy", { ascending: false });
    if (listed.error || !listed.data || listed.data.length <= 8) return;
    const drop = listed.data.slice(8).map((row) => row.match_id as string);
    if (drop.length > 0) {
      await admin.from("eval_highlights").delete().in("match_id", drop);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "highlight upsert failed";
    console.error("[highlights] upsert error", message);
  }
}

function rowToRun(row: Record<string, unknown>): HighlightRun | null {
  const samples = Array.isArray(row.samples) ? row.samples : [];
  if (typeof row.match_id !== "string" || typeof row.agent !== "string") return null;
  if (typeof row.eval_window !== "string") return null;
  if (row.mode !== "vla" && row.mode !== "state") return null;
  const seed = typeof row.sampler_seed === "number" ? row.sampler_seed : Number(row.sampler_seed);
  const spatial = typeof row.spatial_accuracy === "number" ? row.spatial_accuracy : Number(row.spatial_accuracy);
  const task =
    typeof row.task_completion_score === "number" ? row.task_completion_score : Number(row.task_completion_score);
  if (!Number.isFinite(seed) || !Number.isFinite(spatial) || !Number.isFinite(task)) return null;
  return {
    match_id: row.match_id,
    agent: row.agent,
    eval_window: row.eval_window,
    sampler_seed: seed >>> 0,
    mode: row.mode,
    scores: { spatial_accuracy: spatial, task_completion_score: task },
    samples: samples as HighlightRun["samples"],
  };
}

/**
 * Public reel for Studio live. Never includes the current eval window.
 *
 * @example await listPublicHighlights()
 */
export async function listPublicHighlights(at: Date = new Date()): Promise<HighlightFeed> {
  if (hasServiceRole()) {
    try {
      const admin = createAdminSupabase();
      const { data, error } = await admin
        .from("eval_highlights")
        .select(
          "match_id, agent, eval_window, sampler_seed, mode, spatial_accuracy, task_completion_score, samples",
        );
      if (!error && data) {
        const runs = data.map((row) => rowToRun(row as Record<string, unknown>)).filter((row): row is HighlightRun => Boolean(row));
        return publicHighlightFeed(runs, at);
      }
      if (error && !isMissingRelation(error)) {
        console.error("[highlights] list failed", error.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "highlight list failed";
      console.error("[highlights] list error", message);
    }
  }
  return publicHighlightFeed(memory, at);
}
