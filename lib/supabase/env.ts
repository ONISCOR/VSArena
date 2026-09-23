/** Assumption: URL + anon are public; service role is server-only and never prefixed NEXT_PUBLIC_. */

export function supabaseUrl(): string {
  // Static identifier so Next inlines this into the client bundle (process.env[name] would be empty in the browser).
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
}

export function supabaseAnonKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
}

export function supabaseServiceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}

/**
 * True when browser/server anon client can be constructed.
 */
export function isSupabaseConfigured(): boolean {
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  return url.startsWith("https://") && !url.includes("YOUR_PROJECT") && anon.length > 40;
}

/**
 * True when match writes can use the service role (bypasses RLS).
 */
export function hasServiceRole(): boolean {
  return isSupabaseConfigured() && supabaseServiceRoleKey().length > 40;
}
