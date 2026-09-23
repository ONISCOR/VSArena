/** Wall-clock episode timing for provenance and replay trails. */

export function episodeTiming(
  started?: number,
  ended?: number,
): {
  started_at_ms?: number;
  ended_at_ms?: number;
  duration_ms?: number;
} {
  const out: {
    started_at_ms?: number;
    ended_at_ms?: number;
    duration_ms?: number;
  } = {};
  if (typeof started === "number" && Number.isFinite(started)) {
    out.started_at_ms = Math.round(started);
  }
  if (typeof ended === "number" && Number.isFinite(ended)) {
    out.ended_at_ms = Math.round(ended);
  }
  if (
    out.started_at_ms !== undefined &&
    out.ended_at_ms !== undefined &&
    out.ended_at_ms >= out.started_at_ms
  ) {
    out.duration_ms = out.ended_at_ms - out.started_at_ms;
  }
  return out;
}
