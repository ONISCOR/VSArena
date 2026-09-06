import {
  getAgent as getAgentMemory,
  listLeaderboard as listLeaderboardMemory,
  listMatches as listMatchesMemory,
  listMatchesForAgent as listMatchesForAgentMemory,
  recordMatch as recordMatchMemory,
  updateAgentLook as updateAgentLookMemory,
  type ArenaAgent,
  type StoredMatch,
} from "@/lib/matches/memory";
import { hasServiceRole } from "@/lib/supabase/env";
import {
  getAgentPostgres,
  listLeaderboardPostgres,
  listMatchesForAgentPostgres,
  listMatchesPostgres,
  recordMatchPostgres,
  updateAgentLookPostgres,
} from "@/lib/matches/postgres";
import type { AgentAccent, AgentAvatar } from "@/lib/gamification/identity";

export type { ArenaAgent, StoredMatch };

function logFallback(scope: string, error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);
  console.error(`[matches] ${scope} falling back to memory:`, message);
}

/**
 * Record a scored match. Prefers Postgres (service role); RAM if keys/tables fail.
 *
 * @example await recordMatch({ agent: "Baseline-IK", ...result })
 */
export async function recordMatch(
  entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & { agent: string },
): Promise<StoredMatch> {
  if (hasServiceRole()) {
    try {
      return await recordMatchPostgres(entry);
    } catch (error) {
      logFallback("recordMatch", error);
    }
  }
  return recordMatchMemory(entry);
}

export async function listMatches(): Promise<StoredMatch[]> {
  if (hasServiceRole()) {
    try {
      return await listMatchesPostgres();
    } catch (error) {
      logFallback("listMatches", error);
    }
  }
  return listMatchesMemory();
}

export async function listMatchesForAgent(slug: string): Promise<StoredMatch[]> {
  if (hasServiceRole()) {
    try {
      return await listMatchesForAgentPostgres(slug);
    } catch (error) {
      logFallback("listMatchesForAgent", error);
    }
  }
  return listMatchesForAgentMemory(slug);
}

export async function getAgent(slug: string): Promise<ArenaAgent | undefined> {
  if (hasServiceRole()) {
    try {
      return await getAgentPostgres(slug);
    } catch (error) {
      logFallback("getAgent", error);
    }
  }
  return getAgentMemory(slug);
}

/**
 * Ranked leaderboard. Postgres when the service role is set.
 *
 * @example const rows = await listLeaderboard()
 */
export async function listLeaderboard(): Promise<Array<ArenaAgent & { rank: number }>> {
  if (hasServiceRole()) {
    try {
      return await listLeaderboardPostgres();
    } catch (error) {
      logFallback("listLeaderboard", error);
    }
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
      logFallback("updateAgentLook", error);
    }
  }
  updateAgentLookMemory(slug, patch);
  return getAgentMemory(slug);
}
