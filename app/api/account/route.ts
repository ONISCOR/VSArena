import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { ensureProfile } from "@/lib/supabase/profile";
import { createServerSupabase } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/env";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { parseAccent, parseAvatar, parseTagline } from "@/lib/gamification/identity";

export const dynamic = "force-dynamic";

async function loadProfile(userId: string) {
  const client = hasServiceRole() ? createAdminSupabase() : createServerSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("id, username, github_url, api_key, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Own profile + API key + agents.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await ensureProfile(user);
    const profile = await loadProfile(user.id);
    if (!profile) return NextResponse.json({ error: "profile missing" }, { status: 404 });
    const client = hasServiceRole() ? createAdminSupabase() : createServerSupabase();
    const full = await client
      .from("agents")
      .select("id, name, description, repo_url, elo_rating, created_at, tagline, accent, avatar_id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    const agents = full.error
      ? (
          await client
            .from("agents")
            .select("id, name, description, repo_url, elo_rating, created_at")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false })
        ).data
      : full.data;
    if (full.error && !agents) throw full.error;
    return NextResponse.json({ profile, agents: agents ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "account failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Rotate the API key. Previous key stops working immediately.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: {
    action?: string;
    name?: string;
    repo_url?: string;
    description?: string;
    id?: string;
    tagline?: string;
    accent?: string;
    avatar_id?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  await ensureProfile(user);

  if (body.action === "rotate") {
    const nextKey = globalThis.crypto.randomUUID();
    const { error } = await supabase.from("profiles").update({ api_key: nextKey }).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ api_key: nextKey });
  }

  if (body.action === "create-agent") {
    const name = (body.name ?? "").trim();
    if (name.length < 2 || name.length > 48) {
      return NextResponse.json({ error: "agent name must be 2–48 characters" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("agents")
      .insert({
        owner_id: user.id,
        name,
        description: (body.description ?? "").trim() || null,
        repo_url: (body.repo_url ?? "").trim() || null,
        elo_rating: 1200,
      })
      .select("id, name, description, repo_url, elo_rating, created_at")
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "agent name already taken" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ agent: data }, { status: 201 });
  }

  if (body.action === "update-agent") {
    const id = (body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "agent id required" }, { status: 400 });
    const payload = {
      tagline: parseTagline(body.tagline),
      accent: parseAccent(body.accent),
      avatar_id: parseAvatar(body.avatar_id),
    };
    const { data, error } = await supabase
      .from("agents")
      .update(payload)
      .eq("id", id)
      .eq("owner_id", user.id)
      .select("id, name, description, repo_url, elo_rating, tagline, accent, avatar_id")
      .maybeSingle();
    if (error) {
      const missing = error.message.toLowerCase().includes("does not exist") || error.code === "PGRST204";
      if (missing) {
        return NextResponse.json(
          { error: "identity columns missing — run supabase/gamification.sql" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "agent not found" }, { status: 404 });
    return NextResponse.json({ agent: data });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
