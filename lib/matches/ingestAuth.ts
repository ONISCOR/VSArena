/** Assumption: ingest secret is server-only; never NEXT_PUBLIC. Min 16 chars so empty-dev cannot brute a short key. */

/**
 * Shared secret the standalone harness sends as `x-vsarena-ingest`.
 */
export function harnessIngestSecret(): string {
  return (process.env.HARNESS_INGEST_SECRET ?? "").trim();
}

/**
 * True when leaderboard writes from the harness are enabled.
 */
export function ingestConfigured(): boolean {
  return harnessIngestSecret().length >= 16;
}

/**
 * Constant-time-ish compare of the ingest header. Not a substitute for TLS.
 */
export function requestHasIngestSecret(request: Request): boolean {
  const expected = harnessIngestSecret();
  if (expected.length < 16) return false;
  const got = (request.headers.get("x-vsarena-ingest") ?? "").trim();
  if (got.length !== expected.length) return false;
  let mix = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mix |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mix === 0;
}
