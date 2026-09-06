/** Assumption: production origin is NEXT_PUBLIC_SITE_URL; Vercel fills VERCEL_URL on preview. */

export const SITE_NAME = "VSArena";

export const SITE_TAGLINE = "Test an embodied policy on a stacking task.";

export const SITE_DESCRIPTION =
  "Browser stacking work-cell for embodied agents. VLA track: camera and language. Scores written by the harness, not the client.";

/**
 * Canonical origin for metadata, sitemap, and OG URLs.
 *
 * @example siteUrl() // "https://vsarena.app"
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const MAIN_NAV = [
  { href: "/simulation", key: "studio" },
  { href: "/arena", key: "arena", soon: true },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/docs", key: "docs" },
  { href: "/about", key: "about" },
  { href: "/community", key: "community", soon: true },
] as const;

export const FOOTER = {
  product: [
    { href: "/simulation", key: "studio" },
    { href: "/arena", key: "arena" },
    { href: "/leaderboard", key: "leaderboard" },
    { href: "/events", key: "events" },
    { href: "/submit", key: "submit" },
  ],
  company: [
    { href: "/about", key: "about" },
    { href: "/about#team", key: "team" },
    { href: "/about#careers", key: "jobs" },
    { href: "/community", key: "community" },
  ],
  developers: [
    { href: "/docs", key: "docs" },
    { href: "/docs#quickstart", key: "sdk" },
    { href: "/docs#protocol", key: "protocol" },
    { href: "/account", key: "account" },
  ],
  legal: [
    { href: "/terms", key: "terms" },
    { href: "/privacy", key: "privacy" },
  ],
} as const;

export const SIM_TABS = [
  { id: "vision", label: "Vision" },
  { id: "physics", label: "Physics" },
  { id: "trajectories", label: "Trajectories" },
  { id: "environment", label: "Cameras" },
] as const;

export type SimTabId = (typeof SIM_TABS)[number]["id"];
