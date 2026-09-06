/** Benign control arm: same policy, public canonical layout, no held-out / jitter. */

import type { FailureRecord } from "@/lib/eval/taxonomy";

export interface ControlArm {
  arm: "control";
  status: "completed" | "failed";
  task_completion_score: number;
  spatial_accuracy: number;
  failure: FailureRecord;
  scene: {
    set: "public";
    id: "public.canonical";
    seed: 0;
    hash: string;
  };
  /**
   * True when the official set was already public (local/dev). We did not run a
   * second episode; scores are copied so the row still has a control slot.
   */
  degenerate: boolean;
}

/**
 * Fail flag for rate math. Incomplete stacks and aborted matches both count.
 *
 * @example armFailed(0, "completed") // true
 */
export function armFailed(completion: number, status: "completed" | "failed"): boolean {
  return status === "failed" || completion < 1;
}

/**
 * Fail rate in [0, 1], or null when the series is empty.
 *
 * @example failRate([true, false]) // 0.5
 */
export function failRate(flags: boolean[]): number | null {
  if (flags.length === 0) return null;
  return flags.filter(Boolean).length / flags.length;
}

/**
 * Board cell: benign fail rate → scored fail rate.
 *
 * @example formatControlPair(0.04, 0.06) // "4% → 6%"
 */
export function formatControlPair(control: number | null, scored: number | null): string | null {
  if (control === null && scored === null) return null;
  const left = control === null ? "—" : `${Math.round(control * 100)}%`;
  const right = scored === null ? "—" : `${Math.round(scored * 100)}%`;
  return `${left} → ${right}`;
}

/**
 * Copy scored scores into the control slot when we did not run a second episode.
 *
 * @example degenerateControl(scored, publicHash)
 */
export function degenerateControl(input: {
  status: "completed" | "failed";
  task_completion_score: number;
  spatial_accuracy: number;
  failure: FailureRecord;
  hash: string;
}): ControlArm {
  return {
    arm: "control",
    status: input.status,
    task_completion_score: input.task_completion_score,
    spatial_accuracy: input.spatial_accuracy,
    failure: input.failure,
    scene: {
      set: "public",
      id: "public.canonical",
      seed: 0,
      hash: input.hash,
    },
    degenerate: true,
  };
}

/**
 * Skip the live control episode when the scored set is already the benign layout,
 * or when the operator sets VSARENA_SKIP_CONTROL=1 (local debug only).
 *
 * @example shouldRunLiveControl("held_out", env)
 */
export function shouldRunLiveControl(
  scoredSet: "public" | "held_out",
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if ((env.VSARENA_SKIP_CONTROL ?? "").trim() === "1") return false;
  return scoredSet === "held_out";
}
