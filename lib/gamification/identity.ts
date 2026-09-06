export const AGENT_ACCENTS = ["cyan", "orange", "magenta", "white"] as const;
export type AgentAccent = (typeof AGENT_ACCENTS)[number];

export const AGENT_AVATARS = ["cobot", "cube", "eye", "stack"] as const;
export type AgentAvatar = (typeof AGENT_AVATARS)[number];

export const ACCENT_HEX: Record<AgentAccent, string> = {
  cyan: "#00AEEF",
  orange: "#F7941E",
  magenta: "#E11D8F",
  white: "#e8edf4",
};

export const TAGLINE_MAX = 80;

/**
 * Accent token from a stored string. Unknown values fall back to cyan.
 *
 * @example parseAccent("orange")
 */
export function parseAccent(value: unknown): AgentAccent {
  return AGENT_ACCENTS.includes(value as AgentAccent) ? (value as AgentAccent) : "cyan";
}

/**
 * Avatar token from a stored string. Unknown values fall back to cobot.
 *
 * @example parseAvatar("eye")
 */
export function parseAvatar(value: unknown): AgentAvatar {
  return AGENT_AVATARS.includes(value as AgentAvatar) ? (value as AgentAvatar) : "cobot";
}

/**
 * Clamp a public tagline. Empty becomes null.
 *
 * @example parseTagline("  stack or bust  ")
 */
export function parseTagline(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const next = value.trim().slice(0, TAGLINE_MAX);
  return next.length > 0 ? next : null;
}
