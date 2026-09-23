import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Server Supabase client bound to the incoming request cookies.
 */
export function createServerSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const cookieStore = cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — middleware refreshes the session.
        }
      },
    },
  });
}
