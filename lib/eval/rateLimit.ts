/** Official match rate limits — one agent, one ISO eval window. */

export const OFFICIAL_MATCHES_PER_AGENT_WINDOW = 24;

/**
 * Stable key for in-process rate accounting.
 */
export function rateLimitKey(profileId: string, agentName: string, evalWindow: string): string {
  return `${profileId}\u0000${agentName.trim()}\u0000${evalWindow}`;
}

/**
 * Increment and check a Map-backed counter. Returns ok:false when the limit is already reached.
 */
export function checkAndBumpRateLimit(
  store: Map<string, number>,
  key: string,
  limit: number = OFFICIAL_MATCHES_PER_AGENT_WINDOW,
): { ok: true; count: number; remaining: number } | { ok: false; count: number; limit: number } {
  const count = store.get(key) ?? 0;
  if (count >= limit) {
    return { ok: false, count, limit };
  }
  const next = count + 1;
  store.set(key, next);
  return { ok: true, count: next, remaining: limit - next };
}

/**
 * Monday 00:00 UTC of the ISO week encoded as `YYYY-Www`.
 */
export function evalWindowStartUtc(window: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(window.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) return null;
  // ISO: week 1 contains the year's first Thursday. Monday of that week:
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const start = new Date(mondayWeek1);
  start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}
