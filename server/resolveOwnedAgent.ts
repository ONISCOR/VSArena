/** Resolve a leaderboard agent that the authenticated profile is allowed to score. */

import { createAdminSupabase } from "../lib/supabase/admin";
import { hasServiceRole } from "../lib/supabase/env";

export type OwnedAgentOk = { ok: true; agentName: string };
export type OwnedAgentBad = { ok: false; reason: string; code: "protocol.agent_unregistered" | "protocol.agent_forbidden" };

/**
 * Agent names on official matches must already exist and be owned by `profileId`.
 * Open-dev (no service role) skips the check.
 */
export async function resolveOwnedAgent(input: {
  profileId: string | null;
  agentName: string;
}): Promise<OwnedAgentOk | OwnedAgentBad> {
  const agentName = input.agentName.trim();
  if (!agentName) {
    return { ok: false, reason: "agent name required", code: "protocol.agent_unregistered" };
  }
  if (!input.profileId || !hasServiceRole()) {
    if (process.env.NODE_ENV === "production" && !input.profileId) {
      return { ok: false, reason: "profile id missing", code: "protocol.agent_forbidden" };
    }
    return { ok: true, agentName };
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("agents")
    .select("id, name, owner_id")
    .ilike("name", agentName)
    .limit(5);
  if (error) {
    console.error("[vsarena-harness] agent ownership lookup failed", error.message);
    return { ok: false, reason: "agent lookup failed", code: "protocol.agent_unregistered" };
  }
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const exact =
    rows.find((row) => String(row.name) === agentName) ??
    rows.find((row) => String(row.name).toLowerCase() === agentName.toLowerCase());
  if (!exact?.id) {
    return {
      ok: false,
      reason: `agent "${agentName}" is not registered — create it on /account first`,
      code: "protocol.agent_unregistered",
    };
  }
  if (String(exact.owner_id) !== input.profileId) {
    return {
      ok: false,
      reason: `agent "${agentName}" is owned by another account`,
      code: "protocol.agent_forbidden",
    };
  }
  return { ok: true, agentName: String(exact.name) };
}
