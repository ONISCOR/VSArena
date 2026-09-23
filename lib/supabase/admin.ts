import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { hasServiceRole, supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role client. Server-only — bypasses RLS. Never import from client components.
 *
 * Assumption: Node < 22 has no native WebSocket; supabase-js realtime needs `ws` as transport
 * (harness Docker is Node 20). Browser / Edge never import this module.
 */
export function createAdminSupabase() {
  if (!hasServiceRole()) {
    throw new Error("Supabase service role is not configured");
  }
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    // Required on Node < 22; harmless when native WebSocket exists.
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
}
