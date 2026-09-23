/** Browser → hosted harness. Assumption: public Render URL; override with NEXT_PUBLIC_HARNESS_WS_URL. */

const DEFAULT_HARNESS_WS = "wss://vsarena-harness.onrender.com";

/**
 * Base WebSocket origin for the official harness (no path).
 */
export function harnessWsBase(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_HARNESS_WS_URL ?? "").trim().replace(/\/$/, "");
  return fromEnv || DEFAULT_HARNESS_WS;
}

/**
 * Read-only spectator socket.
 */
export function harnessSpectateUrl(): string {
  return `${harnessWsBase()}/spectate`;
}

/**
 * HTTP health on the same host (wss → https, ws → http).
 */
export function harnessHealthUrl(): string {
  const base = harnessWsBase();
  if (base.startsWith("wss://")) return `https://${base.slice("wss://".length)}/health`;
  if (base.startsWith("ws://")) return `http://${base.slice("ws://".length)}/health`;
  return `${base}/health`;
}
