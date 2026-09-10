// Assumption: Next app is reachable from this process (local: http://127.0.0.1:3000).

import type { HighlightRun } from "../lib/eval/highlights";

/**
 * POST a scored-run highlight. Served to Studio live only after the eval week rotates.
 *
 * @example await ingestHighlight(run)
 */
export async function ingestHighlight(run: HighlightRun): Promise<void> {
  const secret = (process.env.HARNESS_INGEST_SECRET ?? "").trim();
  const base = (process.env.VSARENA_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  if (secret.length < 16) return;
  if (run.samples.length === 0) return;
  try {
    const res = await fetch(`${base}/api/highlights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vsarena-ingest": secret,
      },
      body: JSON.stringify(run),
    });
    if (!res.ok) {
      console.error("[vsarena-harness] highlight ingest failed", res.status, await res.text());
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "highlight ingest failed";
    console.error("[vsarena-harness] highlight ingest error", message);
  }
}

/**
 * Previous-week reel from the Next app. Empty until the first rotation.
 *
 * @example await fetchPublicHighlights()
 */
export async function fetchPublicHighlights(): Promise<HighlightRun[]> {
  const base = (process.env.VSARENA_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/highlights`, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const body = (await res.json()) as { runs?: HighlightRun[] };
    return Array.isArray(body.runs) ? body.runs : [];
  } catch {
    return [];
  }
}
