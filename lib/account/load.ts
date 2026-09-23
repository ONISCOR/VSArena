import { githubDisplayName, githubUsername } from "@/lib/auth/identity";
import { getSessionUser } from "@/lib/auth/session";
import { listMatchesForAgents, type StoredMatch } from "@/lib/matches/store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/supabase/env";
import { ensureProfile } from "@/lib/supabase/profile";
import { createServerSupabase } from "@/lib/supabase/server";

export interface AccountAgentRow {
  id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  elo_rating: number;
  tagline: string | null;
  accent: string;
  avatar_id: string;
}

export type AccountContext =
  | { kind: "unconfigured" }
  | { kind: "anon" }
  | {
      kind: "ready";
      username: string;
      handle: string;
      githubUrl: string | null;
      email: string | null;
      createdAt: string | null;
      apiKey: string;
      agents: AccountAgentRow[];
      runs: StoredMatch[];
    };

/**
 * Session + profile + agents for Account and Submit.
 */
export async function loadAccountContext(): Promise<AccountContext> {
  if (!isSupabaseConfigured()) return { kind: "unconfigured" };

  const user = await getSessionUser();
  if (!user) return { kind: "anon" };

  await ensureProfile(user);
  const client = hasServiceRole() ? createAdminSupabase() : createServerSupabase();
  const { data: profile } = await client
    .from("profiles")
    .select("username, github_url, api_key, created_at")
    .eq("id", user.id)
    .maybeSingle();
  const { data: agents, error } = await client
    .from("agents")
    .select("id, name, description, repo_url, elo_rating, tagline, accent, avatar_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const rows = error
    ? ((
        await client
          .from("agents")
          .select("id, name, description, repo_url, elo_rating")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
      ).data ?? [])
    : (agents ?? []);

  const handle = githubUsername(user);
  const owned = rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    repo_url: (row.repo_url as string | null) ?? null,
    elo_rating: Number(row.elo_rating ?? 1200),
    tagline: "tagline" in row ? ((row.tagline as string | null) ?? null) : null,
    accent: "accent" in row ? String(row.accent ?? "cyan") : "cyan",
    avatar_id: "avatar_id" in row ? String(row.avatar_id ?? "cobot") : "cobot",
  }));
  const runs = await listMatchesForAgents(owned.map((agent) => ({ id: agent.id, name: agent.name })));

  return {
    kind: "ready",
    username: githubDisplayName(user),
    handle,
    githubUrl:
      typeof profile?.github_url === "string" ? profile.github_url : `https://github.com/${handle}`,
    email: typeof user.email === "string" && user.email.length > 0 ? user.email : null,
    createdAt: typeof profile?.created_at === "string" ? profile.created_at : null,
    apiKey: typeof profile?.api_key === "string" ? profile.api_key : "",
    agents: owned,
    runs,
  };
}
