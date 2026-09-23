import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { User } from "@supabase/supabase-js";

/**
 * Current Auth user, or null if signed out / Supabase off.
 */
export async function getSessionUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}
