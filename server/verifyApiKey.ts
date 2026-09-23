/** Lookup `profiles.api_key` via service role. Dev fallback: accept if Supabase is missing. */

import { createAdminSupabase } from "../lib/supabase/admin";
import { hasServiceRole } from "../lib/supabase/env";

export interface ApiKeyOk {
  ok: true;
  username: string;
  /** Profile uuid. Null only in open-dev (no service role). */
  profileId: string | null;
}

export interface ApiKeyBad {
  ok: false;
  reason: string;
}

/**
 * Validate a harness hello key against Postgres.
 */
export async function verifyHarnessApiKey(apiKey: string): Promise<ApiKeyOk | ApiKeyBad> {
  const trimmed = apiKey.trim();
  if (!trimmed) return { ok: false, reason: "api_key required" };
  if (!hasServiceRole()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[vsarena-harness] SUPABASE_SERVICE_ROLE_KEY required in production");
      return { ok: false, reason: "harness misconfigured: service role missing" };
    }
    console.warn("[vsarena-harness] no SUPABASE_SERVICE_ROLE_KEY — accepting any api_key (dev only)");
    return { ok: true, username: "dev", profileId: null };
  }
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username")
    .eq("api_key", trimmed)
    .maybeSingle();
  if (error) {
    console.error("[vsarena-harness] api_key lookup failed", error.message);
    return { ok: false, reason: "api_key lookup failed" };
  }
  if (!data?.username || !data?.id) return { ok: false, reason: "invalid api_key" };
  return { ok: true, username: String(data.username), profileId: String(data.id) };
}
