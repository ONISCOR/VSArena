import { NextResponse } from "next/server";
import { hasServiceRole } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/profile";

/**
 * Exchange the OAuth `code` for a session and send the user home.
 * Used by `/auth/callback` and `/auth/v1/callback` (GitHub sometimes hits the latter on localhost).
 */
export async function handleAuthCallback(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=code`);
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?reason=session`);
  }

  if (hasServiceRole()) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      try {
        await ensureProfile(data.user);
      } catch (profileError) {
        console.error("[auth] profile upsert failed", profileError);
      }
    }
  }

  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(`${origin}${dest}`);
}
