import {
  getAgent as getAgentMemory,
  listLeaderboard as listLeaderboardMemory,
  listMatches as listMatchesMemory,
  listMatchesForAgent as listMatchesForAgentMemory,
  getMatch as getMatchMemory,
  recordMatch as recordMatchMemory,
  updateAgentLook as updateAgentLookMemory,
  agentSlug,
  type ArenaAgent,
  type StoredMatch,
} from "@/lib/matches/memory";
import { hasServiceRole } from "@/lib/supabase/env";
import {
  getAgentPostgres,
  getMatchPostgres,
  listLeaderboardPostgres,
  listMatchesForAgentPostgres,
  listMatchesForAgentsPostgres,
  listMatchesPostgres,
  recordMatchPostgres,
  updateAgentLookPostgres,
} from "@/lib/matches/postgres";
import { isAgentOwnershipError, isOfficialIngestError, isRateLimitError } from "@/lib/matches/errors";
import type { AgentAccent, AgentAvatar } from "@/lib/gamification/identity";

export type { ArenaAgent, StoredMatch };

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function logFallback(scope: string, error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);
  console.error(`[matches] ${scope} falling back to memory:`, message);
}

function rethrowOrFallback(scope: string, error: unknown): never | void {
  if (isAgentOwnershipError(error) || isRateLimitError(error) || isOfficialIngestError(error)) {
    throw error;
  }
  if (isProduction()) {
    console.error(`[matches] ${scope} failed closed (production):`, error);
    throw error instanceof Error ? error : new Error(String(error));
  }
  logFallback(scope, error);
}

/**
 * Record a scored match. Prefers Postgres (service role).
 * Production never falls back to RAM. Ownership / rate-limit never fall back.
 */
export async function recordMatch(
  entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & {
    agent: string;
    owner_id: string;
  },
): Promise<StoredMatch> {
  if (hasServiceRole()) {
    try {
      return await recordMatchPostgres(entry);
    } catch (error) {
      rethrowOrFallback("recordMatch", error);
    }
  } else if (isProduction()) {
    throw new Error("matches store misconfigured: service role required in production");
  }
  return recordMatchMemory(entry);
}

export async function listMatches(): Promise<StoredMatch[]> {
  if (hasServiceRole()) {
    try {
      return await listMatchesPostgres();
    } catch (error) {
      rethrowOrFallback("listMatches", error);
    }
  } else if (isProduction()) {
    throw new Error("matches store misconfigured: service role required in production");
  }
  return listMatchesMemory();
}

export async function listMatchesForAgent(slug: string): Promise<StoredMatch[]> {
  if (hasServiceRole()) {
    try {
      return await listMatchesForAgentPostgres(slug);
    } catch (error) {
      rethrowOrFallback("listMatchesForAgent", error);
    }
  } else if (isProduction()) {
    throw new Error("matches store misconfigured: service role required in production");
  }
  return listMatchesForAgentMemory(slug);
}

/**
 * Fetch one official match by id (public read).
 */
export async function getMatch(matchId: string): Promise<StoredMatch | undefined> {
  if (!matchId.trim()) return undefined;
  if (hasServiceRole()) {
    try {
      return await getMatchPostgres(matchId);
    } catch (error) {
      rethrowOrFallback("getMatch", error);
    }
  } else if (isProduction()) {
    throw new Error("matches store misconfigured: service role required in production");
  }
  return getMatchMemory(matchId);
}

export async function listMatchesForAgents(
  agents: Array<{ id: string; name: string }>,
): Promise<StoredMatch[]> {
  if (agents.length === 0) return [];
  if (hasServiceRole()) {
    try {
      return await listMatchesForAgentsPostgres(agents);
    } catch (error) {
      rethrowOrFallback("listMatchesForAgents", error);
    }
  } else if (isProduction()) {
    throw new Error("matches store misconfigured: service role required in production");
  }
  const slugs = new Set(agents.map((agent) => agentSlug(agent.name)));
  return listMatchesMemory().filter((match) => slugs.has(match.agent_slug));
}

export async function getAgent(slug: string): Promise<ArenaAgent | undefined> {
  if (hasServiceRole()) {
    try {
      return await getAgentPostgres(slug);
    } catch (error) {
      rethrowOrFallback("getAgent", error);
    }
  } else if (isProduction()) {
    throw new Error("matches store misconfigured: service role required in production");
  }
  return getAgentMemory(slug);
}

/**
 * Ranked leaderboard. Postgres when the service role is set.
 */
export async function listLeaderboard(): Promise<Array<ArenaAgent & { rank: number }>> {
  if (hasServiceRole()) {
    try {
      return await listLeaderboardPostgres();
    } catch (error) {
      rethrowOrFallback("listLeaderboard", error);
    }
  } else if (isProduction()) {
    throw new Error("matches store misconfigured: service role required in production");
  }
  return listLeaderboardMemory();
}

export async function updateAgentLook(
  ownerId: string | null,
  slug: string,
  patch: { tagline: string | null; accent: AgentAccent; avatarId: AgentAvatar },
): Promise<ArenaAgent | undefined> {
  if (hasServiceRole() && ownerId) {
    try {
      const updated = await updateAgentLookPostgres(ownerId, slug, patch);
      return updated ?? undefined;
    } catch (error) {
      rethrowOrFallback("updateAgentLook", error);
    }
  } else if (isProduction() && hasServiceRole()) {
    throw new Error("matches store misconfigured");
  }
  updateAgentLookMemory(slug, patch);
  return getAgentMemory(slug);
}
