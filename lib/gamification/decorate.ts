import { failRate } from "@/lib/eval/control";
import { officialSamplerSeed } from "@/lib/eval/sampler";
import { computeBadges, HOUSE_SLUG, STREAK_WINDOW_MS, type BadgeId } from "@/lib/gamification/badges";
import { parseAccent, parseAvatar, type AgentAccent, type AgentAvatar } from "@/lib/gamification/identity";

export interface MatchPulse {
  slug: string;
  at: string;
  stacked: boolean;
  signed?: boolean;
  scoredFailed?: boolean;
  /** null = no control recorded on that match */
  controlFailed?: boolean | null;
}

export interface DecoratedAgent {
  slug: string;
  name: string;
  elo: number;
  matches: number;
  status: "seed" | "live";
  description: string | null;
  tagline: string | null;
  accent: AgentAccent;
  avatarId: AgentAvatar;
  createdAt: string | null;
  weekMatches: number;
  lastMatchAt: string | null;
  stacked: boolean;
  badges: BadgeId[];
  /** Eval-window seed; same for every agent this ISO week. */
  samplerSeed: number;
  samplerSeedLabel: string;
  signed: boolean;
  controlFailRate: number | null;
  scoredFailRate: number | null;
}

interface DecorateInput {
  slug: string;
  name: string;
  elo: number;
  description?: string | null;
  tagline?: string | null;
  accent?: unknown;
  avatarId?: unknown;
  createdAt?: string | null;
}

/**
 * Attach week volume, stack flag, and harness badges. Rank is applied by the caller.
 *
 * @example decorateAgents(agents, pulses)
 */
export function decorateAgents(agents: DecorateInput[], pulses: MatchPulse[], now = Date.now()): DecoratedAgent[] {
  const houseElo = agents.find((agent) => agent.slug === HOUSE_SLUG)?.elo ?? 1200;
  const bySlug = new Map<string, MatchPulse[]>();
  for (const pulse of pulses) {
    const list = bySlug.get(pulse.slug) ?? [];
    list.push(pulse);
    bySlug.set(pulse.slug, list);
  }

  return agents.map((agent) => {
    const history = bySlug.get(agent.slug) ?? [];
    const matches = history.length;
    const weekMatches = history.filter((pulse) => {
      const t = Date.parse(pulse.at);
      return !Number.isNaN(t) && now - t <= STREAK_WINDOW_MS;
    }).length;
    const lastMatchAt = history.reduce<string | null>((latest, pulse) => {
      if (!latest || pulse.at > latest) return pulse.at;
      return latest;
    }, null);
    const stacked = history.some((pulse) => pulse.stacked);
    const createdAt = agent.createdAt ?? null;
    const isHouse = agent.slug === HOUSE_SLUG;
    const tagline = agent.tagline?.trim() ? agent.tagline.trim() : isHouse ? "House geometry seed. Not a VLA." : null;
    const accentRaw = agent.accent != null && String(agent.accent).length > 0 ? agent.accent : isHouse ? "orange" : "cyan";
    const latest = history.reduce<MatchPulse | null>((best, pulse) => {
      if (!best || pulse.at > best.at) return pulse;
      return best;
    }, null);
    const windowSeed = officialSamplerSeed(new Date(now));
    const samplerSeed = windowSeed.seed;
    const controlFlags = history
      .map((pulse) => pulse.controlFailed)
      .filter((flag): flag is boolean => flag === true || flag === false);
    const scoredFlags = history
      .map((pulse) => pulse.scoredFailed)
      .filter((flag): flag is boolean => flag === true || flag === false);
    return {
      slug: agent.slug,
      name: agent.name,
      elo: agent.elo,
      matches,
      status: matches > 0 ? "live" : "seed",
      description: agent.description?.trim() ? agent.description.trim() : null,
      tagline,
      accent: parseAccent(accentRaw),
      avatarId: parseAvatar(agent.avatarId),
      createdAt,
      weekMatches,
      lastMatchAt,
      stacked,
      badges: computeBadges({
        slug: agent.slug,
        matches,
        weekMatches,
        elo: agent.elo,
        houseElo,
        stacked,
      }),
      samplerSeed,
      samplerSeedLabel: windowSeed.window,
      signed: latest?.signed === true,
      controlFailRate: failRate(controlFlags),
      scoredFailRate: failRate(scoredFlags),
    };
  });
}
