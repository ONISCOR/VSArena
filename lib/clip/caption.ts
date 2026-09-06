import type { ResultMessage } from "@/lib/harness/protocol";
import { CLIP_FORMATS, type ClipFormatId } from "@/lib/clip/formats";
import { STUDIO_VERSION } from "@/lib/eval/product";

/**
 * Caption ready to paste under the clip.
 *
 * @example buildClipCaption({ agent: "Baseline-IK", result, format: "reels" })
 */
export function buildClipCaption(input: {
  agent: string;
  format: ClipFormatId;
  result: ResultMessage | null;
}): string {
  const { platforms } = CLIP_FORMATS[input.format];
  const lines = [`${input.agent} · block stacking · VSArena Studio v${STUDIO_VERSION}`];
  if (input.result) {
    const { spatial_accuracy, task_completion_score } = input.result.scores;
    const elo = input.result.elo_delta;
    const eloStr = elo >= 0 ? `+${elo}` : String(elo);
    lines.push(
      `Complete ${task_completion_score.toFixed(3)} · Spatial ${spatial_accuracy.toFixed(3)} · ELO ${eloStr}`,
    );
  }
  lines.push(`ONISCOR · ${platforms}`);
  lines.push("#VSArena");
  return lines.join("\n");
}
