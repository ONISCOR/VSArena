"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Browser Supabase client (anon + user session cookies).
 */
export function createBrowserSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
