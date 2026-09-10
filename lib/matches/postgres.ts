// Assumption: uses existing MVP tables (no slug column). Slugs are derived from agent.name.

import { createAdminSupabase } from "@/lib/supabase/admin";
import { armFailed } from "@/lib/eval/control";
import { verifyStoredReceipt } from "@/lib/eval/receipt";
import { manifestFromStored, parseTorqueTelemetry } from "@/lib/eval/storedEval";
import { dedupeAgentRows } from "@/lib/matches/dedupe";
import { agentSlug, type ArenaAgent, type StoredMatch } from "@/lib/matches/memory";
import { decorateAgents } from "@/lib/gamification/decorate";
import type { AgentAccent, AgentAvatar } from "@/lib/gamification/identity";
import { isPublicLeaderboardAgent } from "@/lib/matches/placeholders";
import { eloDelta } from "@/lib/scoring/elo";
import { ensureProfile } from "@/lib/supabase/profile";

const HOUSE_EMAIL = "house@vsarena.dev";
const HOUSE_USERNAME = "vsarena-house";

export const HOUSE_AGENTS: Array<{ name: string; description: string; repo_url: string }> = [
  {
    name: "Baseline-IK",
    description: "Geometric inverse-kinematics reference (state track, not a VLA).",
    repo_url: "https://github.com/ONISCOR/VSArena",
  },
];

interface AgentRow {
  id: string;
  name: string;
  elo_rating: number | null;
  created_at?: string | null;
  description?: string | null;
  tagline?: string | null;
  accent?: string | null;
  avatar_id?: string | null;
  owner_id?: string | null;
  matches?: Array<{ count: number }>;
}

interface PulseRow {
  agent_id: string;
  at: string;
  stacked: boolean;
  signed: boolean;
  scoredFailed: boolean;
  controlFailed: boolean | null;
}

function isMissingColumn(error: { message?: string; code?: string } | null): boolean {
  const message = (error?.message ?? "").toLowerCase();
  return message.includes("does not exist") || error?.code === "42703" || error?.code === "PGRST204";
}

async function fetchAgentTable(): Promise<AgentRow[]> {
  const admin = createAdminSupabase();
  const full = await admin
    .from("agents")
    .select("id, name, description, elo_rating, created_at, tagline, accent, avatar_id, owner_id");
  if (!full.error) {
    return (full.data ?? []) as AgentRow[];
  }
  if (!isMissingColumn(full.error)) throw full.error;
  const basic = await admin.from("agents").select("id, name, description, elo_rating, created_at, owner_id");
  if (basic.error) throw basic.error;
  return (basic.data ?? []) as AgentRow[];
}

function storedMatchFromRow(input: {
  id: string;
  agentName: string;
  status: string;
  spatial: number;
  completion: number;
  telemetry: unknown;
  eloDelta: number;
  at: string;
}): StoredMatch {
  const telemetry = parseTorqueTelemetry(input.telemetry);
  const status = input.status === "failed" ? ("failed" as const) : ("completed" as const);
  const signed = isStoredRowSigned({
    matchId: input.id,
    agent: input.agentName,
    status,
    spatial: input.spatial,
    completion: input.completion,
    telemetry,
  });
  return {
    type: "result",
    match_id: input.id,
    status,
    scores: {
      spatial_accuracy: input.spatial,
      task_completion_score: input.completion,
      joint_torque_telemetry: { peak: telemetry.peak, avg: telemetry.avg, eval: telemetry.eval },
    },
    elo_delta: input.eloDelta,
    agent: input.agentName,
    agent_slug: agentSlug(input.agentName),
    stored_at: input.at,
    failure: telemetry.eval?.failure,
    provenance: telemetry.eval?.provenance,
    control: telemetry.eval?.control ?? undefined,
    signature: signed ? telemetry.eval?.signature : undefined,
  };
}

function isStoredRowSigned(input: {
  matchId: string;
  agent: string;
  status: "completed" | "failed";
  spatial: number;
  completion: number;
  telemetry: ReturnType<typeof parseTorqueTelemetry>;
}): boolean {
  const blob = input.telemetry.eval;
  if (!blob?.signature) return false;
  return verifyStoredReceipt(
    manifestFromStored({
      matchId: input.matchId,
      agent: input.agent,
      status: input.status,
      scores: {
        spatial_accuracy: input.spatial,
        task_completion_score: input.completion,
        peak: input.telemetry.peak,
        avg: input.telemetry.avg,
      },
      eval: blob,
    }),
    blob,
  );
}

async function fetchPulses(): Promise<PulseRow[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("matches")
    .select("id, agent_id, created_at, completed_at, status, task_completion_score, spatial_accuracy, joint_torque_telemetry");
  if (error) throw error;
  const agents = await fetchAgentTable();
  const names = new Map(agents.map((row) => [String(row.id), String(row.name)]));
  return (data ?? []).map((row) => {
    const status = row.status === "failed" ? ("failed" as const) : ("completed" as const);
    const completion = Number(row.task_completion_score ?? 0);
    const spatial = Number(row.spatial_accuracy ?? 0);
    const telemetry = parseTorqueTelemetry(row.joint_torque_telemetry);
    const agentName = names.get(String(row.agent_id)) ?? "unknown";
    const signed = isStoredRowSigned({
      matchId: String(row.id),
      agent: agentName,
      status,
      spatial,
      completion,
      telemetry,
    });
    return {
      agent_id: String(row.agent_id),
      at: String(row.completed_at ?? row.created_at),
      stacked: status !== "failed" && completion >= 1,
      signed,
      scoredFailed: armFailed(completion, status),
      controlFailed: telemetry.eval?.control
        ? armFailed(telemetry.eval.control.task_completion_score, telemetry.eval.control.status)
        : null,
    };
  });
}

async function loadDecorated(): Promise<{ rows: AgentRow[]; agents: ArenaAgent[] }> {
  const raw = await fetchAgentTable();
  const pulses = await fetchPulses();
  const counts = new Map<string, number>();
  for (const pulse of pulses) {
    counts.set(pulse.agent_id, (counts.get(pulse.agent_id) ?? 0) + 1);
  }
  const rows = dedupeAgentRows(
    raw.map((row) => ({
      ...row,
      id: String(row.id),
      name: String(row.name),
      elo_rating: row.elo_rating ?? 1200,
      created_at: row.created_at ? String(row.created_at) : null,
      matches: [{ count: counts.get(String(row.id)) ?? 0 }],
    })),
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  const agents = decorateAgents(
    rows.map((row) => ({
      slug: agentSlug(row.name),
      name: row.name,
      elo: row.elo_rating ?? 1200,
      description: row.description ?? null,
      tagline: row.tagline ?? null,
      accent: row.accent,
      avatarId: row.avatar_id,
      createdAt: row.created_at ?? null,
    })),
    pulses.flatMap((pulse) => {
      const row = byId.get(pulse.agent_id);
      if (!row) return [];
      return [
        {
          slug: agentSlug(row.name),
          at: pulse.at,
          stacked: pulse.stacked,
          signed: pulse.signed,
          scoredFailed: pulse.scoredFailed,
          controlFailed: pulse.controlFailed,
        },
      ];
    }),
  );
  return { rows, agents };
}

async function loadAgents(): Promise<AgentRow[]> {
  const { rows } = await loadDecorated();
  return rows;
}

async function houseOwnerId(): Promise<string> {
  const admin = createAdminSupabase();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", HOUSE_USERNAME)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile?.id) return profile.id as string;

  const { data: anyProfile, error: anyError } = await admin.from("profiles").select("id").limit(1).maybeSingle();
  if (anyError) throw anyError;
  if (anyProfile?.id) return anyProfile.id as string;

  const created = await admin.auth.admin.createUser({
    email: HOUSE_EMAIL,
    email_confirm: true,
    user_metadata: { user_name: HOUSE_USERNAME },
  });
  if (created.error && !created.error.message.toLowerCase().includes("already")) {
    throw created.error;
  }
  const userId =
    created.data.user?.id ??
    (await (async () => {
      const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listed.error) throw listed.error;
      const found = listed.data.users.find((user) => user.email === HOUSE_EMAIL);
      if (!found) throw new Error("house auth user missing");
      return found.id;
    })());

  const { data: user } = await admin.auth.admin.getUserById(userId);
  if (user.user) await ensureProfile(user.user);
  else {
    const { error } = await admin.from("profiles").upsert({
      id: userId,
      username: HOUSE_USERNAME,
      github_url: "https://github.com/ONISCOR",
    });
    if (error) throw error;
  }
  return userId;
}

/**
 * Upsert house seed agents. Uses ON CONFLICT so concurrent serverless cold starts cannot duplicate rows.
 *
 * @example await ensureHouseAgents()
 */
export async function ensureHouseAgents(): Promise<void> {
  const admin = createAdminSupabase();
  const ownerId = await houseOwnerId();
  const { error: upsertError } = await admin.from("agents").upsert(
    HOUSE_AGENTS.map((agent) => ({
      owner_id: ownerId,
      name: agent.name,
      description: agent.description,
      repo_url: agent.repo_url,
      elo_rating: 1200,
    })),
    { onConflict: "name", ignoreDuplicates: true },
  );
  if (upsertError) throw upsertError;
  const { error: lookError } = await admin
    .from("agents")
    .update({
      tagline: "House geometry seed. Not a VLA.",
      accent: "orange",
      avatar_id: "cobot",
    })
    .eq("name", "Baseline-IK")
    .is("tagline", null);
  if (lookError && !isMissingColumn(lookError)) {
    console.error("[matches] house look:", lookError.message);
  }
}

/**
 * Ranked public table from Postgres.
 *
 * @example const rows = await listLeaderboardPostgres()
 */
export async function listLeaderboardPostgres(): Promise<Array<ArenaAgent & { rank: number }>> {
  await ensureHouseAgents();
  const { agents } = await loadDecorated();
  return agents
    .filter((agent) => isPublicLeaderboardAgent(agent.slug))
    .sort((a, b) => b.elo - a.elo || b.matches - a.matches || a.name.localeCompare(b.name))
    .map((agent, index) => ({ ...agent, rank: index + 1 }));
}

export async function getAgentPostgres(slug: string): Promise<ArenaAgent | undefined> {
  const { agents } = await loadDecorated();
  return agents.find((agent) => agent.slug === slug);
}

export async function listMatchesForAgentPostgres(slug: string): Promise<StoredMatch[]> {
  const admin = createAdminSupabase();
  const rows = await loadAgents();
  const agent = rows.find((row) => agentSlug(row.name) === slug);
  if (!agent) return [];
  const { data, error } = await admin
    .from("matches")
    .select("id, status, spatial_accuracy, task_completion_score, joint_torque_telemetry, elo_delta, created_at, completed_at")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data ?? []).map((row) =>
    storedMatchFromRow({
      id: String(row.id),
      agentName: agent.name,
      status: String(row.status ?? "completed"),
      spatial: Number(row.spatial_accuracy ?? 0),
      completion: Number(row.task_completion_score ?? 0),
      telemetry: row.joint_torque_telemetry,
      eloDelta: Number(row.elo_delta ?? 0),
      at: String(row.completed_at ?? row.created_at),
    }),
  );
}

export async function listMatchesPostgres(): Promise<StoredMatch[]> {
  const agents = await loadAgents();
  const byId = new Map(agents.map((row) => [row.id, row]));
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("matches")
    .select("id, agent_id, status, spatial_accuracy, task_completion_score, joint_torque_telemetry, elo_delta, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const agent = byId.get(String(row.agent_id));
    if (!agent) return [];
    return [
      storedMatchFromRow({
        id: String(row.id),
        agentName: agent.name,
        status: String(row.status ?? "completed"),
        spatial: Number(row.spatial_accuracy ?? 0),
        completion: Number(row.task_completion_score ?? 0),
        telemetry: row.joint_torque_telemetry,
        eloDelta: Number(row.elo_delta ?? 0),
        at: String(row.completed_at ?? row.created_at),
      }),
    ];
  });
}

/**
 * Persist a result, update ELO, return the stored row. Service-role only.
 *
 * @example await recordMatchPostgres({ agent: "Baseline-IK", ...result })
 */
export async function recordMatchPostgres(
  entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & { agent: string },
): Promise<StoredMatch> {
  await ensureHouseAgents();
  const admin = createAdminSupabase();
  const slug = agentSlug(entry.agent);
  const rows = await loadAgents();
  let row = rows.find((item) => agentSlug(item.name) === slug);
  if (!row) {
    const ownerId = await houseOwnerId();
    const { error: upsertError } = await admin.from("agents").upsert(
      {
        owner_id: ownerId,
        name: entry.agent,
        elo_rating: 1200,
      },
      { onConflict: "name", ignoreDuplicates: true },
    );
    if (upsertError) throw upsertError;
    const reloaded = await loadAgents();
    row = reloaded.find((item) => agentSlug(item.name) === slug);
    if (!row) throw new Error("agent upsert failed");
  }

  const matchesPlayed = row.matches?.[0]?.count ?? 0;
  const rating = row.elo_rating ?? 1200;
  const outcome = entry.status === "failed" ? 0 : entry.scores.task_completion_score;
  const delta = eloDelta(rating, outcome, matchesPlayed);
  const now = new Date().toISOString();

  const { error: eloError } = await admin.from("agents").update({ elo_rating: rating + delta }).eq("id", row.id);
  if (eloError) throw eloError;

  const insert: Record<string, unknown> = {
    agent_id: row.id,
    task_type: "block_stacking",
    spatial_accuracy: entry.scores.spatial_accuracy,
    task_completion_score: entry.scores.task_completion_score,
    joint_torque_telemetry: entry.scores.joint_torque_telemetry,
    elo_delta: delta,
    status: entry.status,
    completed_at: now,
  };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entry.match_id)) {
    insert.id = entry.match_id;
  }

  const { error: matchError } = await admin.from("matches").insert(insert);
  if (matchError) throw matchError;

  return {
    ...entry,
    elo_delta: delta,
    agent: row.name,
    agent_slug: slug,
    stored_at: now,
  };
}

/**
 * Owner cosmetic patch. Returns null if the slug is missing.
 *
 * @example await updateAgentLookPostgres(ownerId, "ada-stack", { accent: "magenta" })
 */
export async function updateAgentLookPostgres(
  ownerId: string,
  slug: string,
  patch: { tagline: string | null; accent: AgentAccent; avatarId: AgentAvatar },
): Promise<ArenaAgent | null> {
  const { rows } = await loadDecorated();
  const row = rows.find((item) => agentSlug(item.name) === slug);
  if (!row || row.owner_id !== ownerId) return null;
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("agents")
    .update({
      tagline: patch.tagline,
      accent: patch.accent,
      avatar_id: patch.avatarId,
    })
    .eq("id", row.id)
    .eq("owner_id", ownerId);
  if (error) {
    if (isMissingColumn(error)) {
      throw new Error("identity columns missing — run supabase/gamification.sql");
    }
    throw error;
  }
  const { agents } = await loadDecorated();
  return agents.find((agent) => agent.slug === slug) ?? null;
}
