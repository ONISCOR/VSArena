// In-memory match store for local/dev when Postgres is unset.

import { armFailed } from "@/lib/eval/control";
import type { ResultMessage } from "@/lib/harness/protocol";
import { decorateAgents, type DecoratedAgent } from "@/lib/gamification/decorate";
import { eloDelta, eloOutcome } from "@/lib/scoring/elo";
import { isPublicLeaderboardAgent } from "@/lib/matches/placeholders";
import type { AgentAccent, AgentAvatar } from "@/lib/gamification/identity";

export type ArenaAgent = DecoratedAgent;

export interface StoredMatch extends ResultMessage {
  agent: string;
  agent_slug: string;
  stored_at: string;
}

interface AgentSeed {
  slug: string;
  name: string;
  elo: number;
  description: string | null;
  tagline: string | null;
  accent: AgentAccent;
  avatarId: AgentAvatar;
  createdAt: string;
}

const MAX = 80;

const agents: AgentSeed[] = [
  {
    slug: "baseline-ik",
    name: "Baseline-IK",
    elo: 1200,
    description: "Geometric inverse-kinematics reference (state track, not a VLA).",
    tagline: "House geometry seed. Not a VLA.",
    accent: "orange",
    avatarId: "cobot",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const matches: StoredMatch[] = [];

/**
 * URL slug from an agent display name.
 */
export function agentSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureAgent(name: string): AgentSeed {
  const slug = agentSlug(name);
  const existing = agents.find((agent) => agent.slug === slug);
  if (existing) return existing;
  const created: AgentSeed = {
    slug,
    name,
    elo: 1200,
    description: null,
    tagline: null,
    accent: "cyan",
    avatarId: "cobot",
    createdAt: new Date().toISOString(),
  };
  agents.push(created);
  return created;
}

function snapshot(): ArenaAgent[] {
  return decorateAgents(
    agents,
    matches.map((match) => ({
      slug: match.agent_slug,
      at: match.stored_at,
      stacked: match.status === "completed" && match.scores.task_completion_score >= 1,
      signed: Boolean(match.signature),
      scoredFailed: armFailed(match.scores.task_completion_score, match.status),
      controlFailed: match.control
        ? armFailed(match.control.task_completion_score, match.control.status)
        : null,
    })),
  );
}

/**
 * Store a match and update the agent's ELO vs the task (rating 1200).
 */
export function recordMatch(
  entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & {
    agent: string;
    owner_id?: string;
  },
): StoredMatch {
  const agent = ensureAgent(entry.agent);
  const outcome = eloOutcome(entry.status, entry.scores.task_completion_score);
  const played = matches.filter((match) => match.agent_slug === agent.slug).length;
  const delta = eloDelta(agent.elo, outcome, played);
  agent.elo += delta;

  const stored: StoredMatch = {
    ...entry,
    elo_delta: delta,
    agent: agent.name,
    agent_slug: agent.slug,
    stored_at: new Date().toISOString(),
  };
  matches.unshift(stored);
  if (matches.length > MAX) matches.pop();
  return stored;
}

export function listMatches(): StoredMatch[] {
  return [...matches];
}

export function listMatchesForAgent(slug: string): StoredMatch[] {
  return matches.filter((match) => match.agent_slug === slug);
}

export function getMatch(matchId: string): StoredMatch | undefined {
  return matches.find((match) => match.match_id === matchId);
}

export function getAgent(slug: string): ArenaAgent | undefined {
  return snapshot().find((agent) => agent.slug === slug);
}

export function updateAgentLook(
  slug: string,
  patch: { tagline?: string | null; accent?: AgentAccent; avatarId?: AgentAvatar },
): AgentSeed | undefined {
  const agent = agents.find((row) => row.slug === slug);
  if (!agent) return undefined;
  if (patch.tagline !== undefined) agent.tagline = patch.tagline;
  if (patch.accent) agent.accent = patch.accent;
  if (patch.avatarId) agent.avatarId = patch.avatarId;
  return agent;
}

/**
 * Ranked snapshot for the public table.
 */
export function listLeaderboard(): Array<ArenaAgent & { rank: number }> {
  const ranked = snapshot()
    .filter((agent) => isPublicLeaderboardAgent(agent.slug))
    .sort((a, b) => b.elo - a.elo || b.matches - a.matches || a.name.localeCompare(b.name));
  return ranked.map((agent, index) => ({ ...agent, rank: index + 1 }));
}
