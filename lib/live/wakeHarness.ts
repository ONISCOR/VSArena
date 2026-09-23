/** Wake / probe the official harness. Read-only — never starts a scored match. */

import { harnessHealthUrl } from "@/lib/live/harnessWs";

export type HarnessProbeStatus = "ready" | "busy" | "unreachable";

export interface HarnessHealthSnapshot {
  status: HarnessProbeStatus;
  ok: boolean;
  busy: boolean;
  queue: number;
  evalWindow: string | null;
  product: string | null;
  /** Milliseconds spent probing (incl. cold-start waits). */
  elapsedMs: number;
}

export interface WakeHarnessOptions {
  /** Total budget for cold-start polls. Default 90s. */
  timeoutMs?: number;
  /** Delay between polls. Default 2.5s. */
  intervalMs?: number;
  /** Injectable fetch (tests). */
  fetchImpl?: typeof fetch;
  /** Injectable clock. */
  now?: () => number;
  /** Injectable sleep. */
  sleep?: (ms: number) => Promise<void>;
}

interface HealthJson {
  ok?: boolean;
  busy?: boolean;
  queue?: number;
  eval?: { eval_window?: string; product?: string };
}

/**
 * Parse a /health JSON body. Unknown shapes → unreachable.
 */
export function parseHarnessHealth(body: unknown, elapsedMs: number): HarnessHealthSnapshot {
  if (!body || typeof body !== "object") {
    return {
      status: "unreachable",
      ok: false,
      busy: false,
      queue: 0,
      evalWindow: null,
      product: null,
      elapsedMs,
    };
  }
  const j = body as HealthJson;
  const ok = j.ok === true;
  const busy = j.busy === true;
  const queue = typeof j.queue === "number" && Number.isFinite(j.queue) ? j.queue : 0;
  const evalWindow =
    typeof j.eval?.eval_window === "string" && j.eval.eval_window.length > 0
      ? j.eval.eval_window
      : null;
  const product =
    typeof j.eval?.product === "string" && j.eval.product.length > 0 ? j.eval.product : null;
  if (!ok) {
    return {
      status: "unreachable",
      ok: false,
      busy: false,
      queue: 0,
      evalWindow,
      product,
      elapsedMs,
    };
  }
  return {
    status: busy ? "busy" : "ready",
    ok: true,
    busy,
    queue,
    evalWindow,
    product,
    elapsedMs,
  };
}

/**
 * GET /health until the official harness answers (wakes Render cold starts).
 *
 * Integrity boundary:
 * - Only HTTP GET /health (CORS-open on harness).
 * - Does **not** open an agent WebSocket, send `hello`, or POST ingest.
 * - Does **not** write ELO. Scored matches still require the Python SDK + harness.
 */
export async function wakeOfficialHarness(
  options: WakeHarnessOptions = {},
): Promise<HarnessHealthSnapshot> {
  const timeoutMs = options.timeoutMs ?? 90_000;
  const intervalMs = options.intervalMs ?? 2_500;
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => Date.now());
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  const started = now();
  const url = harnessHealthUrl();
  let last: HarnessHealthSnapshot = {
    status: "unreachable",
    ok: false,
    busy: false,
    queue: 0,
    evalWindow: null,
    product: null,
    elapsedMs: 0,
  };

  while (now() - started <= timeoutMs) {
    const elapsedMs = now() - started;
    try {
      const res = await fetchImpl(url, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
      });
      if (res.ok) {
        const json: unknown = await res.json();
        last = parseHarnessHealth(json, elapsedMs);
        if (last.ok) return last;
      } else {
        last = { ...last, status: "unreachable", ok: false, elapsedMs };
      }
    } catch {
      last = { ...last, status: "unreachable", ok: false, elapsedMs };
    }
    if (now() - started + intervalMs > timeoutMs) break;
    await sleep(intervalMs);
  }

  return { ...last, elapsedMs: now() - started };
}
